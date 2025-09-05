import { Component, OnInit, ViewChild } from '@angular/core';
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
import * as DashboardActions from '../../store/actions/dashboard.actions';
import * as AvailabilityActions from '../../store/actions/availability.actions';
import * as DashboardSelectors from '../../store/selectors/dashboard.selectors';
import { Availability } from '../../models/availability.models';
import { MockAvailabilityService } from '../../services/mock-availability.service';
import { AvailabilityDialogComponent } from '../../components/availability-dialog/availability-dialog.component';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-availability',
  standalone: true,
  imports: [
    CommonModule,
    FullCalendarModule,
    MatButtonModule,
    MatIconModule
  ],
  templateUrl: './availability.component.html',
  styleUrl: './availability.component.scss'
})
export class AvailabilityComponent implements OnInit {
  @ViewChild('calendar') calendarComponent!: FullCalendarComponent;
  
  availability$: Observable<Availability[]>;
  loading$: Observable<boolean>;

  calendarOptions: CalendarOptions = {
    plugins: [
      interactionPlugin,
      dayGridPlugin,
      timeGridPlugin
    ],
    headerToolbar: {
      left: 'prev,next today',
      center: 'title',
      right: 'dayGridMonth,timeGridWeek,timeGridDay'
    },
    initialView: 'timeGridWeek',
    editable: true,
    selectable: true,
    selectMirror: true,
    dayMaxEvents: true,
    weekends: true,
    select: this.handleDateSelect.bind(this),
    eventClick: this.handleEventClick.bind(this),
    eventsSet: this.handleEvents.bind(this)
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
        // Check if it's a right click or if the user wants to delete
        if (clickInfo.jsEvent.ctrlKey || clickInfo.jsEvent.metaKey) {
          // Delete the slot
          if (confirm('Are you sure you want to delete this availability slot?')) {
            this.store.dispatch(AvailabilityActions.deleteAvailability({ id: slot.id }));
          }
        } else {
          // Edit the slot
          const dialogRef = this.dialog.open(AvailabilityDialogComponent, {
            width: '400px',
            data: { availability: slot, date: slot.date }
          });

          dialogRef.afterClosed().subscribe(result => {
            if (result) {
              console.log('Updated availability slot:', result);
              // The dialog component will dispatch the update action
            }
          });
        }
      }
    });
  }

  handleEvents(events: EventApi[]) {
    // Handle events update
    console.log('Events updated:', events);
  }

  refreshAvailability(): void {
    const today = new Date();
    this.store.dispatch(DashboardActions.loadAvailability({ 
      providerId: 'provider-123', 
      date: today 
    }));
  }
}