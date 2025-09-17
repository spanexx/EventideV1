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
   * Save all pending changes to the backend
   * @param changes Array of changes to save
   * @returns Observable with save result
   */
  saveChanges(changes: Change[]): Observable<SaveResult> {
    const created: Availability[] = [];
    const updated: Availability[] = [];
    const deleted: string[] = [];
    const failed: Array<{ entity: any; error: string }> = [];

    // Group changes by type
    const createChanges = changes.filter(change => change.type === 'create');
    const updateChanges = changes.filter(change => change.type === 'update' || change.type === 'move' || change.type === 'resize');
    const deleteChanges = changes.filter(change => change.type === 'delete');

    // Create observables for each type of operation
    const createObservables = createChanges.map(change => 
      this.availabilityService.createAvailability(change.entity!).pipe(
        map(result => {
          created.push(result);
          return result;
        }),
        catchError(error => {
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
          failed.push({ entity: change.entity, error: error.message });
          return of(null);
        })
      )
    );

    const deleteObservables = deleteChanges.map(change => 
      this.availabilityService.deleteAvailability(change.entityId!).pipe(
        map(() => {
          deleted.push(change.entityId!);
          return null;
        }),
        catchError(error => {
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