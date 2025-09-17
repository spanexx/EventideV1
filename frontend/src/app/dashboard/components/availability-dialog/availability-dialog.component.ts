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
import { MatRadioModule } from '@angular/material/radio';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatExpansionModule } from '@angular/material/expansion';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Observable } from 'rxjs';
import * as AvailabilityActions from '../../store-availability/actions/availability.actions';
import { Availability } from '../../models/availability.models';
import { AvailabilityService, CreateBulkAvailabilityDto } from '../../services/availability.service';
import * as AuthSelectors from '../../../auth/store/auth/selectors/auth.selectors';
import { User } from '../../../services/auth.service';
import { SnackbarService } from '../../../shared/services/snackbar.service';
import { PendingChangesService } from '../../services/pending-changes/pending-changes.service';
import { Change } from '../../services/pending-changes/pending-changes.interface';

interface AllDaySlot {
  startTime: Date;
  endTime: Date;
  duration: number;
}

interface BulkSlot {
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
    MatRadioModule,
    MatSnackBarModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatExpansionModule,
    FormsModule
  ],
  templateUrl: './availability-dialog.component.html',
  styleUrl: './availability-dialog.component.scss'
})
export class AvailabilityDialogComponent {
  availability!: Availability;
  isNew!: boolean;
  isRecurring!: boolean;
  user$: Observable<User | null>;
  
  // Custom duration properties
  customDuration: number | null = null;
  standardDurations = [15, 30, 45, 60, 90, 120];
  
  // Enhanced all-day slot properties
  numberOfSlots: number = 1;
  minutesPerSlot: number = 60;
  breakTime: number = 15; // Default break time of 15 minutes
  slotConfigurationMode: 'slots' | 'minutes' = 'slots';
  autoDistribute: boolean = true;
  slotPreview: AllDaySlot[] = [];
  
  // Custom day start/end times for all-day slots (default to 8:00 and 20:00)
  dayStartTime: string = '08:00';
  dayEndTime: string = '20:00';
  
  // Bulk creation properties
  isBulkCreation: boolean = false;
  startDate: Date | null = null;
  endDate: Date | null = null;
  quantity: number = 1;
  skipConflicts: boolean = false;
  
  // Date range mode
  dateRangeMode: 'single' | 'range' = 'single';

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
    private snackbarService: SnackbarService,
    private pendingChangesService: PendingChangesService
  ) {
    console.log('AvailabilityDialogComponent received data:', data);
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
      // If date is missing but startTime exists, use startTime's date
      if (!this.availability.date && this.availability.startTime) {
        this.availability.date = new Date(this.availability.startTime);
      }
      // Ensure dayOfWeek is a number if it exists
      if (this.availability.dayOfWeek && typeof this.availability.dayOfWeek === 'string') {
        this.availability.dayOfWeek = parseInt(this.availability.dayOfWeek, 10);
      }
    } else {
      // Check if the selected date is in the past
      if (data.date && this.isDateInPast(data.date)) {
        this.snackbarService.showError('Cannot create availability for past dates');
        // Close the dialog
        setTimeout(() => {
          this.dialogRef.close();
        }, 100);
        return;
      }
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
      if (!this.standardDurations.includes(duration)) {
        this.customDuration = duration;
      }
      
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

  /**
   * Handle changes to the day start/end times
   */
  onDayTimeChange(event: any): void {
    // Update the slot preview when day times change
    this.updateSlotPreview();
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
   * Handle changes to the slot configuration mode
   */
  onSlotConfigurationModeChange(event: any): void {
    const value = event.value || event;
    this.slotConfigurationMode = value;
    
    // Update the slot preview
    this.updateSlotPreview();
  }

  /**
   * Handle changes to the minutes per slot
   */
  onMinutesPerSlotChange(event: any): void {
    const value = event.target ? event.target.value : event;
    this.minutesPerSlot = parseInt(value, 10) || 60;
    
    // Ensure the value is within reasonable bounds
    if (this.minutesPerSlot < 15) this.minutesPerSlot = 15;
    if (this.minutesPerSlot > 240) this.minutesPerSlot = 240;
    
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
    
    // Use custom day start/end times or default to 8 AM to 8 PM
    const [startHours, startMinutes] = this.dayStartTime.split(':').map(Number);
    const [endHours, endMinutes] = this.dayEndTime.split(':').map(Number);
    
    const workingStart = new Date(this.data.date || new Date());
    workingStart.setHours(startHours, startMinutes, 0, 0);
    
    const workingEnd = new Date(this.data.date || new Date());
    workingEnd.setHours(endHours, endMinutes, 0, 0);
    
    // Calculate working minutes
    const workingMinutes = (workingEnd.getTime() - workingStart.getTime()) / (1000 * 60);
    
    // Validate that end time is after start time
    if (workingMinutes <= 0) {
      // Invalid time range, return empty array
      return slots;
    }
    
    // Calculate based on the selected configuration mode
    let numberOfSlots: number;
    
    if (this.slotConfigurationMode === 'minutes') {
      // Calculate number of slots based on minutes per slot
      // Total slots = (workingMinutes - (breakTime * (slots - 1))) / minutesPerSlot
      // Simplified: slots = workingMinutes / (minutesPerSlot + breakTime)
      numberOfSlots = Math.floor((workingMinutes + this.breakTime) / (this.minutesPerSlot + this.breakTime));
      if (numberOfSlots < 1) numberOfSlots = 1;
    } else {
      // Use the specified number of slots
      numberOfSlots = this.numberOfSlots;
    }
    
    // Calculate time per slot including breaks
    // Total time = (slots * slot_time) + ((slots - 1) * break_time)
    // slot_time = (workingMinutes - ((numberOfSlots - 1) * breakTime)) / numberOfSlots
    const totalTimeForBreaks = (numberOfSlots - 1) * this.breakTime;
    const timePerSlot = (workingMinutes - totalTimeForBreaks) / numberOfSlots;
    
    // Ensure we have a reasonable slot duration
    if (timePerSlot < 15) {
      // If slots are too small, we'll adjust the number of slots
      numberOfSlots = Math.floor((workingMinutes + this.breakTime) / (15 + this.breakTime));
      if (numberOfSlots < 1) numberOfSlots = 1;
      
      // Recalculate time per slot with adjusted number of slots
      const adjustedTotalTimeForBreaks = (numberOfSlots - 1) * this.breakTime;
      // Update timePerSlot with the new calculation
      const adjustedTimePerSlot = (workingMinutes - adjustedTotalTimeForBreaks) / numberOfSlots;
    }
    
    // Distribute slots
    let currentTime = new Date(workingStart);
    
    for (let i = 0; i < numberOfSlots; i++) {
      const startTime = new Date(currentTime);
      const endTime = new Date(currentTime.getTime() + timePerSlot * 60000);
      
      slots.push({
        startTime: startTime,
        endTime: endTime,
        duration: Math.round(timePerSlot)
      });
      
      // Add break time for next slot (except for the last slot)
      if (i < numberOfSlots - 1) {
        currentTime = new Date(endTime.getTime() + this.breakTime * 60000);
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
      // Check if the selected date is in the past
      if (this.isDateInPast(this.availability.date)) {
        this.snackbarService.showError('Cannot select past dates for availability');
        // Reset to today's date
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        this.availability.date = today;
        return;
      }
      
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

  onDeleteClick(): void {
    if (!this.isNew && this.availability && this.availability.id) {
      this.user$.subscribe(user => {
        if (user) {
          const confirmed = confirm('Are you sure you want to delete this availability slot?');
          if (confirmed) {
            // Instead of directly dispatching delete action, add to pending changes
            const change: Change = {
              id: `delete-${this.availability.id}-${Date.now()}`,
              type: 'delete',
              entityId: this.availability.id,
              timestamp: new Date()
            };
            this.pendingChangesService.addChange(change);
            this.dialogRef.close({ deleted: true, id: this.availability.id });
          }
        }
      }).unsubscribe();
    }
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
        
        // Handle bulk creation
        if (this.isBulkCreation) {
          this.createBulkSlotsPendingChanges(user.id);
          return;
        }
        
        // Handle all-day slots differently
        if (this.data.allDay) {
          // For all-day slots, we need to create multiple slots based on the configuration
          this.createAllDaySlotsPendingChanges(user.id);
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
        } else if (!this.isRecurring && !this.availability.date && this.availability.startTime) {
          // If date is missing but startTime exists, use startTime's date
          this.availability.date = new Date(this.availability.startTime);
        }
        
        // Log the availability data after processing
        console.log('Processed availability data:', this.availability);
        
        // Instead of directly creating/updating, add to pending changes
        if (this.isNew) {
          // For new availability slots, create a change record
          const { id, ...newAvailability } = this.availability;
          // Generate a temporary ID for the new slot
          const tempId = `temp-${Date.now()}-${Math.random()}`;
          const slotWithId = { ...newAvailability, id: tempId };
          
          const change: Change = {
            id: `create-${Date.now()}-${Math.random()}`,
            type: 'create',
            entity: slotWithId as Availability,
            timestamp: new Date()
          };
          this.pendingChangesService.addChange(change);
          
          // Close the dialog with the result
          this.dialogRef.close(slotWithId);
        } else {
          // For updates, create an update change record
          const change: Change = {
            id: `update-${this.availability.id}-${Date.now()}`,
            type: 'update',
            entityId: this.availability.id,
            entity: this.availability,
            timestamp: new Date()
          };
          this.pendingChangesService.addChange(change);
          
          // Close the dialog with the result
          this.dialogRef.close(this.availability);
        }
        
      } else {
        console.error('No user found, cannot save availability');
        this.snackbarService.showError('No user found, please log in again');
      }
    });
  }

  /**
   * Check if a date is in the past
   * @param date The date to check
   * @returns True if the date is in the past, false otherwise
   */
  isDateInPast(date: Date): boolean {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Set to start of day for comparison
    const checkDate = new Date(date);
    checkDate.setHours(0, 0, 0, 0); // Set to start of day for comparison
    return checkDate < today;
  }

  /**
   * Create multiple slots for all-day availability using pending changes
   * @param providerId The provider ID
   */
  createAllDaySlotsPendingChanges(providerId: string): void {
    // Calculate the slots based on the current configuration
    this.updateSlotPreview();
    
    // Add each slot to pending changes
    const slots = this.slotPreview.map(slot => {
      const tempId = `temp-${Date.now()}-${Math.random()}`;
      return {
        id: tempId,
        providerId: providerId,
        type: this.isRecurring ? 'recurring' : 'one_off',
        date: this.isRecurring ? undefined : this.data.date,
        dayOfWeek: this.isRecurring ? this.availability.dayOfWeek : undefined,
        startTime: slot.startTime,
        endTime: slot.endTime,
        duration: slot.duration,
        isBooked: false
      } as Availability;
    });
    
    // Add each slot as a separate pending change
    slots.forEach(slot => {
      const change: Change = {
        id: `create-${Date.now()}-${Math.random()}`,
        type: 'create',
        entity: slot,
        timestamp: new Date()
      };
      this.pendingChangesService.addChange(change);
    });
    
    console.log('Added all-day slots to pending changes:', slots);
    
    // Close the dialog with the result
    this.dialogRef.close(slots);
  }

  /**
   * Create multiple slots in bulk using pending changes
   * @param providerId The provider ID
   */
  createBulkSlotsPendingChanges(providerId: string): void {
    // Generate bulk slots based on the configuration
    const slots = this.generateBulkSlots(providerId);
    
    // Add each slot as a separate pending change
    slots.forEach(slot => {
      const change: Change = {
        id: `create-${Date.now()}-${Math.random()}`,
        type: 'create',
        entity: slot,
        timestamp: new Date()
      };
      this.pendingChangesService.addChange(change);
    });
    
    console.log('Added bulk slots to pending changes:', slots);
    
    // Close the dialog with the result
    this.dialogRef.close(slots);
  }

  /**
   * Generate bulk slots based on the current configuration
   * @param providerId The provider ID
   * @returns Array of availability slots
   */
  private generateBulkSlots(providerId: string): Availability[] {
    const slots: Availability[] = [];
    
    // Use the existing logic from createBulkSlots but don't make HTTP calls
    if (this.dateRangeMode === 'single') {
      // Single date
      for (let i = 0; i < this.quantity; i++) {
        const tempId = `temp-${Date.now()}-${Math.random()}-${i}`;
        const slot: Availability = {
          id: tempId,
          providerId: providerId,
          type: this.isRecurring ? 'recurring' : 'one_off',
          date: this.isRecurring ? undefined : this.availability.date,
          dayOfWeek: this.isRecurring ? this.availability.dayOfWeek : undefined,
          startTime: this.availability.startTime,
          endTime: this.availability.endTime,
          duration: this.availability.duration,
          isBooked: false
        };
        slots.push(slot);
      }
    } else if (this.dateRangeMode === 'range' && this.startDate && this.endDate) {
      // Date range - create one slot per day
      const currentDate = new Date(this.startDate);
      
      while (currentDate <= this.endDate) {
        const tempId = `temp-${Date.now()}-${Math.random()}-${currentDate.getTime()}`;
        
        // Set start and end times for this date
        const startDateTime = new Date(currentDate);
        startDateTime.setHours(this.availability.startTime.getHours(), this.availability.startTime.getMinutes(), 0, 0);
        
        const endDateTime = new Date(currentDate);
        endDateTime.setHours(this.availability.endTime.getHours(), this.availability.endTime.getMinutes(), 0, 0);
        
        const slot: Availability = {
          id: tempId,
          providerId: providerId,
          type: 'one_off',
          date: new Date(currentDate),
          startTime: startDateTime,
          endTime: endDateTime,
          duration: this.availability.duration,
          isBooked: false
        };
        slots.push(slot);
        
        // Move to next day
        currentDate.setDate(currentDate.getDate() + 1);
      }
    }
    
    return slots;
  }

  /**
   * @deprecated This method directly creates slots in the database, bypassing pending changes.
   * Use createAllDaySlotsPendingChanges() instead.
   * Create multiple slots for all-day availability
   * @param providerId The provider ID
   */
  createAllDaySlots(providerId: string): void {
    // Parse day start/end times to create Date objects
    const [startHours, startMinutes] = this.dayStartTime.split(':').map(Number);
    const [endHours, endMinutes] = this.dayEndTime.split(':').map(Number);
    
    // Create Date objects for working start/end times
    const workingStartDate = new Date(this.data.date);
    workingStartDate.setHours(startHours, startMinutes, 0, 0);
    
    const workingEndDate = new Date(this.data.date);
    workingEndDate.setHours(endHours, endMinutes, 0, 0);
    
    // Use the new service method to create all-day slots
    const allDayDto = {
      providerId: providerId,
      date: this.data.date,
      workingStartTime: workingStartDate,
      workingEndTime: workingEndDate,
      numberOfSlots: this.slotConfigurationMode === 'slots' ? this.numberOfSlots : undefined,
      minutesPerSlot: this.slotConfigurationMode === 'minutes' ? this.minutesPerSlot : undefined,
      breakTime: this.breakTime, // Include the configurable break time
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
        
        // Refresh the calendar after a short delay to ensure the store has been updated
        setTimeout(() => {
          // Dispatch loadAvailability to refresh the calendar
          this.store.dispatch(AvailabilityActions.loadAvailability({ 
            providerId: providerId, 
            date: this.data.date
          }));
        }, 100);
      },
      error: (error) => {
        console.error('Failed to create all-day slots:', error);
        this.snackbarService.showError('Failed to create all-day slots: ' + (error.message || 'Unknown error'));
      }
    });
  }

  /**
   * @deprecated This method directly creates slots in the database, bypassing pending changes.
   * Use createBulkSlotsPendingChanges() instead.
   * Create multiple slots in bulk
   * @param providerId The provider ID
   */
  createBulkSlots(providerId: string): void {
    // Prepare the bulk creation DTO
    const bulkDto: CreateBulkAvailabilityDto = {
      providerId: providerId,
      type: this.isRecurring ? 'recurring' : 'one_off',
      dayOfWeek: this.isRecurring ? this.availability.dayOfWeek : undefined,
      date: this.dateRangeMode === 'single' ? this.availability.date : undefined,
      startDate: this.startDate || undefined,
      endDate: this.endDate || undefined,
      quantity: this.quantity,
      skipConflicts: this.skipConflicts
    };

    this.availabilityService.createBulkAvailability(bulkDto).subscribe({
      next: (createdSlots) => {
        console.log('Created bulk slots:', createdSlots);
        // Close the dialog with the result
        this.dialogRef.close(createdSlots);
        
        // Refresh the calendar after a short delay to ensure the store has been updated
        // Use the start date or today as the refresh date
        const refreshDate = this.startDate || new Date();
        setTimeout(() => {
          // Dispatch loadAvailability to refresh the calendar
          this.store.dispatch(AvailabilityActions.loadAvailability({ 
            providerId: providerId, 
            date: refreshDate
          }));
        }, 100);
      },
      error: (error) => {
        console.error('Failed to create bulk slots:', error);
        this.snackbarService.showError('Failed to create bulk slots: ' + (error.message || 'Unknown error'));
      }
    });
  }
}
