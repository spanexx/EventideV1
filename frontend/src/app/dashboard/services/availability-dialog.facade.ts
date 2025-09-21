import { Injectable } from '@angular/core';
import { Store, select } from '@ngrx/store';
import { Observable } from 'rxjs';
import { User } from '../../services/auth.service';
import * as AuthSelectors from '../../auth/store/auth/selectors/auth.selectors';
import { PendingChangesSignalService } from './pending-changes/pending-changes-signal.service';
import { UndoRedoSignalService } from './undo-redo/undo-redo-signal.service';
import { Change } from './pending-changes/pending-changes.interface';
import { SnackbarService } from '../../shared/services/snackbar.service';

@Injectable({
  providedIn: 'root'
})
export class AvailabilityDialogFacade {

  constructor(
    private store: Store,
    private pendingChangesSignalService: PendingChangesSignalService,
    private undoRedoService: UndoRedoSignalService,
    private snackbarService: SnackbarService
  ) {
    console.log('[AvailabilityDialogFacade] Initialized with signal-based services');
  }

  getUser$(): Observable<User | null> {
    return this.store.pipe(select(AuthSelectors.selectUser));
  }

  addChange(change: Change): void {
    console.log('[AvailabilityDialogFacade] Adding change via signal service:', change.type, change.id);
    // Save state for undo before making changes
    const actionDescription = change.type === 'create' ? 'Create availability slot' : 
                            change.type === 'update' ? 'Update availability slot' : 
                            'Delete availability slot';
    this.undoRedoService.saveStateForUndo(actionDescription);
    
    this.pendingChangesSignalService.addChange(change);
    console.log('[AvailabilityDialogFacade] Change added, pending count:', this.pendingChangesSignalService.pendingChangesCount());
  }

  showError(message: string): void {
    this.snackbarService.showError(message);
  }
}
