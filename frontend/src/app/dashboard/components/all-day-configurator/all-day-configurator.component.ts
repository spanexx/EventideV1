import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatRadioModule } from '@angular/material/radio';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { AvailabilityGenerationService } from '../../services/availability-generation.service';

interface AllDaySlot {
    startTime: Date;
    endTime: Date;
    duration: number;
}

@Component({
    selector: 'app-all-day-configurator',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        MatExpansionModule,
        MatRadioModule,
        MatCheckboxModule,
        MatFormFieldModule,
        MatInputModule,
    ],
    templateUrl: './all-day-configurator.component.html',
    styleUrls: ['./all-day-configurator.component.scss']
})
export class AllDayConfiguratorComponent implements OnInit {
    @Input() date!: Date;
    @Output() slotsChanged = new EventEmitter<AllDaySlot[]>();

    numberOfSlots: number = 1;
    minutesPerSlot: number = 60;
    breakTime: number = 15;
    slotConfigurationMode: 'slots' | 'minutes' = 'slots';
    autoDistribute: boolean = true;
    slotPreview: AllDaySlot[] = [];
    dayStartTime: string = '08:00';
    dayEndTime: string = '20:00';

    constructor(private availabilityGenerationService: AvailabilityGenerationService) { }

    ngOnInit(): void {
        this.updateSlotPreview();
    }

    onDayTimeChange(event: any): void {
        this.updateSlotPreview();
    }

    onNumberOfSlotsChange(event: any): void {
        const value = event.target ? event.target.value : event;
        this.numberOfSlots = parseInt(value, 10) || 1;
        if (this.numberOfSlots < 1) this.numberOfSlots = 1;
        if (this.numberOfSlots > 24) this.numberOfSlots = 24;
        this.updateSlotPreview();
    }

    onAutoDistributeChange(event: any): void {
        this.autoDistribute = event.checked !== undefined ? event.checked : event;
        this.updateSlotPreview();
    }

    onSlotConfigurationModeChange(event: any): void {
        const value = event.value || event;
        this.slotConfigurationMode = value;
        this.updateSlotPreview();
    }

    onMinutesPerSlotChange(event: any): void {
        const value = event.target ? event.target.value : event;
        this.minutesPerSlot = parseInt(value, 10) || 60;
        if (this.minutesPerSlot < 15) this.minutesPerSlot = 15;
        if (this.minutesPerSlot > 240) this.minutesPerSlot = 240;
        this.updateSlotPreview();
    }

    updateSlotPreview(): void {
        if (this.autoDistribute) {
            this.slotPreview = this.availabilityGenerationService.calculateEvenDistribution(
                this.date,
                this.dayStartTime,
                this.dayEndTime,
                this.slotConfigurationMode,
                this.numberOfSlots,
                this.minutesPerSlot,
                this.breakTime
            );
        } else {
            this.slotPreview = [];
        }
        this.slotsChanged.emit(this.slotPreview);
    }
}
