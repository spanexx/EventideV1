import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
  selector: 'app-header-actions',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatTooltipModule
  ],
  templateUrl: './actions.component.html',
  styleUrls: ['./actions.component.scss']
})
export class HeaderActionsComponent {
  @Input() pendingChangesCount: number = 0;
  @Input() canUndo: boolean = false;
  @Input() canRedo: boolean = false;
  @Input() searchTerm: string = '';
  
  @Output() search = new EventEmitter<string>();
  @Output() searchClear = new EventEmitter<void>();
  @Output() filter = new EventEmitter<void>();
  @Output() analyze = new EventEmitter<void>();
  @Output() recommendations = new EventEmitter<void>();
  @Output() undo = new EventEmitter<void>();
  @Output() redo = new EventEmitter<void>();
  @Output() saveChanges = new EventEmitter<void>();
  @Output() discardChanges = new EventEmitter<void>();

  async onSearch(): Promise<void> {
    this.search.emit(this.searchTerm);
  }

  onSearchInput(): void {
    // If search term is cleared, emit clear event to restore original data
    if (!this.searchTerm || this.searchTerm.trim() === '') {
      this.searchClear.emit();
    }
  }

  clearSearch(): void {
    this.searchTerm = '';
    this.searchClear.emit();
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

  onSearchFocus(): void {
    // Method for handling search focus animations
  }

  onSearchBlur(): void {
    // Method for handling search blur animations
  }
}