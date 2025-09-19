import { Injectable } from '@angular/core';
import { PendingChangesService } from '../pending-changes/pending-changes.service';
import { ChangesSynchronizerService } from '../pending-changes/changes-synchronizer.service';
import { UndoRedoCoordinatorService } from '../undo-redo/undo-redo-coordinator.service';
import { SnackbarService } from '../../../shared/services/snackbar.service';
import { DialogManagementService } from '../dialog/dialog-management.service';
import { Store } from '@ngrx/store';
import * as AuthSelectors from '../../../auth/store/auth/selectors/auth.selectors';
import * as AvailabilityActions from '../../store-availability/actions/availability.actions';
import { Availability } from '../../models/availability.models';
import { take } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class AvailabilityPendingChangesService {
  constructor(
    private pendingChangesService: PendingChangesService,
    private changesSynchronizerService: ChangesSynchronizerService,
    private undoRedoService: UndoRedoCoordinatorService,
    private snackbarService: SnackbarService,
    private dialogService: DialogManagementService,
    private store: Store
  ) {}

  /**
   * Save all pending changes
   * @param refreshAvailability Function to refresh availability data
   */
  saveChanges(refreshAvailability: () => void): void {
    const changes = this.pendingChangesService.getPendingChanges();
    
    if (changes.length === 0) {
      this.snackbarService.showInfo('No changes to save');
      return;
    }
    
    this.changesSynchronizerService.saveChanges(changes).subscribe(result => {
      if (result.success) {
        this.snackbarService.showSuccess(result.message);
        // Clear pending changes
        this.pendingChangesService.saveChanges();
        // Clear undo/redo stack since changes are now committed
        this.undoRedoService.onChangesSaved();
        // Refresh the calendar
        refreshAvailability();
      } else {
        this.snackbarService.showError(result.message);
        // Show failed changes if any
        if (result.failed.length > 0) {
          console.error('Failed changes:', result.failed);
        }
      }
    });
  }

  /**
   * Discard all pending changes
   * @param refreshFullCalendar Function to refresh the full calendar
   */
  discardChanges(refreshFullCalendar: (availability: Availability[]) => void): void {
    if (!this.pendingChangesService.hasPendingChanges()) {
      this.snackbarService.showInfo('No changes to discard');
      return;
    }
    
    const dialogRef = this.dialogService.openConfirmationDialog({
      title: 'Discard Changes',
      message: 'Are you sure you want to discard all pending changes? This action cannot be undone.',
      confirmText: 'Discard',
      cancelText: 'Cancel'
    });

    dialogRef.afterClosed().subscribe((result: any) => {
      if (result) {
        const originalState = this.pendingChangesService.discardChanges();
        // Clear undo/redo stack since all changes are reverted
        this.undoRedoService.onChangesDiscarded();
        refreshFullCalendar(originalState);
        this.snackbarService.showSuccess('Changes discarded');
      }
    });
  }

  /**
   * Execute undo operation
   */
  undo(): void {
    this.undoRedoService.undo();
  }

  /**
   * Execute redo operation
   */
  redo(): void {
    this.undoRedoService.redo();
  }
}