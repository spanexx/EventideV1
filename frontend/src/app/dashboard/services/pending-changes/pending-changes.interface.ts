import { Availability } from '../../models/availability.models';

export interface Change {
  id: string;
  type: 'create' | 'update' | 'delete' | 'move' | 'resize';
  entityId?: string;
  entity?: Availability;
  previousEntity?: Availability;
  timestamp: Date;
}

export interface PendingChangesState {
  changes: Change[];
  originalState: Availability[];
  currentState: Availability[];
  hasUnsavedChanges: boolean;
}