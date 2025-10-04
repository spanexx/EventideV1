import { Injectable } from '@angular/core';
import { KeyboardShortcutService } from '../keyboard/keyboard-shortcut.service';
import { DialogManagementService } from '../dialog/dialog-management.service';
import { DialogDataService } from '../dialog/dialog-data.service';
import { Store } from '@ngrx/store';
import * as AuthSelectors from '../../../auth/store/auth/selectors/auth.selectors';
import * as AvailabilityActions from '../../store-availability/actions/availability.actions';
import { take } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class AvailabilityKeyboardOperationsService {
  constructor(
    private keyboardShortcutService: KeyboardShortcutService,
    private dialogService: DialogManagementService,
    private dialogDataService: DialogDataService,
    private store: Store
  ) {}

  /**
   * Handle keyboard shortcuts for the availability calendar
   * @param event KeyboardEvent to handle
   * @param undo Function to execute undo
   * @param redo Function to execute redo
   * @param saveChanges Function to save changes
   * @param refreshAvailability Function to refresh availability
   * @param copySlots Function to copy slots
   * @param selectedSlot Currently selected slot
   * @param snackbarService Snackbar service for notifications
   * @param addAvailability Function to add availability
   */
  handleKeyboardShortcut(
    event: KeyboardEvent,
    undo: () => void,
    redo: () => void,
    saveChanges: () => void,
    refreshAvailability: () => void,
    copySlots: (slots: any[]) => void,
    selectedSlot: any,
    snackbarService: any,
    addAvailability: () => void
  ): void {
    // Only handle shortcuts when the calendar is focused
    if (!this.keyboardShortcutService.isCalendarFocused(event)) {
      return;
    }

    // Ctrl/Cmd + Z - Undo
    if (this.keyboardShortcutService.isUndoShortcut(event)) {
      event.preventDefault();
      undo();
      return;
    }
    
    // Ctrl/Cmd + Shift + Z or Ctrl/Cmd + Y - Redo
    if (this.keyboardShortcutService.isRedoShortcut(event)) {
      event.preventDefault();
      redo();
      return;
    }
    
    // Ctrl/Cmd + S - Save
    if ((event.ctrlKey || event.metaKey) && event.key === 's') {
      event.preventDefault();
      saveChanges();
      return;
    }
    
    // Ctrl/Cmd + C - Copy selected slot
    if ((event.ctrlKey || event.metaKey) && event.key === 'c') {
      event.preventDefault();
      if (selectedSlot) {
        copySlots([selectedSlot]);
      } else {
        snackbarService.showError('No slot selected to copy');
      }
      return;
    }
    
    // R - Refresh
    if (this.keyboardShortcutService.isRefreshShortcut(event)) {
      event.preventDefault();
      refreshAvailability();
      return;
    }
    
    // A - Add availability
    if (this.keyboardShortcutService.isAddAvailabilityShortcut(event)) {
      event.preventDefault();
      addAvailability();
      return;
    }
    
    // F5 - Refresh (standard browser refresh)
    if (this.keyboardShortcutService.isF5RefreshShortcut(event)) {
      event.preventDefault();
      refreshAvailability();
      return;
    }
  }

  /**
   * Handle the add availability keyboard shortcut
   * @param snackbarService Snackbar service for notifications
   */
  handleAddAvailabilityShortcut(snackbarService: any): void {
    // Check if a dialog is already open
    if (this.keyboardShortcutService.isAvailabilityDialogOpen()) {
      this.keyboardShortcutService.focusExistingAvailabilityDialog();
      return;
    }
    
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
      if (result) {
        // Ensure calendar refreshes for the relevant week after creation
        const fallback = new Date();
        const targetDate: Date = Array.isArray(result) && result.length > 0
          ? new Date(result[0].startTime || result[0].date || fallback)
          : fallback;
        this.store.select(AuthSelectors.selectUserId).pipe(take(1)).subscribe(userId => {
          if (userId) {
            this.store.dispatch(AvailabilityActions.loadAvailability({ providerId: userId, date: targetDate }));
          }
        });
      }
    });
  }
}