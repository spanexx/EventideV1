import { Component, Inject, OnInit } from '@angular/core';
import { Store, select } from '@ngrx/store';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Observable } from 'rxjs';
import * as AvailabilityActions from '../../store-availability/actions/availability.actions';
import { Availability } from '../../models/availability.models';
import { AvailabilityService } from '../../services/availability.service';
import * as AuthSelectors from '../../../auth/store/auth/selectors/auth.selectors';
import { User } from '../../../services/auth.service';
import { SnackbarService } from '../../../shared/services/snackbar.service';

interface AllDaySlot {
  startTime: Date;
  endTime: Date;
  duration: number;
}

@Component({
  selector: 'app-availability-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatCheckboxModule,
    MatSelectModule,
    MatSnackBarModule,
    MatDatepickerModule,
    MatNativeDateModule,
    FormsModule
  ],
  templateUrl: './availability-dialog.component.html',
  styleUrl: './availability-dialog.component.scss'
})
export class AvailabilityDialogComponent {
  availability: Availability;
  isNew: boolean;
  isRecurring: boolean;
  user$: Observable<User | null>;
  
  // Enhanced all-day slot properties
  numberOfSlots: number = 1;
  autoDistribute: boolean = true;
  slotPreview: AllDaySlot[] = [];

  constructor(
    public dialogRef: MatDialogRef<AvailabilityDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { 
      availability: Availability | null, 
      date: Date,
      startDate?: Date,
      endDate?: Date,
      allDay?: boolean
    },
    private store: Store,
    private availabilityService: AvailabilityService,
    private snackbarService: SnackbarService
  ) {
    this.isNew = !data.availability;
    this.user$ = this.store.pipe(select(AuthSelectors.selectUser));
    
    // Initialize all-day slot properties
    if (data.allDay) {
      this.numberOfSlots = 1;
      this.autoDistribute = true;
      this.slotPreview = [];
      this.updateSlotPreview();
    }
    
    if (data.availability) {
      this.availability = { ...data.availability };
      // Calculate duration based on start and end times for existing slots
      if (this.availability.startTime && this.availability.endTime) {
        const start = new Date(this.availability.startTime);
        const end = new Date(this.availability.endTime);
        this.availability.duration = Math.round((end.getTime() - start.getTime()) / (1000 * 60));
      }
      // Set the isRecurring flag based on the type
      this.isRecurring = this.availability.type === 'recurring';
      // Ensure date is a Date object if it exists
      if (this.availability.date && !(this.availability.date instanceof Date)) {
        this.availability.date = new Date(this.availability.date);
      }
      // Ensure dayOfWeek is a number if it exists
      if (this.availability.dayOfWeek && typeof this.availability.dayOfWeek === 'string') {
        this.availability.dayOfWeek = parseInt(this.availability.dayOfWeek, 10);
      }
    } else {
      // Calculate start and end times based on selection data
      let startDate: Date;
      let endDate: Date;
      
      if (data.startDate && data.endDate) {
        // Use the selected range
        startDate = new Date(data.startDate);
        endDate = new Date(data.endDate);
      } else {
        // Default to 9-10 AM on the provided date
        startDate = new Date(data.date);
        startDate.setHours(9, 0, 0, 0);
        endDate = new Date(data.date);
        endDate.setHours(10, 0, 0, 0);
      }
      
      // Calculate duration in minutes
      const duration = Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60));
      
      this.availability = {
        id: '',
        providerId: '', // Will be set from user data
        type: 'one_off',
        date: data.date || data.startDate,
        startTime: startDate,
        endTime: endDate,
        isBooked: false,
        duration: duration > 0 ? duration : 60 // Default to 60 minutes if calculation fails
      };
      this.isRecurring = false;
    }
  }

  onRecurringChange(isRecurring: boolean): void {
    this.isRecurring = isRecurring;
    this.availability.type = isRecurring ? 'recurring' : 'one_off';
    // If changing to recurring, clear the date
    if (isRecurring) {
      // For recurring, we don't need a specific date, but we keep the day of week
      if (this.availability.date) {
        this.availability.dayOfWeek = this.availability.date.getDay();
      }
      this.availability.date = undefined;
    } else {
      // If changing to one-off, set the date
      // If we don't have a date, use today
      if (!this.availability.date) {
        this.availability.date = new Date();
        // Also update the start and end times to match the date
        const newStartDate = new Date(this.availability.date);
        newStartDate.setHours(this.availability.startTime.getHours(), this.availability.startTime.getMinutes(), 0, 0);
        this.availability.startTime = newStartDate;
        
        const newEndDate = new Date(this.availability.date);
        newEndDate.setHours(this.availability.endTime.getHours(), this.availability.endTime.getMinutes(), 0, 0);
        this.availability.endTime = newEndDate;
      }
      this.availability.dayOfWeek = undefined;
    }
  }

  /**
   * Handle changes to the number of slots for all-day availability
   */
  onNumberOfSlotsChange(event: any): void {
    const value = event.target ? event.target.value : event;
    this.numberOfSlots = parseInt(value, 10) || 1;
    
    // Ensure the value is within reasonable bounds
    if (this.numberOfSlots < 1) this.numberOfSlots = 1;
    if (this.numberOfSlots > 24) this.numberOfSlots = 24;
    
    // Update the slot preview
    this.updateSlotPreview();
  }

  /**
   * Handle changes to the auto-distribute setting
   */
  onAutoDistributeChange(event: any): void {
    this.autoDistribute = event.checked !== undefined ? event.checked : event;
    
    // Update the slot preview
    this.updateSlotPreview();
  }

  /**
   * Update the preview of slot distribution
   */
  updateSlotPreview(): void {
    // Only update preview for all-day slots
    if (!this.data.allDay) return;
    
    if (this.autoDistribute) {
      // Auto-distribute slots evenly throughout the working day (8 AM to 8 PM)
      this.slotPreview = this.calculateEvenDistribution();
    } else {
      // For manual distribution, we would show a different UI
      // For now, we'll just show a simple distribution
      this.slotPreview = this.calculateEvenDistribution();
    }
  }

  /**
   * Calculate even distribution of slots throughout the working day
   * @returns Array of slot objects with startTime, endTime, and duration
   */
  calculateEvenDistribution(): AllDaySlot[] {
    const slots: AllDaySlot[] = [];
    
    // Working hours: 8 AM to 8 PM (12 hours = 720 minutes)
    const workingStart = new Date(this.data.date || new Date());
    workingStart.setHours(8, 0, 0, 0);
    
    const workingEnd = new Date(this.data.date || new Date());
    workingEnd.setHours(20, 0, 0, 0);
    
    const workingMinutes = 720; // 12 hours in minutes
    const breakTime = 15; // 15 minutes break between slots
    
    // Calculate time per slot including breaks
    // Total time = (slots * slot_time) + ((slots - 1) * break_time)
    // slot_time = (workingMinutes - ((numberOfSlots - 1) * breakTime)) / numberOfSlots
    const totalTimeForBreaks = (this.numberOfSlots - 1) * breakTime;
    const timePerSlot = (workingMinutes - totalTimeForBreaks) / this.numberOfSlots;
    
    // Ensure we have a reasonable slot duration
    if (timePerSlot < 15) {
      // If slots are too small, we'll adjust the number of slots
      this.numberOfSlots = Math.floor((workingMinutes + breakTime) / (15 + breakTime));
      if (this.numberOfSlots < 1) this.numberOfSlots = 1;
    }
    
    // Distribute slots
    let currentTime = new Date(workingStart);
    
    for (let i = 0; i < this.numberOfSlots; i++) {
      const startTime = new Date(currentTime);
      const endTime = new Date(currentTime.getTime() + timePerSlot * 60000);
      
      slots.push({
        startTime: startTime,
        endTime: endTime,
        duration: Math.round(timePerSlot)
      });
      
      // Add break time for next slot (except for the last slot)
      if (i < this.numberOfSlots - 1) {
        currentTime = new Date(endTime.getTime() + breakTime * 60000);
      }
    }
    
    return slots;
  }

  formatTime(date: Date): string {
    if (!date) return '';
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  }

  formatDate(date: Date): string {
    if (!date) return '';
    // Format as YYYY-MM-DD for the date input
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  onDateChange(event: any): void {
    if (this.availability.date) {
      // Update the start and end times to match the new date
      const newStartDate = new Date(this.availability.date);
      newStartDate.setHours(this.availability.startTime.getHours(), this.availability.startTime.getMinutes(), 0, 0);
      this.availability.startTime = newStartDate;
      
      const newEndDate = new Date(this.availability.date);
      newEndDate.setHours(this.availability.endTime.getHours(), this.availability.endTime.getMinutes(), 0, 0);
      this.availability.endTime = newEndDate;
    }
  }

  onStartTimeChange(event: any): void {
    const timeValue = event.target.value;
    if (timeValue) {
      const [hours, minutes] = timeValue.split(':').map(Number);
      const newDate = new Date(this.availability.startTime);
      newDate.setHours(hours, minutes, 0, 0);
      this.availability.startTime = newDate;
      this.onDurationChange();
    }
  }

  onNoClick(): void {
    this.dialogRef.close();
  }

  onDurationChange(event?: any): void {
    // Update duration if event is provided
    if (event) {
      this.availability.duration = event.value;

    }
    
    // Update end time based on duration
    if (this.availability.startTime) {
      const start = new Date(this.availability.startTime);
      const end = new Date(start.getTime() + this.availability.duration * 60000);
      this.availability.endTime = end;
    }
  }

  onSaveClick(): void {
    // Get the current user's ID before saving
    this.user$.subscribe(user => {
      if (user) {
        this.availability.providerId = user.id;
        
        // Log the availability data before saving
        console.log('Availability data being saved:', this.availability);
        console.log('Provider ID:', this.availability.providerId);
        console.log('Is new availability:', this.isNew);
        
        // Handle all-day slots differently
        if (this.data.allDay) {
          // For all-day slots, we need to create multiple slots based on the configuration
          this.createAllDaySlots(user.id);
          return;
        }
        
        // Ensure end time is correctly set based on duration before saving
        this.onDurationChange();
        
        // Ensure the date is properly set for one-off appointments
        if (!this.isRecurring && this.availability.date) {
          // Update the start and end times to match the selected date
          const newStartDate = new Date(this.availability.date);
          newStartDate.setHours(this.availability.startTime.getHours(), this.availability.startTime.getMinutes(), 0, 0);
          this.availability.startTime = newStartDate;
          
          const newEndDate = new Date(this.availability.date);
          newEndDate.setHours(this.availability.endTime.getHours(), this.availability.endTime.getMinutes(), 0, 0);
          this.availability.endTime = newEndDate;
        }
        
        // Log the availability data after processing
        console.log('Processed availability data:', this.availability);
        
        // Conflict checking is done on the backend
        // Dispatch the action to create or update the availability slot
        if (this.isNew) {
          // For new availability slots, we should not send an empty id field
          const { id, ...newAvailability } = this.availability;
          this.store.dispatch(AvailabilityActions.createAvailability({ availability: newAvailability as any }));
        } else {
          // For updates, we should send the complete availability object including the id
          this.store.dispatch(AvailabilityActions.updateAvailability({ availability: this.availability }));
        }
        
        // Close the dialog with the result
        this.dialogRef.close(this.availability);
      } else {
        console.error('No user found, cannot save availability');
        this.snackbarService.showError('No user found, please log in again');
      }
    });
  }

  /**
   * Create multiple slots for all-day availability
   * @param providerId The provider ID
   */
  createAllDaySlots(providerId: string): void {
    // Use the new service method to create all-day slots
    const allDayDto = {
      providerId: providerId,
      date: this.data.date,
      numberOfSlots: this.numberOfSlots,
      autoDistribute: this.autoDistribute,
      // Only include slots array when not auto-distributing
      ...(this.autoDistribute === false && {
        slots: this.slotPreview.map(slot => ({
          startTime: slot.startTime,
          endTime: slot.endTime,
          duration: slot.duration
        }))
      }),
      isRecurring: this.isRecurring,
      dayOfWeek: this.isRecurring ? this.availability.dayOfWeek : undefined
    };

    this.availabilityService.createAllDayAvailability(allDayDto).subscribe({
      next: (createdSlots) => {
        console.log('Created all-day slots:', createdSlots);
        // Close the dialog with the result
        this.dialogRef.close(createdSlots);
      },
      error: (error) => {
        console.error('Failed to create all-day slots:', error);
        this.snackbarService.showError('Failed to create all-day slots: ' + error.message);
      }
    });
  }
        this.snackbarService.showError('Failed to create all-day slots: ' + error.message);
      }
    });
  }
}