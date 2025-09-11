import { Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Observable } from 'rxjs';
import { Availability } from '../../models/availability.models';
import { AvailabilityDialogComponent } from '../../components/availability-dialog/availability-dialog.component';
import { CopyWeekDialogComponent } from '../../components/copy-week-dialog/copy-week-dialog.component';
import { DatePickerDialogComponent } from '../../components/date-picker-dialog/date-picker-dialog.component';
import { ConfirmationDialogComponent } from '../../components/confirmation-dialog/confirmation-dialog.component';

@Injectable({
  providedIn: 'root'
})
export class DialogManagementService {
  constructor(private dialog: MatDialog) {}

  /**
   * Check if an availability dialog is already open
   * @returns True if an availability dialog is open, false otherwise
   */
  isAvailabilityDialogOpen(): boolean {
    return this.dialog.openDialogs.some(dialog => 
      dialog.componentInstance instanceof AvailabilityDialogComponent
    );
  }

  /**
   * Focus an existing availability dialog if one is open
   * @returns True if a dialog was focused, false otherwise
   */
  focusExistingAvailabilityDialog(): boolean {
    const existingDialog = this.dialog.openDialogs.find(dialog => 
      dialog.componentInstance instanceof AvailabilityDialogComponent
    );
    
    if (existingDialog) {
      console.log('Dialog already open, focusing existing dialog');
      existingDialog.componentInstance['dialogRef'].addPanelClass('dialog-focused');
      return true;
    }
    return false;
  }

  /**
   * Open the availability dialog
   * @param data The data to pass to the dialog
   * @returns The dialog reference
   */
  openAvailabilityDialog(data: any): any {
    return this.dialog.open(AvailabilityDialogComponent, {
      width: '400px',
      data: data
    });
  }

  /**
   * Open the confirmation dialog
   * @param data The data to pass to the dialog
   * @returns The dialog reference
   */
  openConfirmationDialog(data: any): any {
    return this.dialog.open(ConfirmationDialogComponent, {
      width: '400px',
      data: data
    });
  }

  /**
   * Open the copy week dialog
   * @param data The data to pass to the dialog
   * @returns The dialog reference
   */
  openCopyWeekDialog(data: any = {}): any {
    return this.dialog.open(CopyWeekDialogComponent, {
      width: '400px',
      data: data
    });
  }

  /**
   * Open the date picker dialog
   * @param data The data to pass to the dialog
   * @returns The dialog reference
   */
  openDatePickerDialog(data: any): any {
    return this.dialog.open(DatePickerDialogComponent, {
      width: '400px',
      data: data
    });
  }

  /**
   * Open a conflict resolution dialog with Edit/Replace/Cancel options
   */
  openConflictResolutionDialog(data: any): any {
    // Reuse ConfirmationDialogComponent for quick implementation; a dedicated component can replace this later
    return this.dialog.open(ConfirmationDialogComponent, {
      width: '500px',
      data: {
        title: data.title || 'Conflicts Detected',
        message: data.message || `Conflicts found: ${data.count}. Do you want to Replace conflicting slots or Edit them?`,
        confirmText: 'Replace',
        cancelText: 'Cancel',
        extraActions: [
          { label: 'Edit', value: 'edit' }
        ],
        conflicts: data.conflicts,
        suggestions: data.suggestions
      }
    });
  }
}