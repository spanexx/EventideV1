import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { CalendarView } from '../../../../../../../app/dashboard/services/smart-calendar-manager.service';

@Component({
  selector: 'app-view-buttons',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule
  ],
  templateUrl: './view-buttons.component.html',
  styleUrls: ['./view-buttons.component.scss']
})
export class ViewButtonsComponent {
  @Input() activeView: CalendarView = 'timeGridWeek';
  @Output() changeView = new EventEmitter<CalendarView>();
  @Output() openDatePicker = new EventEmitter<void>();
  @Output() copyWeek = new EventEmitter<void>();

  onChangeView(view: CalendarView): void {
    this.changeView.emit(view);
  }

  onOpenDatePicker(): void {
    this.openDatePicker.emit();
  }

  onCopyWeek(): void {
    this.copyWeek.emit();
  }
}