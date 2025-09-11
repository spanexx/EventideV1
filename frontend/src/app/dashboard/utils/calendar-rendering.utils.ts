/**
 * Calendar rendering utility functions
 */

/**
 * Render event content for the calendar
 * @param eventInfo The event information
 * @param calculateDuration Function to calculate duration in minutes
 * @returns The rendered event content
 */
export function renderEventContent(eventInfo: any, calculateDuration: (start: Date, end: Date) => number) {
  // Calculate duration in minutes
  const start = new Date(eventInfo.event.start);
  const end = new Date(eventInfo.event.end);
  const duration = calculateDuration(start, end);
  
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

/**
 * Handle day cell rendering to provide visual feedback for dates with existing availability
 * @param info Information about the day cell being rendered
 * @param availability$ Observable of availability data
 * @param isDateInPast Function to check if a date is in the past
 */
export function handleDayCellRender(
  info: any, 
  availability$: any,
  isDateInPast: (date: Date) => boolean
): void {
  // Get the date for this cell
  const cellDate = new Date(info.date);
  cellDate.setHours(0, 0, 0, 0);
  
  // Check if there's existing availability for this date
  availability$.subscribe((availability: any[]) => {
    const hasAvailability = availability.some(slot => {
      if (!slot.date && slot.startTime) {
        // For slots with only startTime, check if it's on the same date
        const slotDate = new Date(slot.startTime);
        slotDate.setHours(0, 0, 0, 0);
        return slotDate.getTime() === cellDate.getTime();
      } else if (slot.date) {
        // For slots with a date field, check if it matches
        const slotDate = new Date(slot.date);
        slotDate.setHours(0, 0, 0, 0);
        return slotDate.getTime() === cellDate.getTime();
      }
      return false;
    });
    
    // Add a class to indicate existing availability
    if (hasAvailability) {
      info.el.classList.add('has-availability');
    }
    
    // Check if the date is in the past
    if (isDateInPast(cellDate)) {
      info.el.classList.add('past-date');
    }
  });
}