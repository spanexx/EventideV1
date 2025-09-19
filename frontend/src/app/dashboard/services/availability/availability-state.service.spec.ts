import { of } from 'rxjs';

export const mockAvailabilityStateService = {
  availability$: of([]),
  loading$: of(false),
  error$: of(null),
  summary$: of(null),
  pendingChangesCount$: of(0),
  canUndo$: of(false),
  canRedo$: of(false),
  undoDescription$: of(null),
  redoDescription$: of(null),
  selectedSlot$: of(null),
  contextMenuPosition$: of({ x: 0, y: 0 }),
  setSelectedSlot: jasmine.createSpy('setSelectedSlot'),
  setContextMenuPosition: jasmine.createSpy('setContextMenuPosition'),
};
