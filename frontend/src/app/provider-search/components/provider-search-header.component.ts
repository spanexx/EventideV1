import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
  selector: 'app-provider-search-header',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule
  ],
  template: `
    <div class="search-nav">
      <div class="logo-container" (click)="navigateHome()">
        <img src="/logo.png" alt="Eventide" class="logo">
      </div>
      
      <div class="search-box">
        <mat-icon class="search-icon">search</mat-icon>
        <input 
          matInput 
          [(ngModel)]="searchQuery" 
          (ngModelChange)="searchQueryChange.emit($event)"
          (keyup.enter)="search.emit()"
          placeholder="Search by @username, name, location, or services..."
          class="search-input">
        <button mat-icon-button (click)="search.emit()" class="search-button" matTooltip="Search">
          <mat-icon>arrow_forward</mat-icon>
        </button>
      </div>

      <div class="rating-stars">
        <span class="rating-label">Rating:</span>
        <mat-icon 
          *ngFor="let star of [1, 2, 3, 4, 5]" 
          class="star-icon"
          [class.selected]="selectedRating >= star"
          [class.hover]="hoverRating >= star"
          (click)="ratingSelect.emit(star)"
          (mouseenter)="hoverRating = star"
          (mouseleave)="hoverRating = 0">
          {{ selectedRating >= star ? 'star' : 'star_border' }}
        </mat-icon>
        <button 
          mat-icon-button 
          *ngIf="selectedRating > 0"
          (click)="ratingClear.emit()"
          matTooltip="Clear rating filter"
          class="clear-rating-btn">
          <mat-icon>close</mat-icon>
        </button>
      </div>
    </div>
  `,
  styleUrls: ['./provider-search-header.component.scss']
})
export class ProviderSearchHeaderComponent {
  @Input() searchQuery: string = '';
  @Input() selectedRating: number = 0;
  @Output() searchQueryChange = new EventEmitter<string>();
  @Output() search = new EventEmitter<void>();
  @Output() ratingSelect = new EventEmitter<number>();
  @Output() ratingClear = new EventEmitter<void>();

  hoverRating: number = 0;

  constructor(private router: Router) {}

  navigateHome() {
    this.router.navigate(['/']);
  }
}
