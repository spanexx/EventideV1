import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';
import { AdvancedSearchService } from '../../services/advanced-search.service';
import { debounceTime, distinctUntilChanged, Subject } from 'rxjs';

@Component({
  selector: 'app-search-suggestions',
  standalone: true,
  imports: [
    CommonModule,
    MatAutocompleteModule,
    MatInputModule,
    MatIconModule,
    FormsModule
  ],
  template: `
    <div class="search-suggestions-container">
      <input
        [value]="searchQuery"
        (input)="onSearchInput($event)"
        (keydown)="onKeydown($event)"
        [matAutocomplete]="auto"
        placeholder="e.g., business consultant in New York"
        class="search-input">
        
      <mat-autocomplete 
        #auto="matAutocomplete" 
        (optionSelected)="onOptionSelected($event)"
        [displayWith]="displayWith">
        <mat-option 
          *ngFor="let suggestion of suggestions" 
          [value]="suggestion">
          <div class="suggestion-item">
            <span class="suggestion-text">{{ suggestion.keyword }}</span>
            <span class="suggestion-category">{{ suggestion.category }}</span>
          </div>
        </mat-option>
      </mat-autocomplete>
    </div>
  `,
  styles: [`
    .search-suggestions-container {
      width: 100%;
      position: relative;
      display: flex;
      align-items: center;
    }
    
    .search-input {
      width: 100%;
      border: none;
      outline: none;
      background: transparent;
      font-size: 18px;
      font-weight: 400;
      color: #374151;
      line-height: 1.5;
      padding: 0;
      margin: 0;
    }
    
    .search-input::placeholder {
      color: #9ca3af;
      font-weight: 400;
      opacity: 1;
      font-size: 16px;
    }
    
    .search-input:focus::placeholder {
      color: #d1d5db;
      transition: color 0.2s ease;
    }
    
    .suggestion-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      width: 100%;
      padding: 12px 16px;
    }
    
    .suggestion-text {
      font-weight: 500;
      color: #374151;
      font-size: 15px;
    }
    
    .suggestion-category {
      font-size: 12px;
      color: #6b7280;
      background: #f3f4f6;
      padding: 4px 10px;
      border-radius: 12px;
      font-weight: 500;
      text-transform: capitalize;
    }
    
    /* Override Material autocomplete panel styles */
    ::ng-deep .mat-mdc-autocomplete-panel {
      border-radius: 16px !important;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1), 0 4px 12px rgba(0, 0, 0, 0.05) !important;
      border: 1px solid rgba(0, 0, 0, 0.05) !important;
      margin-top: 8px !important;
    }
    
    ::ng-deep .mat-mdc-option {
      border-radius: 8px !important;
      margin: 4px 8px !important;
      transition: all 0.2s ease !important;
    }
    
    ::ng-deep .mat-mdc-option:hover {
      background-color: #f8fafc !important;
      transform: translateX(2px) !important;
    }
    
    ::ng-deep .mat-mdc-option.mdc-list-item--selected {
      background-color: #ede9fe !important;
    }
  `]
})
export class SearchSuggestionsComponent implements OnInit {
  @Input() searchQuery: string = '';
  @Output() searchQueryChange = new EventEmitter<string>();
  @Output() search = new EventEmitter<string>();
  
  suggestions: { keyword: string; category: string }[] = [];
  private searchSubject = new Subject<string>();
  
  constructor(private advancedSearch: AdvancedSearchService) {}
  
  ngOnInit() {
    this.searchSubject
      .pipe(
        debounceTime(300),
        distinctUntilChanged()
      )
      .subscribe(query => {
        this.loadSuggestions(query);
      });
  }
  
  onSearchInput(event: any) {
    const value = event.target.value;
    this.searchQuery = value;
    this.searchQueryChange.emit(value);
    
    if (value.length >= 2) {
      this.searchSubject.next(value);
    } else {
      this.suggestions = [];
    }
  }
  
  async loadSuggestions(query: string) {
    if (!query || query.length < 2) {
      this.suggestions = [];
      return;
    }
    
    try {
      this.suggestions = await this.advancedSearch.getEnhancedSuggestions(query);
    } catch (error) {
      console.warn('Failed to load suggestions:', error);
      this.suggestions = [];
    }
  }
  
  onOptionSelected(event: any) {
    this.searchQuery = event.option.value.keyword;
    this.searchQueryChange.emit(this.searchQuery);
    this.search.emit(this.searchQuery);
  }
  
  onKeydown(event: KeyboardEvent) {
    if (event.key === 'Enter') {
      this.search.emit(this.searchQuery);
    }
  }
  
  displayWith(suggestion: { keyword: string; category: string } | string): string {
    if (typeof suggestion === 'string') {
      return suggestion;
    }
    return suggestion?.keyword || '';
  }
}