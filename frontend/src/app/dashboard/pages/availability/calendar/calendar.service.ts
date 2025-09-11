import { Injectable } from '@angular/core';
import { FullCalendarComponent } from '@fullcalendar/angular';
import { EventApi } from '@fullcalendar/core';
import interactionPlugin from '@fullcalendar/interaction';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import { Availability } from '../../../models/availability.models';
import { AvailabilityService } from '../../../services/availability.service';

@Injectable({
  providedIn: 'root'
})
export class CalendarService {
  constructor(private availabilityService: AvailabilityService) {}

  /**
   * Initialize calendar options
   * @returns CalendarOptions object with all configuration
   */
  initializeCalendarOptions(
    handleDateSelect: (selectInfo: any) => void,
    handleEventClick: (clickInfo: any) => void,
    handleEvents: (events: EventApi[]) => void,
    renderEventContent: (eventInfo: any) => any,
    handleDayCellRender: (info: any) => void,
    handleEventResize: (resizeInfo: any) => void,
    handleEventDrop: (dropInfo: any) => void,
    openDatePicker: () => void,
    handleEventContextMenu: (mouseEvent: MouseEvent, eventInfo: any) => void
  ): any {
    return {
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
          click: openDatePicker
        }
      },
      initialView: 'timeGridWeek',
      editable: true,
      selectable: true,
      selectMirror: true,
      dayMaxEvents: true,
      weekends: true,
      select: handleDateSelect,
      eventClick: handleEventClick,
      eventsSet: handleEvents,
      eventContent: renderEventContent,
      eventClassNames: (arg: any) => {
        const classes: string[] = [];
        if (arg.event.extendedProps['isBooked']) {
          classes.push('event-booked');
        } else {
          classes.push('event-available');
        }
        try {
          const start: Date = arg.event.start;
          const now = new Date();
          // Mark past-day slots as invalid if the date is before today
          const startDay = new Date(start);
          startDay.setHours(0,0,0,0);
          const today = new Date();
          today.setHours(0,0,0,0);
          if (startDay < today) {
            classes.push('event-invalid');
          }
        } catch {}
        return classes;
      },
      // Custom rendering for days with availability
      dayCellDidMount: handleDayCellRender,
      // Enable drag-to-resize functionality
      eventResizableFromStart: true,
      eventResize: handleEventResize,
      // Enable drag-to-move functionality
      eventDrop: handleEventDrop
      ,
      eventDidMount: (info: any) => {
        if (info.el) {
          info.el.addEventListener('contextmenu', (e: MouseEvent) => {
            e.preventDefault();
            handleEventContextMenu(e, info);
          });
        }
      }
    };
  }

  /**
   * Update the calendar with new availability data
   * @param calendarComponent The FullCalendar component
   * @param availability Current availability data
   * @param previousAvailability Previous availability data for comparison
   * @param updateSingleCalendarEvent Function to update a single event
   * @param refreshFullCalendar Function to refresh the full calendar
   * @param getChangedEvents Function to get changed events
   */
  updateCalendarWithAvailability(
    calendarComponent: FullCalendarComponent | undefined,
    availability: Availability[], 
    previousAvailability: Availability[],
    updateSingleCalendarEvent: (updatedSlot: Availability) => void,
    refreshFullCalendar: (availability: Availability[]) => void,
    getChangedEvents: (previous: Availability[], current: Availability[]) => Availability[]
  ): void {
    // Use a small delay to ensure the calendar component is fully initialized
    setTimeout(() => {
      if (calendarComponent) {
        const calendarApi = calendarComponent.getApi();
        // Check if calendarApi is available before using it
        if (calendarApi) {
          // Determine if this is a single event update by comparing with the previous state
          if (previousAvailability.length > 0) {
            // Check if only one event has changed
            const changedEvents = getChangedEvents(previousAvailability, availability);
            if (changedEvents.length === 1) {
              // Single event change, update only that event
              updateSingleCalendarEvent(changedEvents[0]);
            } else {
              // Multiple events changed or new events added, do full refresh
              refreshFullCalendar(availability);
            }
          } else {
            // Initial load, do full refresh
            refreshFullCalendar(availability);
          }
        }
      }
    }, 0);
  }

  /**
   * Refresh the entire calendar with new events
   * @param calendarComponent The FullCalendar component
   * @param availability Current availability data
   */
  refreshFullCalendar(
    calendarComponent: FullCalendarComponent | undefined,
    availability: Availability[]
  ): void {
    if (calendarComponent) {
      const calendarApi = calendarComponent.getApi();
      if (calendarApi) {
        const events = this.availabilityService.convertToCalendarEvents(availability);
        calendarApi.removeAllEvents();
        calendarApi.addEventSource(events);
      }
    }
  }

  /**
   * Update a single event in the calendar without refreshing the entire calendar
   * This is more efficient during drag operations
   * @param calendarComponent The FullCalendar component
   * @param updatedSlot The updated availability slot
   */
  updateSingleCalendarEvent(
    calendarComponent: FullCalendarComponent | undefined,
    updatedSlot: Availability
  ): void {
    if (calendarComponent) {
      const calendarApi = calendarComponent.getApi();
      if (calendarApi) {
        // Find the existing event and update it
        const existingEvent = calendarApi.getEventById(updatedSlot.id);
        if (existingEvent) {
          existingEvent.setDates(updatedSlot.startTime, updatedSlot.endTime);
          existingEvent.setProp('title', updatedSlot.isBooked ? 'Booked' : 'Available');
          existingEvent.setExtendedProp('isBooked', updatedSlot.isBooked);
          existingEvent.setExtendedProp('isRecurring', updatedSlot.type === 'recurring');
        }
      }
    }
  }

  /**
   * Open the context menu at the specified position
   * @param contextMenuTrigger The context menu trigger
   * @param event MouseEvent containing position information
   */
  openContextMenuAtPosition(contextMenuTrigger: any, event: MouseEvent): void {
    if (contextMenuTrigger) {
      // Use setTimeout to ensure the position is set before opening
      setTimeout(() => {
        contextMenuTrigger.openMenu();
        // After opening, adjust the position with CSS
        const panel = document.querySelector('.mat-menu-panel');
        if (panel) {
          (panel as HTMLElement).style.position = 'fixed';
          (panel as HTMLElement).style.left = event.clientX + 'px';
          (panel as HTMLElement).style.top = event.clientY + 'px';
        }
      });
    }
  }
}