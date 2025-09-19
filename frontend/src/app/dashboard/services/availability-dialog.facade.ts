import { Injectable } from '@angular/core';
import { Store, select } from '@ngrx/store';
import { Observable } from 'rxjs';
import { User } from '../../services/auth.service';
import * as AuthSelectors from '../../auth/store/auth/selectors/auth.selectors';
import { PendingChangesService } from './pending-changes/pending-changes.service';
import { Change } from './pending-changes/pending-changes.interface';
import { SnackbarService } from '../../shared/services/snackbar.service';

@Injectable({
  providedIn: 'root'
})
export class AvailabilityDialogFacade {

  constructor(
    private store: Store,
    private pendingChangesService: PendingChangesService,
    private snackbarService: SnackbarService
  ) { }

  getUser$(): Observable<User | null> {
    return this.store.pipe(select(AuthSelectors.selectUser));
  }

  addChange(change: Change): void {
    this.pendingChangesService.addChange(change);
  }

  showError(message: string): void {
    this.snackbarService.showError(message);
  }
}
