import { Injectable } from '@angular/core';
import { PendingChangesSignalService } from '../pending-changes/pending-changes-signal.service';
import { UndoRedoSignalService } from '../undo-redo/undo-redo-signal.service';
import { ChangesSynchronizerService } from '../pending-changes/changes-synchronizer.service';
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
    private pendingChangesSignalService: PendingChangesSignalService,
    private undoRedoService: UndoRedoSignalService,
    private changesSynchronizerService: ChangesSynchronizerService,
    private snackbarService: SnackbarService,
    private dialogService: DialogManagementService,
    private store: Store
  ) {}

  /**
   * Save all pending changes
   * @param refreshAvailability Function to refresh availability data
   */
  saveChanges(refreshAvailability: () => void): void {
    const changes = this.pendingChangesSignalService.getPendingChanges();
    
    if (changes.length === 0) {
      this.snackbarService.showInfo('No changes to save');
      return;
    }
    
    // Bracket store sync with a commit window to avoid overwrites mid-flight
    this.pendingChangesSignalService.startCommit();
    console.debug('[AvailabilityPendingChangesService] Commit started. Pending changes:', changes.length);

    this.changesSynchronizerService.saveChanges(changes).subscribe(result => {
      if (result.success) {
        console.debug('[AvailabilityPendingChangesService] Save succeeded. Reconciling local state with server...');
        this.snackbarService.showSuccess(result.message);

        // Temporarily suspend store sync to avoid the next store emission
        this.pendingChangesSignalService.suspendStoreSyncFor(2000);

        // Reconcile local state with server responses to avoid flicker/removal
        // 1) Start from current state (original + pending)
        let newState = this.pendingChangesSignalService.getCurrentState();

        // 2) Replace temp-created entities with server-created ones using robust matching
        const tempToServer: Record<string, Availability> = {} as any;
        const createChanges = changes.filter(c => c.type === 'create' && c.entity && c.entity.id?.startsWith('temp-'));

        const unmatchedCreates = new Set(createChanges.map(c => c.id));
        const withinOneMinute = (a: Date, b: Date) => Math.abs(a.getTime() - b.getTime()) <= 60 * 1000;

        result.created.forEach((serverEntity) => {
          // Best match by providerId + duration + near-equal times
          let bestChangeId: string | null = null;
          let bestScore = -1;
          createChanges.forEach(c => {
            if (!unmatchedCreates.has(c.id)) return;
            const ent = c.entity!;
            let score = 0;
            if (ent.providerId === serverEntity.providerId) score += 3;
            if ((ent.duration || 0) === (serverEntity.duration || 0)) score += 2;
            if (ent.startTime && serverEntity.startTime && withinOneMinute(new Date(ent.startTime), new Date(serverEntity.startTime))) score += 3;
            if (ent.endTime && serverEntity.endTime && withinOneMinute(new Date(ent.endTime), new Date(serverEntity.endTime))) score += 3;
            if (ent.type === serverEntity.type) score += 1;
            if (score > bestScore) { bestScore = score; bestChangeId = c.id; }
          });
          if (bestChangeId) {
            const change = createChanges.find(c => c.id === bestChangeId)!;
            tempToServer[change.entity!.id] = serverEntity;
            unmatchedCreates.delete(bestChangeId);
          }
        });

        // Fallback: index mapping for any unmatched
        if (unmatchedCreates.size > 0) {
          console.debug('[AvailabilityPendingChangesService] Fallback mapping for unmatched creates:', unmatchedCreates.size);
          const remainingCreated = result.created.filter(s => !Object.values(tempToServer).some(m => m.id === s.id));
          Array.from(unmatchedCreates).forEach((changeId, idx) => {
            const change = createChanges.find(c => c.id === changeId)!;
            const serverEntity = remainingCreated[idx];
            if (serverEntity) tempToServer[change.entity!.id] = serverEntity;
          });
        }

        newState = newState.map(slot => {
          if (slot.id && tempToServer[slot.id]) {
            console.debug('[AvailabilityPendingChangesService] Replacing temp ID with server ID', { tempId: slot.id, serverId: tempToServer[slot.id].id });
            return { ...tempToServer[slot.id] };
          }
          return slot;
        });

        // 3) Apply updates from server to ensure normalized values
        result.updated.forEach(updated => {
          const idx = newState.findIndex(s => s.id === updated.id);
          if (idx !== -1) newState[idx] = { ...updated };
        });

        // 4) Remove any deleted ids
        if (result.deleted.length) {
          const deletedSet = new Set(result.deleted);
          newState = newState.filter(s => !deletedSet.has(s.id));
        }

        // 5) Commit the reconciled state as the new original (clears pending internally)
        this.pendingChangesSignalService.updateCurrentState(newState);

        // 6) Clear undo/redo stack since changes are now committed
        this.undoRedoService.clearHistory();

        // 7) End commit and refresh from server to pull any additional normalization
        this.pendingChangesSignalService.endCommit();
        refreshAvailability();
      } else {
        console.error('[AvailabilityPendingChangesService] Save failed:', result.message);
        this.snackbarService.showError(result.message);
        // Show failed changes if any
        if (result.failed.length > 0) {
          console.error('Failed changes:', result.failed);
        }
        this.pendingChangesSignalService.endCommit();
      }
    });
  }

  /**
   * Discard all pending changes
   * @param refreshFullCalendar Function to refresh the full calendar
   */
  discardChanges(refreshFullCalendar: (availability: Availability[]) => void): void {
    if (!this.pendingChangesSignalService.hasPendingChanges()) {
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
        const originalState = this.pendingChangesSignalService.discardChanges();
        // Clear undo/redo stack since all changes are reverted
        this.undoRedoService.clearHistory();
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