import { Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { take } from 'rxjs/operators';
import * as AuthSelectors from '../../../auth/store/auth/selectors/auth.selectors';
import * as AvailabilityActions from '../../store-availability/actions/availability.actions';
import { DialogManagementService } from '../dialog/dialog-management.service';
import { DialogDataService } from '../dialog/dialog-data.service';
import { Availability } from '../../models/availability.models';
import { AvailabilityService } from '../availability.service';
import { BusinessLogicService } from '../../services/business/business-logic.service';
import { CalendarOperationsService } from '../calendar/calendar-operations.service';

@Injectable({
  providedIn: 'root'
})
export class AvailabilityDialogService {
  constructor(
    private dialog: MatDialog,
    private store: Store,
    private dialogService: DialogManagementService,
    private dialogDataService: DialogDataService
  ) {}

  /**
   * Handle the add availability keyboard shortcut
   */
  handleAddAvailabilityShortcut(): void {
    // Check if a dialog is already open
    if (this.dialogService.isAvailabilityDialogOpen()) {
      this.dialogService.focusExistingAvailabilityDialog();
      return;
    }
    
    console.log('Opening new availability dialog via keyboard shortcut');
    // Open the add availability dialog with today's date
    const today = new Date();
    const dialogRef = this.dialogService.openAvailabilityDialog(
      this.dialogDataService.prepareAvailabilityDialogData(
        null, 
        today,
        today,
        new Date(today.getTime() + 60 * 60 * 1000) // Add 1 hour
      )
    );

    dialogRef.afterClosed().subscribe((result: any) => {
      console.log('Dialog closed with result:', result);
      // The dialog component now handles automatic refresh, so we don't need to do it here
    });
  }

  /**
   * Opens the availability dialog to add a new availability slot
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
      // The dialog component now handles automatic refresh, so we don't need to do it here
    });
  }

  /**
   * Edit an existing availability slot
   */
  editSlot(selectedSlot: Availability | null): void {
    if (selectedSlot) {
      // Check if a dialog is already open
      if (this.dialogService.isAvailabilityDialogOpen()) {
        this.dialogService.focusExistingAvailabilityDialog();
        return;
      }
      
      console.log('Opening edit availability dialog for slot:', selectedSlot);
      const dialogRef = this.dialogService.openAvailabilityDialog({
        availability: selectedSlot, 
        date: selectedSlot.date ? new Date(selectedSlot.date) : new Date(selectedSlot.startTime)
      });

      dialogRef.afterClosed().subscribe((result: any) => {
        console.log('Dialog closed with result:', result);
        if (result) {
          // The dialog component will dispatch the update action
          // No additional action needed here
        }
      });
    }
  }

  /**
   * Delete an existing availability slot
   */
  deleteSlot(selectedSlot: Availability | null): void {
    if (selectedSlot) {
      const dialogRef = this.dialogService.openConfirmationDialog({
        title: 'Delete Availability Slot',
        message: 'Are you sure you want to delete this availability slot? This action cannot be undone.',
        confirmText: 'Delete',
        cancelText: 'Cancel'
      });

      dialogRef.afterClosed().subscribe((result: any) => {
        if (result) {
          this.store.dispatch(AvailabilityActions.deleteAvailability({ id: selectedSlot.id }));
        }
      });
    }
  }

  /**
   * Copy week schedule
   * @param availability$ Observable of availability data
   * @param businessLogicService Business logic service for copy operations
   */
  copyWeekSchedule(availability$: Observable<Availability[]>, businessLogicService: BusinessLogicService): void {
    const dialogRef = this.dialogService.openCopyWeekDialog(this.dialogDataService.prepareCopyWeekDialogData());

    dialogRef.afterClosed().subscribe((result: any) => {
      if (result && result.sourceWeek && result.targetWeek) {
        // Call the copy week schedule method
        businessLogicService.copyWeekSchedule(result.sourceWeek, result.targetWeek, availability$);
      }
    });
  }

  /**
   * Open date picker dialog
   */
  openDatePicker(calendarComponent: any): void {
    const dialogRef = this.dialogService.openDatePickerDialog(
      this.dialogDataService.prepareDatePickerDialogData(new Date())
    );

    dialogRef.afterClosed().subscribe((result: any) => {
      if (result && calendarComponent) {
        // Note: The component that calls this method should handle the actual date picker operation
      }
    });
  }

  
}