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
      <mat-form-field class="search-field" appearance="outline">
        <mat-label>Search providers, services, or locations...</mat-label>
        <input
          matInput
          [value]="searchQuery"
          (input)="onSearchInput($event)"
          (keydown)="onKeydown($event)"
          [matAutocomplete]="auto"
          placeholder="e.g., business consultant in New York"
          class="search-input">
        <mat-icon matSuffix>search</mat-icon>
        
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
      </mat-form-field>
    </div>
  `,
  styles: [`
    .search-suggestions-container {
      width: 100%;
      position: relative;
    }
    
    .search-field {
      width: 100%;
    }
    
    .search-input {
      font-size: 16px;
    }
    
    .suggestion-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      width: 100%;
    }
    
    .suggestion-text {
      font-weight: 500;
    }
    
    .suggestion-category {
      font-size: 12px;
      color: #666;
      background: #f5f5f5;
      padding: 2px 8px;
      border-radius: 12px;
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