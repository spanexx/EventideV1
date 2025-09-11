import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class DialogDataService {
  /**
   * Prepare data for the availability dialog
   * @param availability The availability data (null for new)
   * @param date The date for the availability
   * @param startDate The start date (optional)
   * @param endDate The end date (optional)
   * @param allDay Whether it's an all-day event (optional)
   * @returns The prepared data object
   */
  prepareAvailabilityDialogData(
    availability: any | null,
    date: Date,
    startDate?: Date,
    endDate?: Date,
    allDay?: boolean
  ): any {
    if (availability) {
      return { availability, date };
    } else {
      // Calculate start and end times based on selection data
      let start: Date;
      let end: Date;
      
      if (startDate && endDate) {
        // Use the selected range
        start = new Date(startDate);
        end = new Date(endDate);
      } else {
        // Default to 9-10 AM on the provided date
        start = new Date(date);
        start.setHours(9, 0, 0, 0);
        end = new Date(date);
        end.setHours(10, 0, 0, 0);
      }
      
      // Calculate duration in minutes
      const duration = Math.round((end.getTime() - start.getTime()) / (1000 * 60));
      
      return {
        availability: null,
        date: date || startDate,
        startDate: start,
        endDate: end,
        allDay: allDay,
        duration: duration > 0 ? duration : 60 // Default to 60 minutes if calculation fails
      };
    }
  }

  /**
   * Prepare data for the confirmation dialog
   * @param title The dialog title
   * @param message The dialog message
   * @param confirmText The confirm button text
   * @param cancelText The cancel button text
   * @returns The prepared data object
   */
  prepareConfirmationDialogData(
    title: string,
    message: string,
    confirmText: string,
    cancelText: string
  ): any {
    return {
      title: title,
      message: message,
      confirmText: confirmText,
      cancelText: cancelText
    };
  }

  /**
   * Prepare data for the copy week dialog
   * @returns The prepared data object
   */
  prepareCopyWeekDialogData(): any {
    return {};
  }

  /**
   * Prepare data for the date picker dialog
   * @param date The initial date
   * @returns The prepared data object
   */
  prepareDatePickerDialogData(date: Date): any {
    return { date: date };
  }
}