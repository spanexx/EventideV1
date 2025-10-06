import { Injectable } from '@angular/core';
import { Observable, forkJoin, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { Availability } from '../../models/availability.models';
import { AvailabilityService } from '../availability.service';
import { Change } from './pending-changes.interface';

export interface SaveResult {
  success: boolean;
  message: string;
  created: Availability[];
  updated: Availability[];
  deleted: string[];
  failed: Array<{ entity: any; error: string }>;
}

@Injectable({
  providedIn: 'root'
})
export class ChangesSynchronizerService {
  constructor(private availabilityService: AvailabilityService) {}

  /**
   * Consolidate changes to avoid duplicate operations on the same entity
   * For example, if we have CREATE + RESIZE on the same temp ID, consolidate to single CREATE
   */
  private consolidateChanges(changes: Change[]): Change[] {
    const changesByEntity = new Map<string, Change[]>();
    
    // Group changes by entity ID
    changes.forEach(change => {
      const entityId = change.entityId || change.entity?.id;
      if (entityId) {
        if (!changesByEntity.has(entityId)) {
          changesByEntity.set(entityId, []);
        }
        changesByEntity.get(entityId)!.push(change);
      }
    });
    
    const consolidatedChanges: Change[] = [];
    
    // Process each group of changes for the same entity
    changesByEntity.forEach((entityChanges, entityId) => {
      if (entityChanges.length === 1) {
        // No consolidation needed
        consolidatedChanges.push(entityChanges[0]);
      } else {
        // Consolidate multiple changes for the same entity
        const consolidated = this.consolidateEntityChanges(entityChanges);
        if (consolidated) {
          consolidatedChanges.push(consolidated);
        }
      }
    });
    
    return consolidatedChanges;
  }
  
  /**
   * Consolidate changes for a single entity
   */
  private consolidateEntityChanges(changes: Change[]): Change | null {
    // Sort by timestamp to get the correct order
    const sortedChanges = changes.sort((a, b) => 
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
    
    // If we have a DELETE at the end, that's the final state
    const lastChange = sortedChanges[sortedChanges.length - 1];
    if (lastChange.type === 'delete') {
      return lastChange;
    }
    
    // Find the first CREATE or use entity from last change
    const createChange = sortedChanges.find(c => c.type === 'create');
    if (createChange) {
      // Take the entity from the last change (which has the final state)
      // but keep it as a CREATE operation
      return {
        ...createChange,
        entity: lastChange.entity || createChange.entity,
        timestamp: lastChange.timestamp
      };
    }
    
    // No CREATE found, return the last change (should be UPDATE/MOVE/RESIZE)
    return lastChange;
  }

  /**
   * Save all pending changes to the backend
   * @param changes Array of changes to save
   * @returns Observable with save result
   */
  saveChanges(changes: Change[]): Observable<SaveResult> {
    const created: Availability[] = [];
    const updated: Availability[] = [];
    const deleted: string[] = [];
    const failed: Array<{ entity: any; error: string }> = [];

    console.log('[ChangesSynchronizerService] Processing changes:', changes.length);

    // Helper function to check if an ID is temporary
    const isTemporaryId = (id: string): boolean => {
      return id.startsWith('temp-');
    };

    // Consolidate changes to avoid duplicate operations on the same entity
    const consolidatedChanges = this.consolidateChanges(changes);
    if (consolidatedChanges.length !== changes.length) {
      console.log('[ChangesSynchronizerService] Consolidated', changes.length, 'changes to', consolidatedChanges.length);
    }

    // Group changes by operation type, but handle temporary IDs correctly
    const createChanges = consolidatedChanges.filter(change => {
      if (change.type === 'create') {
        return true;
      }
      // If it's an update/move/resize operation on a temporary ID, treat it as create
      if ((change.type === 'update' || change.type === 'move' || change.type === 'resize') && 
          change.entity && isTemporaryId(change.entity.id)) {
        console.log('[ChangesSynchronizerService] Converting', change.type, 'with temp ID to create');
        return true;
      }
      return false;
    });
    
    const updateChanges = consolidatedChanges.filter(change => {
      // Only treat as update if it's not a create and doesn't have a temporary ID
      return (change.type === 'update' || change.type === 'move' || change.type === 'resize') && 
             change.entity && !isTemporaryId(change.entity.id);
    });
    
    const deleteChanges = consolidatedChanges.filter(change => change.type === 'delete');

    // Create observables for each type of operation
    const createObservables = createChanges.map(change => 
      this.availabilityService.createAvailability(change.entity!).pipe(
        map(result => {
          created.push(result);
          return result;
        }),
        catchError(error => {
          console.error('[ChangesSynchronizerService] Create failed:', error.message);
          failed.push({ entity: change.entity, error: error.message });
          return of(null);
        })
      )
    );

    const updateObservables = updateChanges.map(change => 
      this.availabilityService.updateAvailability(change.entity!).pipe(
        map(result => {
          updated.push(result);
          return result;
        }),
        catchError(error => {
          console.error('[ChangesSynchronizerService] Update failed:', error.message);
          failed.push({ entity: change.entity, error: error.message });
          return of(null);
        })
      )
    );

    const deleteObservables = deleteChanges.map(change => 
      this.availabilityService.deleteAvailability(change.entityId!).pipe(
        map((result) => {
          deleted.push(change.entityId!);
          return null;
        }),
        catchError(error => {
          console.error('[ChangesSynchronizerService] Delete failed:', error.message);
          failed.push({ entity: { id: change.entityId }, error: error.message });
          return of(null);
        })
      )
    );

    // Execute all operations in parallel
    const allObservables = [...createObservables, ...updateObservables, ...deleteObservables];

    if (allObservables.length === 0) {
      return of({
        success: true,
        message: 'No changes to save',
        created: [],
        updated: [],
        deleted: [],
        failed: []
      });
    }

    return forkJoin(allObservables).pipe(
      map(() => {
        const success = failed.length === 0;
        const message = success 
          ? `Successfully saved ${created.length + updated.length + deleted.length} changes`
          : `Saved ${created.length + updated.length + deleted.length} changes with ${failed.length} failures`;
          
        return {
          success,
          message,
          created,
          updated,
          deleted,
          failed
        };
      }),
      catchError(error => {
        return of({
          success: false,
          message: `Failed to save changes: ${error.message}`,
          created: [],
          updated: [],
          deleted: [],
          failed: changes.map(change => ({ 
            entity: change.entity || { id: change.entityId }, 
            error: error.message 
          }))
        });
      })
    );
  }
}