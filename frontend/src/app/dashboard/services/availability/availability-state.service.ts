import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable, BehaviorSubject } from 'rxjs';
import { Availability } from '../../models/availability.models';
import * as AvailabilitySelectors from '../../store-availability/selectors/availability.selectors';
import { PendingChangesService } from '../pending-changes/pending-changes.service';
import { UndoRedoCoordinatorService } from '../undo-redo/undo-redo-coordinator.service';
import { BusinessLogicService } from '../business/business-logic.service';

@Injectable({
  providedIn: 'root'
})
export class AvailabilityStateService {
  // State properties
  private _selectedSlot = new BehaviorSubject<Availability | null>(null);
  selectedSlot$ = this._selectedSlot.asObservable();

  private _contextMenuPosition = new BehaviorSubject<{ x: number, y: number }>({ x: 0, y: 0 });
  contextMenuPosition$ = this._contextMenuPosition.asObservable();

  // Observables from other services, exposed for the component
  availability$: Observable<Availability[]>;
  loading$: Observable<boolean>;
  error$: Observable<string | null>;
  summary$: Observable<{ created: number; skipped: number } | null>;
  pendingChangesCount$: Observable<number>;
  canUndo$: Observable<boolean>;
  canRedo$: Observable<boolean>;
  undoDescription$: Observable<string | null>;
  redoDescription$: Observable<string | null>;

  constructor(
    private store: Store,
    private pendingChangesService: PendingChangesService,
    private undoRedoService: UndoRedoCoordinatorService,
    private businessLogicService: BusinessLogicService
  ) {
    this.availability$ = this.store.select(AvailabilitySelectors.selectAvailability);
    this.loading$ = this.store.select(AvailabilitySelectors.selectAvailabilityLoading);
    this.error$ = this.store.select(AvailabilitySelectors.selectAvailabilityError);
    this.summary$ = this.businessLogicService.summary$;
    this.pendingChangesCount$ = this.pendingChangesService.pendingChangesCount$;
    this.canUndo$ = this.undoRedoService.canUndo$;
    this.canRedo$ = this.undoRedoService.canRedo$;
    this.undoDescription$ = this.undoRedoService.undoDescription$;
    this.redoDescription$ = this.undoRedoService.redoDescription$;
  }

  // Methods to update state
  setSelectedSlot(slot: Availability | null) {
    this._selectedSlot.next(slot);
  }

  setContextMenuPosition(position: { x: number, y: number }) {
    this._contextMenuPosition.next(position);
  }
}
