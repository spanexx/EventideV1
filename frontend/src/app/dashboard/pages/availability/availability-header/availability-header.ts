import { Component, Input, Output, EventEmitter, computed } from '@angular/core';
import { Observable } from 'rxjs';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Availability } from '../../../models/availability.models';
import { ContentMetrics, CalendarView } from '../../../services/smart-calendar-manager.service';
import { PendingChangesSignalService } from '../../../services/pending-changes/pending-changes-signal.service';
import { UndoRedoSignalService } from '../../../services/undo-redo/undo-redo-signal.service';
import { ViewButtonsComponent } from './components/view-buttons/view-buttons.component';
import { HeaderMetricsComponent } from './components/metrics/metrics.component';
import { HeaderActionsComponent } from './components/actions/actions.component';
import { PendingChangesIndicatorComponent } from './components/pending-changes/pending-changes.component';

@Component({
  selector: 'app-availability-header',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatTooltipModule,
    ViewButtonsComponent,
    HeaderMetricsComponent,
    HeaderActionsComponent,
    PendingChangesIndicatorComponent
  ],
  templateUrl: './availability-header.html',
  styleUrl: './availability-header.scss'
})
export class AvailabilityHeaderComponent {
  @Input() availability$!: Observable<Availability[]>;
  @Input() smartMetrics$!: Observable<ContentMetrics>;
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
  isMobileMenuOpen: boolean = false;

  // MIGRATION: Computed signals for reactive state (no more manual input binding needed)
  readonly pendingChangesCount = computed(() => this.pendingChangesService.pendingChangesCount());
  readonly canUndo = computed(() => this.undoRedoService.canUndo());
  readonly canRedo = computed(() => this.undoRedoService.canRedo());

  constructor(
    private pendingChangesService: PendingChangesSignalService,
    private undoRedoService: UndoRedoSignalService
  ) {}

  onSearch(term: string): void {
    this.search.emit(term);
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

  toggleMobileMenu(): void {
    this.isMobileMenuOpen = !this.isMobileMenuOpen;
  }

  closeMobileMenu(): void {
    this.isMobileMenuOpen = false;
  }
}
