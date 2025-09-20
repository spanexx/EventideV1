import { Component, Input, Output, EventEmitter } from '@angular/core';
import { Observable } from 'rxjs';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Availability } from '../../../models/availability.models';
import { ContentMetrics, CalendarView } from '../../../services/smart-calendar-manager.service';

@Component({
  selector: 'app-availability-header',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatTooltipModule
  ],
  templateUrl: './availability-header.html',
  styleUrl: './availability-header.scss'
})
export class AvailabilityHeaderComponent {
  @Input() availability$!: Observable<Availability[]>;
  @Input() smartMetrics$!: Observable<ContentMetrics>;
  @Input() pendingChangesCount: number = 0;
  @Input() canUndo: boolean = false;
  @Input() canRedo: boolean = false;
  @Input() activeView: CalendarView = 'timeGridWeek';
  @Output() search = new EventEmitter<string>();
  @Output() filter = new EventEmitter<void>();
  @Output() analyze = new EventEmitter<void>();
  @Output() recommendations = new EventEmitter<void>();
  @Output() refresh = new EventEmitter<void>();
  @Output() undo = new EventEmitter<void>();
  @Output() redo = new EventEmitter<void>();
  @Output() saveChanges = new EventEmitter<void>();
  @Output() discardChanges = new EventEmitter<void>();
  @Output() changeView = new EventEmitter<CalendarView>();
  @Output() openDatePicker = new EventEmitter<void>();
  @Output() copyWeek = new EventEmitter<void>();

  searchTerm: string = '';

  onSearch(): void {
    this.search.emit(this.searchTerm);
  }

  onFilter(): void {
    this.filter.emit();
  }

  onAnalyze(): void {
    this.analyze.emit();
  }

  onRecommendations(): void {
    this.recommendations.emit();
  }

  onRefresh(): void {
    this.refresh.emit();
  }

  onUndo(): void {
    this.undo.emit();
  }

  onRedo(): void {
    this.redo.emit();
  }

  onSaveChanges(): void {
    this.saveChanges.emit();
  }

  onDiscardChanges(): void {
    this.discardChanges.emit();
  }

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
