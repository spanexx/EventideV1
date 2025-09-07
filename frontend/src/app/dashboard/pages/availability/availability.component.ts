import { Component, OnInit, ViewChild, HostListener, AfterViewInit } from '@angular/core';
import { Store, select } from '@ngrx/store';
import { Observable, combineLatest } from 'rxjs';
import { FullCalendarComponent } from '@fullcalendar/angular';
import { CalendarOptions, DateSelectArg, EventClickArg, EventApi } from '@fullcalendar/core';
import interactionPlugin from '@fullcalendar/interaction';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import { FullCalendarModule } from '@fullcalendar/angular';
import { MatDialog } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenu, MatMenuModule, MatMenuTrigger } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import * as DashboardActions from '../../store/actions/dashboard.actions';
import * as AvailabilityActions from '../../store-availability/actions/availability.actions';
import * as DashboardSelectors from '../../store/selectors/dashboard.selectors';
import * as AvailabilitySelectors from '../../store-availability/selectors/availability.selectors';
import * as AuthSelectors from '../../../auth/store/auth/selectors/auth.selectors';
import { Availability } from '../../models/availability.models';
import { AvailabilityService } from '../../services/availability.service';
import { AvailabilityDialogComponent } from '../../components/availability-dialog/availability-dialog.component';
import { CopyWeekDialogComponent } from '../../components/copy-week-dialog/copy-week-dialog.component';
import { DatePickerDialogComponent } from '../../components/date-picker-dialog/date-picker-dialog.component';
import { ConfirmationDialogComponent } from '../../components/confirmation-dialog/confirmation-dialog.component';
import { CommonModule } from '@angular/common';
import { SnackbarService } from '../../../shared/services/snackbar.service';

@Component({
  selector: 'app-availability',
  standalone: true,
  imports: [
    CommonModule,
    FullCalendarModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatProgressSpinnerModule,
    MatTooltipModule
  ],
  templateUrl: './availability.component.html',
  styleUrl: './availability.component.scss'
})
export class AvailabilityComponent implements OnInit {
  @ViewChild('calendar') calendarComponent!: FullCalendarComponent;
  @ViewChild('contextMenu') contextMenu!: MatMenu;
  
  availability$: Observable<Availability[]>;
  loading$: Observable<boolean>;
  error$: Observable<string | null>;
  selectedSlot: Availability | null = null;
  
  // History management
  private history: Availability[][] = [];
  private historyIndex = -1;
  private readonly MAX_HISTORY = 50;

  calendarOptions: CalendarOptions = {
    plugins: [
      interactionPlugin,
      dayGridPlugin,
      timeGridPlugin
    ],
    headerToolbar: {
      left: 'prev,next today',
      center: 'title',
      right: 'dayGridMonth,timeGridWeek,timeGridDay,datePickerButton'
    },
    customButtons: {
      datePickerButton: {
        text: 'Go to date',
        click: this.openDatePicker.bind(this)
      }
    },
    initialView: 'timeGridWeek',
    editable: true,
    selectable: true,
    selectMirror: true,
    dayMaxEvents: true,
    weekends: true,
    select: this.handleDateSelect.bind(this),
    eventClick: this.handleEventClick.bind(this),
    eventsSet: this.handleEvents.bind(this),
    eventContent: this.renderEventContent,
    eventClassNames: (arg) => {
      if (arg.event.extendedProps['isBooked']) {
        return ['event-booked'];
      }
      return ['event-available'];
    },
    // Enable drag-to-resize functionality
    eventResizableFromStart: true,
    eventResize: this.handleEventResize.bind(this),
    // Enable drag-to-move functionality
    eventDrop: this.handleEventDrop.bind(this)
  };

  constructor(
    private store: Store,
    private dialog: MatDialog,
    private availabilityService: AvailabilityService,
    private snackbarService: SnackbarService
  ) {
    this.availability$ = this.store.select(AvailabilitySelectors.selectAvailability);
    this.loading$ = this.store.select(AvailabilitySelectors.selectAvailabilityLoading);
    this.error$ = this.store.select(AvailabilitySelectors.selectAvailabilityError);
  }

  ngOnInit(): void {
    // Load availability data
    const today = new Date();
    
    // Get the current user and load availability for that user
    this.store.select(AuthSelectors.selectUserId).subscribe(userId => {
      if (userId) {
        this.store.dispatch(AvailabilityActions.loadAvailability({ 
          providerId: userId, 
          date: today
        }));
      }
    });
    
    // Subscribe to availability updates and convert to calendar events
    this.availability$.subscribe(availability => {
      // Use a small delay to ensure the calendar component is fully initialized
      setTimeout(() => {
        if (this.calendarComponent) {
          const calendarApi = this.calendarComponent.getApi();
          // Check if calendarApi is available before using it
          if (calendarApi) {
            const events = this.availabilityService.convertToCalendarEvents(availability);
            calendarApi.removeAllEvents();
            calendarApi.addEventSource(events);
          }
        }
      }, 0);
      
      // Save to history for undo/redo functionality
      this.saveToHistory(availability);
    });
    
    // Subscribe to error updates and show snackbar notifications
    this.error$.subscribe(error => {
      if (error) {
        this.snackbarService.showError('Error loading availability: ' + error);
      }
    });
  }

  handleDateSelect(selectInfo: DateSelectArg) {
    // Handle date selection for creating new availability slots
    // Check if a dialog is already open
    const existingDialog = this.dialog.openDialogs.find(dialog => 
      dialog.componentInstance instanceof AvailabilityDialogComponent
    );
    
    if (existingDialog) {
      console.log('Dialog already open, focusing existing dialog');
      // Focus the existing dialog
      existingDialog.componentInstance['dialogRef'].addPanelClass('dialog-focused');
      return;
    }
    
    // Prevent event propagation
    if (selectInfo.jsEvent) {
      selectInfo.jsEvent.preventDefault();
      selectInfo.jsEvent.stopPropagation();
    }
    
    console.log('Opening new availability dialog for date selection');
    const dialogRef = this.dialog.open(AvailabilityDialogComponent, {
      width: '400px',
      data: { 
        availability: null, 
        date: selectInfo.start,
        startDate: selectInfo.start,
        endDate: selectInfo.end,
        allDay: selectInfo.allDay
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      console.log('Dialog closed with result:', result);
      if (result) {
        // The dialog component will dispatch the create action
        // No additional action needed here
      }
    });
  }

  handleEventClick(clickInfo: EventClickArg) {
    // Handle event click for editing availability slots
    // Find the availability slot based on the event ID
    this.availability$.subscribe(availability => {
      const slot = availability.find(a => a.id === clickInfo.event.id);
      if (slot) {
        // Store the selected slot
        this.selectedSlot = slot;
        
        // Prevent event propagation
        clickInfo.jsEvent.preventDefault();
        clickInfo.jsEvent.stopPropagation();
        
        // Check if it's a right click
        if (clickInfo.jsEvent.which === 3 || clickInfo.jsEvent.button === 2) {
          // Show context menu
          this.showContextMenu(clickInfo.jsEvent);
        } 
        // Check if it's a Ctrl/Meta click (alternative delete)
        else if (clickInfo.jsEvent.ctrlKey || clickInfo.jsEvent.metaKey) {
          // Delete the slot
          if (confirm('Are you sure you want to delete this availability slot?')) {
            this.store.dispatch(AvailabilityActions.deleteAvailability({ id: slot.id }));
          }
        } else {
          // Edit the slot
          this.editSlot();
        }
      }
    });
  }

  handleEvents(events: EventApi[]) {
    // Handle events update
    // This method is called when events are updated in the calendar
    // No specific action needed here as the state is managed by NgRx
    // But we can add any necessary logic here if needed
  }

  handleEventResize(resizeInfo: any) {
    // Handle event resize
    // Find the availability slot based on the event ID
    this.availability$.subscribe(availability => {
      const slot = availability.find(a => a.id === resizeInfo.event.id);
      if (slot) {
        // Create updated slot with new times
        const updatedSlot = {
          ...slot,
          startTime: resizeInfo.event.start,
          endTime: resizeInfo.event.end,
          duration: Math.round((resizeInfo.event.end.getTime() - resizeInfo.event.start.getTime()) / (1000 * 60)) // Convert ms to minutes
        };
        
        // Update the slot
        this.store.dispatch(AvailabilityActions.updateAvailability({ availability: updatedSlot }));
      }
    });
  }

  handleEventDrop(dropInfo: any) {
    // Handle event drop (moving event to new time slot)
    // Find the availability slot based on the event ID
    this.availability$.subscribe(availability => {
      const slot = availability.find(a => a.id === dropInfo.event.id);
      if (slot) {
        // Create updated slot with new times
        const updatedSlot = {
          ...slot,
          startTime: dropInfo.event.start,
          endTime: dropInfo.event.end,
          date: dropInfo.event.start
        };
        
        // Update the slot
        this.store.dispatch(AvailabilityActions.updateAvailability({ availability: updatedSlot }));
      }
    });
  }

  refreshAvailability(): void {
    const today = new Date();
    // Clear any previous errors
    // Get the current user and refresh availability for that user
    this.store.select(AuthSelectors.selectUserId).subscribe(userId => {
      if (userId) {
        this.store.dispatch(AvailabilityActions.loadAvailability({ 
          providerId: userId, 
          date: today
        }));
      }
    });
  }

  // History management methods
  private saveToHistory(availability: Availability[]): void {
    // If we're not at the end of the history, remove future states
    if (this.historyIndex < this.history.length - 1) {
      this.history = this.history.slice(0, this.historyIndex + 1);
    }
    
    // Add the current state to history
    this.history.push([...availability]);
    this.historyIndex++;
    
    // Limit history size
    if (this.history.length > this.MAX_HISTORY) {
      this.history.shift();
      this.historyIndex--;
    }
  }

  undo(): void {
    if (this.canUndo()) {
      this.historyIndex--;
      const prevState = this.history[this.historyIndex];
      // Update the calendar with the previous state
      if (this.calendarComponent) {
        const calendarApi = this.calendarComponent.getApi();
        // Check if calendarApi is available before using it
        if (calendarApi) {
          const events = this.availabilityService.convertToCalendarEvents(prevState);
          calendarApi.removeAllEvents();
          calendarApi.addEventSource(events);
        }
      }
    }
  }

  redo(): void {
    if (this.canRedo()) {
      this.historyIndex++;
      const nextState = this.history[this.historyIndex];
      // Update the calendar with the next state
      if (this.calendarComponent) {
        const calendarApi = this.calendarComponent.getApi();
        // Check if calendarApi is available before using it
        if (calendarApi) {
          const events = this.availabilityService.convertToCalendarEvents(nextState);
          calendarApi.removeAllEvents();
          calendarApi.addEventSource(events);
        }
      }
    }
  }

  canUndo(): boolean {
    return this.historyIndex > 0;
  }

  canRedo(): boolean {
    return this.historyIndex < this.history.length - 1;
  }

  // Keyboard shortcuts
  @HostListener('window:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent) {
    // Only handle shortcuts when the calendar is focused
    if (event.target instanceof HTMLElement && 
        (event.target.tagName === 'BODY' || 
         event.target.classList.contains('fc') || 
         event.target.closest('.fc'))) {
      
      // Ctrl/Cmd + Z - Undo
      if ((event.ctrlKey || event.metaKey) && event.key === 'z' && !event.shiftKey) {
        event.preventDefault();
        this.undo();
        return;
      }
      
      // Ctrl/Cmd + Shift + Z or Ctrl/Cmd + Y - Redo
      if ((event.ctrlKey || event.metaKey) && 
          ((event.shiftKey && event.key === 'Z') || event.key === 'y')) {
        event.preventDefault();
        this.redo();
        return;
      }
      
      // R - Refresh
      if (event.key === 'r' && !event.ctrlKey && !event.metaKey && !event.shiftKey) {
        event.preventDefault();
        this.refreshAvailability();
        return;
      }
      
      // C - Copy week
      if (event.key === 'c' && !event.ctrlKey && !event.metaKey && !event.shiftKey) {
        event.preventDefault();
        this.copyWeekSchedule();
        return;
      }
      
      // A - Add availability
      if (event.key === 'a' && !event.ctrlKey && !event.metaKey && !event.shiftKey) {
        event.preventDefault();
        // Check if a dialog is already open
        const existingDialog = this.dialog.openDialogs.find(dialog => 
          dialog.componentInstance instanceof AvailabilityDialogComponent
        );
        
        if (existingDialog) {
          console.log('Dialog already open, focusing existing dialog');
          // Focus the existing dialog
          existingDialog.componentInstance['dialogRef'].addPanelClass('dialog-focused');
          return;
        }
        
        console.log('Opening new availability dialog via keyboard shortcut');
        // Open the add availability dialog with today's date
        const today = new Date();
        const dialogRef = this.dialog.open(AvailabilityDialogComponent, {
          width: '400px',
          data: { 
            availability: null, 
            date: today,
            startDate: today,
            endDate: new Date(today.getTime() + 60 * 60 * 1000) // Add 1 hour
          }
        });

        dialogRef.afterClosed().subscribe(result => {
          console.log('Dialog closed with result:', result);
          if (result) {
            // The dialog component will dispatch the create action
            // No additional action needed here
          }
        });
        return;
      }
      
      // F5 - Refresh (standard browser refresh)
      if (event.key === 'F5') {
        event.preventDefault();
        this.refreshAvailability();
        return;
      }
    }
  }

  copyWeekSchedule(): void {
    const dialogRef = this.dialog.open(CopyWeekDialogComponent, {
      width: '400px',
      data: {}
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        // Get the start and end dates for the source week
        const sourceStart = new Date(result.sourceWeek);
        sourceStart.setDate(sourceStart.getDate() - sourceStart.getDay()); // Start of week (Sunday)
        
        const sourceEnd = new Date(sourceStart);
        sourceEnd.setDate(sourceEnd.getDate() + 6); // End of week (Saturday)
        
        // Get the start and end dates for the target week
        const targetStart = new Date(result.targetWeek);
        targetStart.setDate(targetStart.getDate() - targetStart.getDay()); // Start of week (Sunday)
        
        // Format dates as strings
        const sourceStartDateString = sourceStart.toISOString().split('T')[0];
        
        // Get the current user and load availability for that user
        this.store.select(AuthSelectors.selectUserId).subscribe(userId => {
          if (userId) {
            // Dispatch action to load availability for the source week
            this.store.dispatch(AvailabilityActions.loadAvailability({ 
              providerId: userId, 
              date: sourceStart
            }));
            
            // Get the source week's availability and create new slots for the target week
            this.availability$.subscribe(availability => {
              // Filter for slots in the source week
              const sourceWeekSlots = availability.filter(slot => {
                const slotDate = new Date(slot.date || slot.startTime);
                return slotDate >= sourceStart && slotDate <= sourceEnd;
              });
              
              // Create new slots for the target week
              sourceWeekSlots.forEach(slot => {
                const newSlot: any = { ...slot };
                delete newSlot.id; // Remove the ID so a new one will be generated
                
                // Update dates for the target week
                if (newSlot.date) {
                  const newDate = new Date(newSlot.date);
                  newDate.setDate(newDate.getDate() + 7); // Add 7 days for next week
                  newSlot.date = newDate.toISOString().split('T')[0];
                }
                
                // Update start and end times for the target week
                const newStartTime = new Date(newSlot.startTime);
                newStartTime.setDate(newStartTime.getDate() + 7);
                newSlot.startTime = newStartTime;
                
                const newEndTime = new Date(newSlot.endTime);
                newEndTime.setDate(newEndTime.getDate() + 7);
                newSlot.endTime = newEndTime;
                
                // Dispatch action to create the new slot
                this.store.dispatch(AvailabilityActions.createAvailability({ availability: newSlot }));
              });
            });
          }
        });
      }
    });
  }

  openDatePicker(): void {
    const dialogRef = this.dialog.open(DatePickerDialogComponent, {
      width: '400px',
      data: { date: new Date() }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result && this.calendarComponent) {
        const calendarApi = this.calendarComponent.getApi();
        // Check if calendarApi is available before using it
        if (calendarApi) {
          calendarApi.gotoDate(result);
        }
      }
    });
  }

  renderEventContent(eventInfo: any) {
    // Calculate duration in minutes
    const start = new Date(eventInfo.event.start);
    const end = new Date(eventInfo.event.end);
    const duration = Math.round((end.getTime() - start.getTime()) / (1000 * 60));
    
    // Check if it's a recurring event
    const isRecurring = eventInfo.event.extendedProps?.isRecurring || false;
    const isBooked = eventInfo.event.extendedProps?.isBooked || false;
    
    // Create tooltip content
    const tooltipText = `${eventInfo.event.title}
${start.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} - ${end.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
Duration: ${duration} minutes
${isRecurring ? 'Recurring' : 'One-time'}${isBooked ? ' (Booked)' : ''}`;
    
    return {
      html: `
        <div class="fc-event-main-frame" title="${tooltipText}">
          <div class="fc-event-time">${eventInfo.timeText}</div>
          <div class="fc-event-title-container">
            <div class="fc-event-title">${eventInfo.event.title}</div>
            <div class="fc-event-details">
              <span class="fc-event-duration">${duration} min</span>
              ${isRecurring ? '<span class="fc-event-recurring">🔁</span>' : ''}
            </div>
          </div>
        </div>
      `
    };
  }

  showContextMenu(event: MouseEvent) {
    // Prevent the browser's default context menu
    event.preventDefault();
    
    // For now, we'll use the existing context menu but we need to implement proper positioning
    // This is a simplified approach - in a full implementation, we would position the menu at the mouse coordinates
    console.log('Context menu would open at position:', event.clientX, event.clientY);
    // The context menu is already defined in the template and can be triggered by the edit/delete buttons
  }

  editSlot() {
    if (this.selectedSlot) {
      // Check if a dialog is already open
      const existingDialog = this.dialog.openDialogs.find(dialog => 
        dialog.componentInstance instanceof AvailabilityDialogComponent
      );
      
      if (existingDialog) {
        console.log('Dialog already open, focusing existing dialog');
        // Focus the existing dialog
        existingDialog.componentInstance['dialogRef'].addPanelClass('dialog-focused');
        return;
      }
      
      console.log('Opening edit availability dialog for slot:', this.selectedSlot);
      const dialogRef = this.dialog.open(AvailabilityDialogComponent, {
        width: '400px',
        data: { availability: this.selectedSlot, date: this.selectedSlot.date }
      });

      dialogRef.afterClosed().subscribe(result => {
        console.log('Dialog closed with result:', result);
        if (result) {
          // The dialog component will dispatch the update action
          // No additional action needed here
        }
      });
    }
  }

  deleteSlot() {
    if (this.selectedSlot) {
      const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
        width: '400px',
        data: {
          title: 'Delete Availability Slot',
          message: 'Are you sure you want to delete this availability slot? This action cannot be undone.',
          confirmText: 'Delete',
          cancelText: 'Cancel'
        }
      });

      dialogRef.afterClosed().subscribe(result => {
        if (result) {
          this.store.dispatch(AvailabilityActions.deleteAvailability({ id: this.selectedSlot!.id }));
        }
      });
    }
  }

  /**
   * Opens the availability dialog to add a new availability slot
   */
  addAvailability(): void {
    const today = new Date();
    // Check if a dialog is already open
    const existingDialog = this.dialog.openDialogs.find(dialog => 
      dialog.componentInstance instanceof AvailabilityDialogComponent
    );
    
    if (existingDialog) {
      console.log('Dialog already open, focusing existing dialog');
      // Focus the existing dialog
      existingDialog.componentInstance['dialogRef'].addPanelClass('dialog-focused');
      return;
    }
    
    console.log('Opening new availability dialog');
    const dialogRef = this.dialog.open(AvailabilityDialogComponent, {
      width: '400px',
      data: { 
        availability: null, 
        date: today,
        startDate: today,
        endDate: new Date(today.getTime() + 60 * 60 * 1000) // Add 1 hour
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      console.log('Dialog closed with result:', result);
      if (result) {
        // The dialog component will dispatch the create action
        // No additional action needed here
      }
    });
  }
}
