import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { DateSelectArg, EventClickArg } from '@fullcalendar/core';
import * as AvailabilityActions from '../../store-availability/actions/availability.actions';
import { Availability } from '../../models/availability.models';
import { SnackbarService } from '../../../shared/services/snackbar.service';
import { DialogManagementService } from '../dialog/dialog-management.service';
import { CalendarOperationsService } from '../calendar/calendar-operations.service';
import { DialogDataService } from '../dialog/dialog-data.service';
import { CalendarEventsService } from '../../pages/availability/calendar/calendar-events.service';
import { PendingChangesSignalService } from '../pending-changes/pending-changes-signal.service';
import { UndoRedoSignalService } from '../undo-redo/undo-redo-signal.service';
import { Change } from '../pending-changes/pending-changes.interface';
import { take } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class AvailabilityEventHandlerService {
  constructor(
    private store: Store,
    private snackbarService: SnackbarService,
    private dialogService: DialogManagementService,
    private calendarService: CalendarOperationsService,
    private dialogDataService: DialogDataService,
    private calendarEvents: CalendarEventsService,
    private pendingChangesSignalService: PendingChangesSignalService,
    private undoRedoService: UndoRedoSignalService
  ) {
    console.log('[AvailabilityEventHandlerService] Initialized with signal-based services');
  }

  /**
   * Handle date selection for creating new availability slots
   * @param selectInfo The date selection information
   * @param availability$ Observable of availability data
   */
  handleDateSelect(
    selectInfo: DateSelectArg,
    availability$: Observable<Availability[]>
  ): void {
    // Handle date selection for creating new availability slots
    // Check if a dialog is already open
    if (this.dialogService.isAvailabilityDialogOpen()) {
      this.dialogService.focusExistingAvailabilityDialog();
      return;
    }
    
    // Prevent event propagation
    if (selectInfo.jsEvent) {
      selectInfo.jsEvent.preventDefault();
      selectInfo.jsEvent.stopPropagation();
    }
    
    // Check if the selected date is in the past
    if (this.calendarService.isDateInPast(selectInfo.start)) {
      this.snackbarService.showError('Cannot create availability for past dates');
      return;
    }
    
    // Check if there's existing availability for this date
    this.calendarService.hasExistingAvailability(availability$, selectInfo.start).subscribe(hasExistingAvailability => {
      if (hasExistingAvailability) {
        // Show a confirmation dialog to ask if they want to proceed
        const dialogRef = this.dialogService.openConfirmationDialog({
          title: 'Existing Availability',
          message: 'There is already availability set for this date. Do you want to create additional slots?',
          confirmText: 'Continue',
          cancelText: 'Cancel'
        });
        
        dialogRef.afterClosed().subscribe((result: any) => {
          if (result) {
            // Proceed with opening the availability dialog
            this.openAvailabilityDialog(selectInfo);
          }
        });
      } else {
        // No existing availability, proceed with opening the dialog
        this.openAvailabilityDialog(selectInfo);
      }
    });
  }

  /**
   * Handle event click for editing availability slots
   * @param clickInfo The event click information
   * @param availability$ Observable of availability data
   */
  handleEventClick(
    clickInfo: EventClickArg,
    availability$: Observable<Availability[]>
  ): void {
    // Handle event click for editing availability slots
    this.calendarEvents.handleEventClick(clickInfo, availability$).subscribe(slot => {
      if (slot) {
        // Prevent edits/deletes for booked slots
        if (slot.isBooked) {
          this.snackbarService.showError('This slot is booked and cannot be modified.');
          return;
        }
        
        // Prevent edits/deletes for past-day slots
        const slotDay = new Date(slot.startTime);
        slotDay.setHours(0,0,0,0);
        const today = new Date();
        today.setHours(0,0,0,0);
        const isPastDay = slotDay < today;
        
        // Check if it's a right click
        if (clickInfo.jsEvent.which === 3 || clickInfo.jsEvent.button === 2) {
          if (isPastDay) {
            this.snackbarService.showError('This slot is in the past and cannot be modified.');
            return;
          }
          // Context menu handling would be done in the component
          // as it requires access to the context menu trigger
        } 
        // Check if it's a Ctrl/Meta click (alternative delete)
        else if (clickInfo.jsEvent.ctrlKey || clickInfo.jsEvent.metaKey) {
          if (isPastDay) {
            this.snackbarService.showError('This slot is in the past and cannot be modified.');
          } else {
            if (confirm('Are you sure you want to delete this availability slot?')) {
              // Save state for undo before making changes
              this.undoRedoService.saveStateForUndo('Delete availability slot via Ctrl+click');
              
              // Instead of directly deleting, add to pending changes
              const change: Change = {
                id: `delete-${slot.id}-${Date.now()}`,
                type: 'delete',
                entityId: slot.id,
                // For delete operations, we typically don't need the full entity
                timestamp: new Date()
              };
              this.pendingChangesSignalService.addChange(change);
            }
          }
        } else {
          if (isPastDay) {
            this.snackbarService.showError('This slot is in the past and cannot be modified.');
          } else {
            // Edit the slot
            this.editSlot(slot);
          }
        }
      }
    });
  }

  /**
   * Handle event context menu
   * @param event The mouse event
   * @param info The event info
   * @param availability$ Observable of availability data
   */
  handleEventContextMenu(
    event: MouseEvent,
    info: any,
    availability$: Observable<Availability[]>
  ): void {
    // Prevent the browser's default context menu
    event.preventDefault();
    
    // Check if we clicked on an event or empty space
    const eventElement = event.target as HTMLElement;
    const isEventClick = eventElement.closest('.fc-event') !== null;
    
    if (isEventClick) {
      // Clicked on an event, find the slot
      availability$.pipe(take(1)).subscribe(av => {
        const slot = av.find(a => a.id === info.event.id);
        if (slot) {
          // Context menu handling would be done in the component
          // as it requires access to the context menu trigger
        }
      });
    } else {
      // Clicked on empty space
      // Context menu handling would be done in the component
      // as it requires access to the context menu trigger
    }
  }

  /**
   * Handle event resize operations
   * @param resizeInfo The resize information
   * @param availability Current availability data
   */
  handleEventResize(resizeInfo: any, availability: Availability[]): void {
    // For now, we'll let the DragResizeService handle this
    // This method is kept for potential future customization
  }

  /**
   * Handle event drop operations
   * @param dropInfo The drop information
   * @param availability Current availability data
   */
  handleEventDrop(dropInfo: any, availability: Availability[]): void {
    // For now, we'll let the DragResizeService handle this
    // This method is kept for potential future customization
  }

  /**
   * Open the availability dialog with the provided selection info
   * @param selectInfo The date selection information
   */
  private openAvailabilityDialog(selectInfo: DateSelectArg) {
    const dialogRef = this.dialogService.openAvailabilityDialog({
      availability: null, 
      date: selectInfo.start,
      startDate: selectInfo.start,
      endDate: selectInfo.end,
      allDay: selectInfo.allDay
    });

    dialogRef.afterClosed().subscribe((result: any) => {
      // Dialog handles adding to pending changes internally
    });
  }

  /**
   * Edit an availability slot
   * @param slot The slot to edit
   */
  editSlot(slot: Availability): void {
    // Check if a dialog is already open
    if (this.dialogService.isAvailabilityDialogOpen()) {
      this.dialogService.focusExistingAvailabilityDialog();
      return;
    }
    
    const dialogRef = this.dialogService.openAvailabilityDialog({
      availability: slot, 
      date: slot.date
    });

    dialogRef.afterClosed().subscribe((result: any) => {
      // Dialog handles adding to pending changes internally
    });
  }

  /**
   * Delete an availability slot
   * @param slot The slot to delete
   */
  deleteSlot(slot: Availability): void {
    const dialogRef = this.dialogService.openConfirmationDialog({
      title: 'Delete Availability Slot',
      message: 'Are you sure you want to delete this availability slot? This action cannot be undone.',
      confirmText: 'Delete',
      cancelText: 'Cancel'
    });

    dialogRef.afterClosed().subscribe((result: any) => {
      if (result) {
        // Save state for undo before making changes
        this.undoRedoService.saveStateForUndo('Delete availability slot');
        
        // Instead of directly deleting, add to pending changes
        const change: Change = {
          id: `delete-${slot.id}-${Date.now()}`,
          type: 'delete',
          entityId: slot.id,
          // For delete operations, we typically don't need the full entity
          timestamp: new Date()
        };
        this.pendingChangesSignalService.addChange(change);
      }
    });
  }
}