import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSelectModule } from '@angular/material/select';
import { MatRadioModule } from '@angular/material/radio';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Observable } from 'rxjs';
import { Availability } from '../../models/availability.models';
import { User } from '../../../services/auth.service';
import { Change } from '../../services/pending-changes/pending-changes.interface';
import { AvailabilityDialogFacade } from '../../services/availability-dialog.facade';
import { AllDayConfiguratorComponent } from '../all-day-configurator/all-day-configurator.component';
import { BulkCreationConfiguratorComponent, BulkCreationSettings } from '../bulk-creation-configurator/bulk-creation-configurator.component';
import { AvailabilityGenerationService } from '../../services/availability-generation.service';

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
        MatRadioModule,
        MatDatepickerModule,
        MatNativeDateModule,
        FormsModule,
        AllDayConfiguratorComponent,
        BulkCreationConfiguratorComponent
    ],
    templateUrl: './availability-dialog.component.html',
    styleUrls: ['./availability-dialog.component.scss']
})
export class AvailabilityDialogComponent implements OnInit {
    availability!: Availability;
    isNew!: boolean;
    isRecurring!: boolean;
    user$: Observable<User | null>;

    customDuration: number | null = null;
    standardDurations = [15, 30, 45, 60, 90, 120];

    isBulkCreation: boolean = false;
    allDaySlots: AllDaySlot[] = [];
    bulkCreationSettings: BulkCreationSettings | null = null;

    constructor(
        public dialogRef: MatDialogRef<AvailabilityDialogComponent>,
        @Inject(MAT_DIALOG_DATA) public data: {
            availability: Availability | null,
            date: Date,
            startDate?: Date,
            endDate?: Date,
            allDay?: boolean
        },
        private facade: AvailabilityDialogFacade,
        private availabilityGenerationService: AvailabilityGenerationService,
    ) {
        this.isNew = !data.availability;
        this.user$ = this.facade.getUser$();

        if (data.availability) {
            this.availability = { ...data.availability };
            if (this.availability.startTime && this.availability.endTime) {
                const start = new Date(this.availability.startTime);
                const end = new Date(this.availability.endTime);
                this.availability.duration = Math.round((end.getTime() - start.getTime()) / (1000 * 60));
            }
            this.isRecurring = this.availability.type === 'recurring';
            if (this.availability.date && !(this.availability.date instanceof Date)) {
                this.availability.date = new Date(this.availability.date);
            }
            if (!this.availability.date && this.availability.startTime) {
                this.availability.date = new Date(this.availability.startTime);
            }
            if (this.availability.dayOfWeek && typeof this.availability.dayOfWeek === 'string') {
                this.availability.dayOfWeek = parseInt(this.availability.dayOfWeek, 10);
            }
        } else {
            if (data.date && this.isDateInPast(data.date)) {
                this.facade.showError('Cannot create availability for past dates');
                setTimeout(() => this.dialogRef.close(), 100);
                return;
            }
            let startDate: Date;
            let endDate: Date;
            if (data.startDate && data.endDate) {
                startDate = new Date(data.startDate);
                endDate = new Date(data.endDate);
            } else {
                startDate = new Date(data.date);
                startDate.setHours(9, 0, 0, 0);
                endDate = new Date(data.date);
                endDate.setHours(10, 0, 0, 0);
            }
            const duration = Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60));
            if (!this.standardDurations.includes(duration)) {
                this.customDuration = duration;
            }
            this.availability = {
                id: '',
                providerId: '',
                type: 'one_off',
                date: data.date || data.startDate,
                startTime: startDate,
                endTime: endDate,
                isBooked: false,
                duration: duration > 0 ? duration : 60
            };
            this.isRecurring = false;
        }
    }

    ngOnInit(): void { }

    onRecurringChange(isRecurring: boolean): void {
        this.isRecurring = isRecurring;
        this.availability.type = isRecurring ? 'recurring' : 'one_off';
        if (isRecurring) {
            if (this.availability.date) {
                this.availability.dayOfWeek = this.availability.date.getDay();
            }
            this.availability.date = undefined;
        } else {
            if (!this.availability.date) {
                this.availability.date = new Date();
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

    onDateChange(event: any): void {
        if (this.availability.date) {
            if (this.isDateInPast(this.availability.date)) {
                this.facade.showError('Cannot select past dates for availability');
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                this.availability.date = today;
                return;
            }
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

    onDurationChange(event?: any): void {
        if (event) {
            this.availability.duration = event.value;
        }
        if (this.availability.startTime) {
            const start = new Date(this.availability.startTime);
            const end = new Date(start.getTime() + this.availability.duration * 60000);
            this.availability.endTime = end;
        }
    }

    onNoClick(): void {
        this.dialogRef.close();
    }

    onDeleteClick(): void {
        if (!this.isNew && this.availability && this.availability.id) {
            const confirmed = confirm('Are you sure you want to delete this availability slot?');
            if (confirmed) {
                const change: Change = {
                    id: `delete-${this.availability.id}-${Date.now()}`,
                    type: 'delete',
                    entityId: this.availability.id,
                    timestamp: new Date()
                };
                this.facade.addChange(change);
                this.dialogRef.close({ deleted: true, id: this.availability.id });
            }
        }
    }

    onSaveClick(): void {
        this.user$.subscribe(user => {
            if (user) {
                this.availability.providerId = user.id;

                if (this.isBulkCreation) {
                    this.createBulkSlots(user.id);
                    return;
                }

                if (this.data.allDay) {
                    this.createAllDaySlots(user.id);
                    return;
                }

                this.onDurationChange();
                if (!this.isRecurring && this.availability.date) {
                    const newStartDate = new Date(this.availability.date);
                    newStartDate.setHours(this.availability.startTime.getHours(), this.availability.startTime.getMinutes(), 0, 0);
                    this.availability.startTime = newStartDate;
                    const newEndDate = new Date(this.availability.date);
                    newEndDate.setHours(this.availability.endTime.getHours(), this.availability.endTime.getMinutes(), 0, 0);
                    this.availability.endTime = newEndDate;
                } else if (!this.isRecurring && !this.availability.date && this.availability.startTime) {
                    this.availability.date = new Date(this.availability.startTime);
                }

                if (this.isNew) {
                    const { id, ...newAvailability } = this.availability;
                    const tempId = `temp-${Date.now()}-${Math.random()}`;
                    const slotWithId = { ...newAvailability, id: tempId };
                    const change: Change = {
                        id: `create-${Date.now()}-${Math.random()}`,
                        type: 'create',
                        entity: slotWithId as Availability,
                        timestamp: new Date()
                    };
                    this.facade.addChange(change);
                    this.dialogRef.close(slotWithId);
                } else {
                    const change: Change = {
                        id: `update-${this.availability.id}-${Date.now()}`,
                        type: 'update',
                        entityId: this.availability.id,
                        entity: this.availability,
                        timestamp: new Date()
                    };
                    this.facade.addChange(change);
                    this.dialogRef.close(this.availability);
                }
            } else {
                this.facade.showError('No user found, please log in again');
            }
        });
    }

    isDateInPast(date: Date): boolean {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const checkDate = new Date(date);
        checkDate.setHours(0, 0, 0, 0);
        return checkDate < today;
    }

    onAllDaySlotsChanged(slots: AllDaySlot[]): void {
        this.allDaySlots = slots;
    }

    onBulkCreationSettingsChanged(settings: BulkCreationSettings): void {
        this.bulkCreationSettings = settings;
    }

    private createAllDaySlots(providerId: string): void {
        const slots = this.allDaySlots.map(slot => {
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
        slots.forEach(slot => {
            const change: Change = {
                id: `create-${Date.now()}-${Math.random()}`,
                type: 'create',
                entity: slot,
                timestamp: new Date()
            };
            this.facade.addChange(change);
        });
        this.dialogRef.close(slots);
    }

    private createBulkSlots(providerId: string): void {
        if (!this.bulkCreationSettings) return;

        const slots = this.availabilityGenerationService.generateBulkSlots(
            providerId,
            this.availability,
            this.bulkCreationSettings.dateRangeMode,
            this.bulkCreationSettings.quantity,
            this.bulkCreationSettings.startDate,
            this.bulkCreationSettings.endDate
        );

        slots.forEach(slot => {
            const change: Change = {
                id: `create-${Date.now()}-${Math.random()}`,
                type: 'create',
                entity: slot,
                timestamp: new Date()
            };
            this.facade.addChange(change);
        });
        this.dialogRef.close(slots);
    }
}
