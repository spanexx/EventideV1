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
        left: 'prev',
        center: 'title',
        right: 'today,next'
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
      eventDrop: handleEventDrop,
      eventDidMount: (info: any) => {
        if (info.el) {
          info.el.addEventListener('contextmenu', (e: MouseEvent) => {
            e.preventDefault();
            handleEventContextMenu(e, info);
          });
        }
      },
      viewDidMount: (info: any) => {
        // Add context menu listener to the entire calendar container
        const calendarContainer = info.el.closest('.fc');
        if (calendarContainer) {
          calendarContainer.addEventListener('contextmenu', (e: MouseEvent) => {
            // Check if we clicked on an event or empty space using the new helper method
            const eventElement = this.getEventFromClick(e, calendarContainer);
            
            // If we clicked on an event, let the event's context menu handler take precedence
            // The eventDidMount handler will prevent the default and handle the event context menu
          });
        }
        
        // Update smart calendar information when view changes
        this.updateSmartCalendarInfo(info);
      },
      dateClick: (info: any) => {
        // Handle left click on empty time slots
        console.log('Date clicked:', info);
      },
      // Add smart features to the calendar
      viewSkeletonRender: (info: any) => {
        // Add smart features when the view skeleton is rendered
        this.addSmartFeatures(info);
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
            console.log('Previous availability length:', previousAvailability.length);
            console.log('Current availability length:', availability.length);
            console.log('Changed events count:', changedEvents.length);
            
            // Check if any of the changed events are new (have temp IDs)
            const hasNewEvents = changedEvents.some(event => event.id.startsWith('temp-'));
            console.log('Has new events (temp IDs):', hasNewEvents);
            
            if (changedEvents.length === 1 && !hasNewEvents) {
              // Single event change and not a new event, update only that event
              console.log('Updating single calendar event:', changedEvents[0]);
              updateSingleCalendarEvent(changedEvents[0]);
            } else {
              // Multiple events changed or new events added, do full refresh
              console.log('Refreshing full calendar with all events (reason: multiple changes or new events)');
              refreshFullCalendar(availability);
            }
          } else {
            // Initial load, do full refresh
            console.log('Initial load, refreshing full calendar');
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
    console.log('Refreshing full calendar with availability:', availability);
    if (calendarComponent) {
      const calendarApi = calendarComponent.getApi();
      if (calendarApi) {
        const events = this.availabilityService.convertToCalendarEvents(availability);
        calendarApi.removeAllEvents();
        events.forEach(event => {
          calendarApi.addEvent(event);
        });
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
        } else {
          // If the event doesn't exist, add it as a new event
          const newEvent = this.availabilityService.convertToCalendarEvents([updatedSlot])[0];
          if (newEvent) {
            calendarApi.addEvent(newEvent);
          }
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

  /**
   * Get the date and time from a mouse event position on the calendar
   * @param calendarApi The FullCalendar API instance
   * @param e MouseEvent from the click
   * @returns Date object representing the clicked time, or null if not found
   */
  getDateFromPosition(calendarApi: any, e: MouseEvent): Date | null {
    // Since getDateFromPoint doesn't exist, we'll return null and let the component handle the calculation
    return null;
  }

  /**
   * Check if a click event occurred on a calendar event
   * @param e MouseEvent from the click
   * @param calendarContainer The calendar container element
   * @returns The event element if clicked on an event, null otherwise
   */
  getEventFromClick(e: MouseEvent, calendarContainer: HTMLElement): HTMLElement | null {
    let targetElement = e.target as HTMLElement;
    
    // Traverse up the DOM to check if we clicked on an event
    while (targetElement && targetElement !== calendarContainer) {
      // Check for various event-related classes that FullCalendar uses
      if (targetElement.classList && 
          (targetElement.classList.contains('fc-event') || 
           targetElement.classList.contains('fc-timegrid-event') ||
           targetElement.classList.contains('fc-daygrid-event'))) {
        return targetElement;
      }
      targetElement = targetElement.parentElement as HTMLElement;
    }
    
    return null;
  }
  
  /**
   * Update smart calendar information when view changes
   * @param info ViewDidMount info
   */
  updateSmartCalendarInfo(info: any): void {
    // This method will be called when the view is mounted
    // We can use it to update smart calendar information
    console.log('View mounted:', info);
  }
  
  /**
   * Add smart features to the calendar
   * @param info ViewSkeletonRender info
   */
  addSmartFeatures(info: any): void {
    // This method will be called when the view skeleton is rendered
    // We can use it to add smart features to the calendar
    console.log('View skeleton rendered:', info);
  }
  
  /**
   * Check if a date is in the past
   * @param date Date to check
   * @returns True if the date is in the past, false otherwise
   */
  isDateInPast(date: Date): boolean {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const checkDate = new Date(date);
    checkDate.setHours(0, 0, 0, 0);
    return checkDate < today;
  }
}