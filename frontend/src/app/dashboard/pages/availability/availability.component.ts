import { Component, OnInit, ViewChild, HostListener } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { FullCalendarComponent } from '@fullcalendar/angular';
import { CalendarOptions, DateSelectArg, EventClickArg, EventApi } from '@fullcalendar/core';
import interactionPlugin from '@fullcalendar/interaction';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import { FullCalendarModule } from '@fullcalendar/angular';
import { MatDialog } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenu, MatMenuModule } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import * as DashboardActions from '../../store/actions/dashboard.actions';
import * as AvailabilityActions from '../../store/actions/availability.actions';
import * as DashboardSelectors from '../../store/selectors/dashboard.selectors';
import { Availability } from '../../models/availability.models';
import { MockAvailabilityService } from '../../services/mock-availability.service';
import { AvailabilityDialogComponent } from '../../components/availability-dialog/availability-dialog.component';
import { CopyWeekDialogComponent } from '../../components/copy-week-dialog/copy-week-dialog.component';
import { DatePickerDialogComponent } from '../../components/date-picker-dialog/date-picker-dialog.component';
import { ConfirmationDialogComponent } from '../../components/confirmation-dialog/confirmation-dialog.component';
import { CommonModule } from '@angular/common';

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
    private mockAvailabilityService: MockAvailabilityService
  ) {
    this.availability$ = this.store.select(DashboardSelectors.selectAvailability);
    this.loading$ = this.store.select(DashboardSelectors.selectDashboardLoading);
  }

  ngOnInit(): void {
    // Load availability data
    const today = new Date();
    this.store.dispatch(DashboardActions.loadAvailability({ 
      providerId: 'provider-123', 
      date: today 
    }));
    
    // Subscribe to availability updates and convert to calendar events
    this.availability$.subscribe(availability => {
      if (this.calendarComponent) {
        const calendarApi = this.calendarComponent.getApi();
        const events = this.mockAvailabilityService.convertToCalendarEvents(availability);
        calendarApi.removeAllEvents();
        calendarApi.addEventSource(events);
      }
      
      // Save to history for undo/redo functionality
      this.saveToHistory(availability);
    });
  }

  handleDateSelect(selectInfo: DateSelectArg) {
    // Handle date selection for creating new availability slots
    const dialogRef = this.dialog.open(AvailabilityDialogComponent, {
      width: '400px',
      data: { availability: null, date: selectInfo.start }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        console.log('New availability slot:', result);
        // The dialog component will dispatch the create action
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
        
        // Check if it's a right click
        if (clickInfo.jsEvent.which === 3 || clickInfo.jsEvent.button === 2) {
          // Prevent default context menu
          clickInfo.jsEvent.preventDefault();
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
    console.log('Events updated:', events);
  }

  handleEventResize(resizeInfo: any) {
    // Handle event resize
    console.log('Event resized:', resizeInfo.event.title);
    console.log('New start:', resizeInfo.event.start);
    console.log('New end:', resizeInfo.event.end);
    
    // Find the availability slot based on the event ID
    this.availability$.subscribe(availability => {
      const slot = availability.find(a => a.id === resizeInfo.event.id);
      if (slot) {
        // Create updated slot with new times
        const updatedSlot = {
          ...slot,
          startTime: resizeInfo.event.start,
          endTime: resizeInfo.event.end,
          duration: (resizeInfo.event.end.getTime() - resizeInfo.event.start.getTime()) / (1000 * 60) // Convert ms to minutes
        };
        
        // Update the slot
        this.store.dispatch(AvailabilityActions.updateAvailability({ availability: updatedSlot }));
      }
    });
  }

  handleEventDrop(dropInfo: any) {
    // Handle event drop (moving event to new time slot)
    console.log('Event dropped:', dropInfo.event.title);
    console.log('New start:', dropInfo.event.start);
    console.log('New end:', dropInfo.event.end);
    
    // Find the availability slot based on the event ID
    this.availability$.subscribe(availability => {
      const slot = availability.find(a => a.id === dropInfo.event.id);
      if (slot) {
        // Calculate the time difference
        const delta = dropInfo.delta;
        
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
    this.store.dispatch(DashboardActions.loadAvailability({ 
      providerId: 'provider-123', 
      date: today 
    }));
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
      // In a real implementation, we would dispatch actions to restore the previous state
      console.log('Undo to state:', prevState);
    }
  }

  redo(): void {
    if (this.canRedo()) {
      this.historyIndex++;
      const nextState = this.history[this.historyIndex];
      // In a real implementation, we would dispatch actions to restore the next state
      console.log('Redo to state:', nextState);
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
        // This would open the add availability dialog
        console.log('Add availability shortcut pressed');
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
        console.log('Copy week schedule:', result);
        // In a real implementation, this would copy the schedule from source to target week
        // This would involve fetching the source week's availability and creating new entries for the target week
      }
    });
  }

  openDatePicker(): void {
    const dialogRef = this.dialog.open(DatePickerDialogComponent, {
      width: '400px',
      data: { date: new Date() }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        const calendarApi = this.calendarComponent.getApi();
        calendarApi.gotoDate(result);
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
    
    // In a full implementation, we would position and open the context menu
    // For now, we'll use a simplified approach
    console.log('Context menu would appear here with options to Edit or Delete the slot');
  }

  editSlot() {
    if (this.selectedSlot) {
      const dialogRef = this.dialog.open(AvailabilityDialogComponent, {
        width: '400px',
        data: { availability: this.selectedSlot, date: this.selectedSlot.date }
      });

      dialogRef.afterClosed().subscribe(result => {
        if (result) {
          console.log('Updated availability slot:', result);
          // The dialog component will dispatch the update action
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
}