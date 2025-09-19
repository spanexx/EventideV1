import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatRadioModule } from '@angular/material/radio';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { Availability } from '../../models/availability.models';

export interface BulkCreationSettings {
    dateRangeMode: 'single' | 'range';
    quantity: number;
    startDate: Date | null;
    endDate: Date | null;
    skipConflicts: boolean;
}

@Component({
    selector: 'app-bulk-creation-configurator',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        MatExpansionModule,
        MatRadioModule,
        MatCheckboxModule,
        MatFormFieldModule,
        MatInputModule,
        MatDatepickerModule,
    ],
    templateUrl: './bulk-creation-configurator.component.html',
    styleUrls: ['./bulk-creation-configurator.component.scss']
})
export class BulkCreationConfiguratorComponent {
    @Output() settingsChanged = new EventEmitter<BulkCreationSettings>();

    dateRangeMode: 'single' | 'range' = 'single';
    quantity: number = 1;
    startDate: Date | null = null;
    endDate: Date | null = null;
    skipConflicts: boolean = false;

    constructor() { }

    onSettingsChange(): void {
        this.settingsChanged.emit({
            dateRangeMode: this.dateRangeMode,
            quantity: this.quantity,
            startDate: this.startDate,
            endDate: this.endDate,
            skipConflicts: this.skipConflicts
        });
    }
}
