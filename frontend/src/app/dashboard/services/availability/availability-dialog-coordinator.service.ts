import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { take } from 'rxjs/operators';
import * as AuthSelectors from '../../../auth/store/auth/selectors/auth.selectors';
import * as AvailabilityActions from '../../store-availability/actions/availability.actions';
import { Availability } from '../../models/availability.models';
import { DialogManagementService } from '../dialog/dialog-management.service';
import { DialogDataService } from '../dialog/dialog-data.service';
import { SnackbarService } from '../../../shared/services/snackbar.service';
import { PendingChangesService } from '../pending-changes';
import { Change } from '../pending-changes/pending-changes.interface';

@Injectable({
  providedIn: 'root'
})
export class AvailabilityDialogCoordinatorService {
  constructor(
    private store: Store,
    private dialogService: DialogManagementService,
    private dialogDataService: DialogDataService,
    private snackbarService: SnackbarService,
    private pendingChangesService: PendingChangesService
  ) {}

  /**
   * Add a new availability slot
   */
  addAvailability(): void {
    const today = new Date();
    // Check if a dialog is already open
    if (this.dialogService.isAvailabilityDialogOpen()) {
      this.dialogService.focusExistingAvailabilityDialog();
      return;
    }
    
    console.log('Opening new availability dialog');
    const dialogRef = this.dialogService.openAvailabilityDialog({
      availability: null, 
      date: today,
      startDate: today,
      endDate: new Date(today.getTime() + 60 * 60 * 1000) // Add 1 hour
    });

    dialogRef.afterClosed().subscribe((result: any) => {
      console.log('Dialog closed with result:', result);
      // The dialog now handles adding to pending changes internally,
      // so we don't need to check or add them here anymore.
      // This prevents duplicate additions to pending changes.
      if (result) {
        const today = new Date();
        const targetDate: Date = Array.isArray(result) && result.length > 0
          ? new Date(result[0].startTime || result[0].date || today)
          : today;
        this.store.select(AuthSelectors.selectUserId).pipe(take(1)).subscribe(userId => {
          if (userId) {
            this.store.dispatch(AvailabilityActions.loadAvailability({ providerId: userId, date: targetDate }));
          }
        });
      }
    });
  }

  /**
   * Edit an availability slot
   * @param slot The slot to edit
   */
  editSlot(slot: Availability): void {
    // Check if a dialog is already open
    if (this.dialogService.isAvailabilityDialogOpen()) {
      this.dialogService.focusExistingAvailabilityDialog();
      return;
    }
    
    console.log('Opening edit availability dialog for slot:', slot);
    const dialogRef = this.dialogService.openAvailabilityDialog({
      availability: slot, 
      date: slot.date
    });

    dialogRef.afterClosed().subscribe((result: any) => {
      console.log('Dialog closed with result:', result);
      // The dialog now handles adding to pending changes internally,
      // so we don't need to add them here anymore.
      // This prevents duplicate additions to pending changes.
    });
  }

  /**
   * Delete an availability slot
   * @param slot The slot to delete
   */
  deleteSlot(slot: Availability): void {
    const dialogRef = this.dialogService.openConfirmationDialog({
      title: 'Delete Availability Slot',
      message: 'Are you sure you want to delete this availability slot? This action cannot be undone.',
      confirmText: 'Delete',
      cancelText: 'Cancel'
    });

    dialogRef.afterClosed().subscribe((result: any) => {
      if (result) {
        // Instead of directly deleting, add to pending changes
        const change: Change = {
          id: `delete-${slot.id}-${Date.now()}`,
          type: 'delete',
          entityId: slot.id,
          // For delete operations, we typically don't need the full entity
          timestamp: new Date()
        };
        this.pendingChangesService.addChange(change);
      }
    });
  }

  /**
   * Open the copy week dialog
   * @param availability$ Observable of current availability
   * @param snackbarService Snackbar service for notifications
   */
  openCopyWeekDialog(
    availability$: Observable<Availability[]>,
    snackbarService: SnackbarService
  ): void {
    const dialogRef = this.dialogService.openCopyWeekDialog();

    dialogRef.afterClosed().subscribe((result: { sourceWeek: Date, targetWeek: Date, conflictResolution: 'skip' | 'replace' }) => {
      if (result) {
        this.handleCopyWeek(result, availability$, snackbarService);
      }
    });
  }

  /**
   * Handle the copy week operation
   * @param result The copy week dialog result
   * @param availability$ Observable of current availability
   */
  handleCopyWeek(
    result: { sourceWeek: Date, targetWeek: Date, conflictResolution: 'skip' | 'replace' },
    availability$: Observable<Availability[]>,
    snackbarService: SnackbarService
  ): void {
    const { sourceWeek, targetWeek, conflictResolution } = result;

    // 1. Get user ID
    this.store.select(AuthSelectors.selectUserId).pipe(take(1)).subscribe(userId => {
      if (!userId) {
        snackbarService.showError('User not found. Please log in again.');
        return;
      }

      // 2. Get current availability
      availability$.pipe(take(1)).subscribe(availability => {
        
        // 3. Filter slots from source week
        const sourceStartDate = new Date(sourceWeek);
        sourceStartDate.setDate(sourceStartDate.getDate() - sourceStartDate.getDay()); // Start of the week (Sunday)
        sourceStartDate.setHours(0, 0, 0, 0);

        const sourceEndDate = new Date(sourceStartDate);
        sourceEndDate.setDate(sourceEndDate.getDate() + 7); // End of the week (next Sunday)

        const sourceSlots = availability.filter(slot => {
          const slotDate = new Date(slot.startTime);
          return slotDate >= sourceStartDate && slotDate < sourceEndDate;
        });

        if (sourceSlots.length === 0) {
          snackbarService.showInfo('No availability slots found in the source week to copy.');
          return;
        }

        // 4. Calculate date offset
        const targetStartDate = new Date(targetWeek);
        targetStartDate.setDate(targetStartDate.getDate() - targetStartDate.getDay()); // Start of the target week (Sunday)
        targetStartDate.setHours(0, 0, 0, 0);
        
        const dateOffset = targetStartDate.getTime() - sourceStartDate.getTime();

        // 5. Create new slots for target week
        const newSlots = sourceSlots.map(slot => {
          const newStartTime = new Date(new Date(slot.startTime).getTime() + dateOffset);
          const newEndTime = new Date(new Date(slot.endTime).getTime() + dateOffset);
          
          // Create a new object without the original id and assign a temporary ID
          const { id, ...newSlot } = {
            ...slot,
            startTime: newStartTime,
            endTime: newEndTime,
            date: newStartTime, // Ensure date is updated
            isBooked: false // Copied slots should not be booked
          };
          
          // Assign a temporary ID so the calendar service can detect it as a new event
          const slotWithTempId = {
            ...newSlot,
            id: `temp-${Date.now()}-${Math.random()}`
          } as Availability;
          
          return slotWithTempId;
        });

        // 6. Add to pending changes (these are new slots that haven't been created yet)
        newSlots.forEach(slot => {
          const change: Change = {
            id: `create-${Date.now()}-${Math.random()}`,
            type: 'create',
            entity: slot,
            timestamp: new Date()
          };
          this.pendingChangesService.addChange(change);
        });


        snackbarService.showSuccess(`Copied ${newSlots.length} slots to pending changes. Click Save to apply.`);
      });
    });
  }

  /**
   * Open the date picker dialog
   */
  openDatePicker(): void {
    const dialogRef = this.dialogService.openDatePickerDialog(
      this.dialogDataService.prepareDatePickerDialogData(new Date())
    );

    dialogRef.afterClosed().subscribe((result: any) => {
      // Handle the date picker result
      // This would typically be handled by the component that calls this method
    });
  }

  /**
   * Open the availability dialog with the provided selection info
   * @param selectInfo The date selection information
   */
  openAvailabilityDialog(selectInfo: any): void {
    console.log('Opening new availability dialog for date selection');
    const dialogRef = this.dialogService.openAvailabilityDialog({
      availability: null, 
      date: selectInfo.start,
      startDate: selectInfo.start,
      endDate: selectInfo.end,
      allDay: selectInfo.allDay
    });

    dialogRef.afterClosed().subscribe((result: any) => {
      console.log('Dialog closed with result:', result);
      // The dialog now handles adding to pending changes internally,
      // so we don't need to check or add them here anymore.
      // This prevents duplicate additions to pending changes.
    });
  }
}