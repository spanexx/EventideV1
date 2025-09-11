import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import * as AuthSelectors from '../../../auth/store/auth/selectors/auth.selectors';
import * as AvailabilityActions from '../../store-availability/actions/availability.actions';
import { getStartOfWeek, getEndOfWeek, addDays, formatDateAsYYYYMMDD } from '../../utils/dashboard.utils';
import { take } from 'rxjs/operators';
import { BehaviorSubject } from 'rxjs';
import { AvailabilityService, CreateBulkAvailabilityDto } from '../availability.service';
import { DialogManagementService } from '../dialog/dialog-management.service';

@Injectable({
  providedIn: 'root'
})
export class BusinessLogicService {
  constructor(private store: Store, private availabilityHttp: AvailabilityService, private dialogService: DialogManagementService) {}
  // Summary state for UI banner
  summary$ = new BehaviorSubject<{ created: number; skipped: number } | null>(null);

  clearSummary(): void {
    this.summary$.next(null);
  }

  /**
   * Refresh availability for the current user
   */
  refreshAvailability(): void {
    // Get the current user and refresh availability for that user
    this.store.select(AuthSelectors.selectUserId).subscribe(userId => {
      if (userId) {
        const today = new Date();
        this.store.dispatch(AvailabilityActions.loadAvailability({ 
          providerId: userId, 
          date: today
        }));
      }
    });
  }

  /**
   * Copy week schedule from source to target week
   * @param sourceWeek The source week date
   * @param targetWeek The target week date
   * @param availability$ Observable of availability data
   */
  copyWeekSchedule(sourceWeek: Date, targetWeek: Date, availability$: any): void {
    // Get the start and end dates for the source week
    const sourceStart = getStartOfWeek(sourceWeek);
    const sourceEnd = getEndOfWeek(sourceWeek);
    
    // Get the start and end dates for the target week
    const targetStart = getStartOfWeek(targetWeek);
    
    // Calculate day offset between source and target weeks
    const msPerDay = 24 * 60 * 60 * 1000;
    const offsetDays = Math.round((targetStart.getTime() - sourceStart.getTime()) / msPerDay);
    
    // Get the current user and load availability for that user
    this.store.select(AuthSelectors.selectUserId).pipe(take(1)).subscribe(userId => {
      if (userId) {
        // Dispatch action to load availability for the source week
        this.store.dispatch(AvailabilityActions.loadAvailability({ 
          providerId: userId, 
          date: sourceStart
        }));
        
        // Get the source week's availability and validate bulk creation for the target week
        availability$.pipe(take(1)).subscribe((availability: any[]) => {
          // Filter for slots in the source week
          const sourceWeekSlots = availability.filter(slot => {
            const slotDate = new Date(slot.date || slot.startTime);
            return slotDate >= sourceStart && slotDate <= sourceEnd;
          });
          
          // Prepare bulk payload
          const slots = sourceWeekSlots.map(slot => {
            const startTime = addDays(new Date(slot.startTime), offsetDays);
            const endTime = addDays(new Date(slot.endTime), offsetDays);
            const date = slot.date ? formatDateAsYYYYMMDD(addDays(new Date(slot.date), offsetDays)) : undefined;
            return {
              startTime,
              endTime,
              duration: slot.duration,
              date
            } as any;
          });

          const idempotencyKey = this.availabilityHttp.generateIdempotencyKey('copy-week');
          const validatePayload: CreateBulkAvailabilityDto = {
            providerId: userId,
            type: 'one_off',
            slots: slots.map(s => ({ startTime: s.startTime, endTime: s.endTime, duration: s.duration })),
            dryRun: true,
            idempotencyKey
          } as any;

          // Validate first
          this.availabilityHttp.validateAvailability(validatePayload).pipe(take(1)).subscribe(validation => {
            const conflictsCount = validation?.conflicts?.length || 0;
            if (conflictsCount > 0) {
              const dialogRef = this.dialogService.openConflictResolutionDialog({
                count: conflictsCount,
                conflicts: validation.conflicts,
                suggestions: validation.suggestions
              });
              dialogRef.afterClosed().pipe(take(1)).subscribe((choice: any) => {
                if (choice === true) {
                  // Replace
                  this.availabilityHttp.createBulkAvailability({
                    providerId: userId,
                    type: 'one_off',
                    slots: slots.map(s => ({ startTime: s.startTime, endTime: s.endTime, duration: s.duration })),
                    replaceConflicts: true,
                    idempotencyKey
                  } as any).pipe(take(1)).subscribe((res: any) => {
                    const createdCount = Array.isArray(res) ? res.length : (res?.created?.length || 0);
                    const skippedCount = Array.isArray(res) ? 0 : (res?.conflicts?.length || 0);
                    this.summary$.next({ created: createdCount, skipped: skippedCount });
                    // Summarize and refresh
                    this.store.dispatch(AvailabilityActions.loadAvailability({ providerId: userId, date: targetStart }));
                  });
                } else if (choice === 'edit') {
                  // For now, use first suggestion as a quick fix for all conflicts
                  const adjusted = slots.slice();
                  (validation.suggestions || []).forEach((sug: any, idx: number) => {
                    if (adjusted[idx]) {
                      adjusted[idx].startTime = sug.alternative.startTime;
                      adjusted[idx].endTime = sug.alternative.endTime;
                    }
                  });
                  this.availabilityHttp.createBulkAvailability({
                    providerId: userId,
                    type: 'one_off',
                    slots: adjusted.map(s => ({ startTime: s.startTime, endTime: s.endTime, duration: s.duration })),
                    idempotencyKey
                  } as any).pipe(take(1)).subscribe((res: any) => {
                    const createdCount = Array.isArray(res) ? res.length : (res?.created?.length || 0);
                    const skippedCount = Array.isArray(res) ? 0 : (res?.conflicts?.length || 0);
                    this.summary$.next({ created: createdCount, skipped: skippedCount });
                    this.store.dispatch(AvailabilityActions.loadAvailability({ providerId: userId, date: targetStart }));
                  });
                } else {
                  // Cancel
                }
              });
            } else {
              // No conflicts, proceed to create
              this.availabilityHttp.createBulkAvailability({
                providerId: userId,
                type: 'one_off',
                slots: slots.map(s => ({ startTime: s.startTime, endTime: s.endTime, duration: s.duration })),
                idempotencyKey
              } as any).pipe(take(1)).subscribe((res: any) => {
                const createdCount = Array.isArray(res) ? res.length : (res?.created?.length || 0);
                const skippedCount = Array.isArray(res) ? 0 : (res?.conflicts?.length || 0);
                this.summary$.next({ created: createdCount, skipped: skippedCount });
                this.store.dispatch(AvailabilityActions.loadAvailability({ providerId: userId, date: targetStart }));
              });
            }
          });
        });
      }
    });
  }

  /**
   * Open date picker
   * @param calendarComponent The calendar component
   * @param date The date to go to
   */
  openDatePicker(calendarComponent: any, date: Date): void {
    if (calendarComponent) {
      const calendarApi = calendarComponent.getApi();
      // Check if calendarApi is available before using it
      if (calendarApi) {
        calendarApi.gotoDate(date);
      }
    }
  }
}