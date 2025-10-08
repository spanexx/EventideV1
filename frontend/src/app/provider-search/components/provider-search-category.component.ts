import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';

@Component({
  selector: 'app-provider-search-category',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule
  ],
  template: `
    <div class="category-tabs" *ngIf="!loading && availableCategories.length > 0">
      <button 
        mat-button 
        class="category-tab"
        [class.active]="selectedCategory === ''"
        (click)="categorySelect.emit('')">
        All
      </button>
      <button 
        mat-button 
        class="category-tab"
        *ngFor="let category of visibleCategories"
        [class.active]="selectedCategory === category"
        (click)="categorySelect.emit(category)">
        {{ category }}
      </button>
      <button 
        mat-button 
        class="category-tab more-btn"
        *ngIf="hiddenCategories.length > 0"
        [matMenuTriggerFor]="moreMenu">
        More
        <mat-icon>arrow_drop_down</mat-icon>
      </button>
      <mat-menu #moreMenu="matMenu" class="category-menu">
        <button 
          mat-menu-item 
          *ngFor="let category of hiddenCategories"
          (click)="categorySelect.emit(category)">
          {{ category }}
        </button>
      </mat-menu>
    </div>
  `,
  styleUrls: ['./provider-search-category.component.scss']
})
export class ProviderSearchCategoryComponent {
  @Input() loading: boolean = false;
  @Input() availableCategories: string[] = [];
  @Input() selectedCategory: string = '';
  @Input() visibleCategories: string[] = [];
  @Input() hiddenCategories: string[] = [];
  @Output() categorySelect = new EventEmitter<string>();
}
