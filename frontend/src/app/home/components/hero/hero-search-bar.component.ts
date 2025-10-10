import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { FormsModule } from '@angular/forms';
import { SearchSuggestionsComponent } from '../../../components/search-suggestions/search-suggestions.component';

@Component({
  selector: 'app-hero-search-bar',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatButtonModule, FormsModule, SearchSuggestionsComponent],
  template: `
    <div class="search-container">
      <div class="search-wrapper">
        <div class="search-input-wrapper">
          <mat-icon class="search-icon">search</mat-icon>
          <div class="search-input-container">
            <app-search-suggestions [(searchQuery)]="query" (search)="onSearch()"></app-search-suggestions>
          </div>
        </div>
        <button class="search-button" (click)="onSearch()">
          <span class="search-text">Search</span>
          <mat-icon>arrow_forward</mat-icon>
        </button>
      </div>
    </div>
  `,
  styles: [`
    .search-container { 
      width: 100%; 
      max-width: 800px; 
      margin: 32px auto 48px; 
      padding: 0 20px; 
    }
    .search-wrapper { 
      display: flex; 
      align-items: stretch;
      background: rgba(255, 255, 255, 0.98); 
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      border-radius: 60px; 
      padding: 6px; 
      box-shadow: 
        0 20px 60px rgba(0, 0, 0, 0.08),
        0 8px 25px rgba(0, 0, 0, 0.06),
        0 3px 10px rgba(0, 0, 0, 0.04),
        inset 0 1px 0 rgba(255, 255, 255, 0.8); 
      max-width: 720px; 
      margin: 0 auto; 
      animation: fadeInUp 1s ease-out 0.8s both; 
      transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
      border: 1px solid rgba(255, 255, 255, 0.4);
      position: relative;
    }
    .search-wrapper::before {
      content: '';
      position: absolute;
      inset: 0;
      border-radius: 60px;
      padding: 1px;
      background: linear-gradient(135deg, rgba(255,255,255,0.6), rgba(255,255,255,0.1));
      -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
      -webkit-mask-composite: exclude;
      mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
      mask-composite: exclude;
    }
    .search-wrapper:hover { 
      box-shadow: 
        0 25px 80px rgba(0, 0, 0, 0.12),
        0 12px 35px rgba(0, 0, 0, 0.08),
        0 5px 15px rgba(0, 0, 0, 0.06),
        inset 0 1px 0 rgba(255, 255, 255, 0.9);
      transform: translateY(-3px);
      border-color: rgba(255, 255, 255, 0.6);
    }
    .search-wrapper:focus-within { 
      box-shadow: 
        0 25px 80px rgba(99, 102, 241, 0.15),
        0 12px 35px rgba(99, 102, 241, 0.1),
        0 5px 15px rgba(99, 102, 241, 0.08),
        inset 0 1px 0 rgba(255, 255, 255, 0.9);
      transform: translateY(-3px);
      border-color: rgba(99, 102, 241, 0.2);
    }
    .search-input-wrapper {
      display: flex;
      align-items: center;
      flex: 1;
      padding: 0 24px;
      min-height: 56px;
    }
    .search-icon {
      color: #9ca3af;
      margin-right: 16px;
      font-size: 24px;
      width: 24px;
      height: 24px;
      flex-shrink: 0;
    }
    .search-input-container { 
      flex: 1;
      display: flex;
      align-items: center;
    }
    .search-button { 
      display: flex; 
      align-items: center; 
      justify-content: center;
      gap: 8px; 
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white; 
      border: none; 
      border-radius: 50px; 
      padding: 0 28px;
      min-height: 56px;
      font-size: 16px; 
      font-weight: 600; 
      cursor: pointer; 
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      box-shadow: 
        0 8px 20px rgba(102, 126, 234, 0.25),
        0 3px 8px rgba(102, 126, 234, 0.15);
      position: relative;
      overflow: hidden;
      white-space: nowrap;
    }
    .search-button::before {
      content: '';
      position: absolute;
      top: 0;
      left: -100%;
      width: 100%;
      height: 100%;
      background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
      transition: left 0.6s ease;
    }
    .search-button:hover::before {
      left: 100%;
    }
    .search-button:hover { 
      background: linear-gradient(135deg, #5a67d8 0%, #6b46c1 100%);
      box-shadow: 
        0 12px 30px rgba(102, 126, 234, 0.35),
        0 5px 15px rgba(102, 126, 234, 0.25);
      transform: translateY(-1px) scale(1.02);
    }
    .search-button:active { 
      transform: translateY(0) scale(0.98); 
      box-shadow: 
        0 4px 12px rgba(102, 126, 234, 0.3),
        0 2px 6px rgba(102, 126, 234, 0.2);
    }
    .search-text {
      font-weight: 600;
      letter-spacing: 0.5px;
    }
    .search-button mat-icon { 
      font-size: 20px; 
      width: 20px; 
      height: 20px; 
      transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }
    .search-button:hover mat-icon {
      transform: translateX(3px);
    }
    @keyframes fadeInUp { 
      from { 
        opacity: 0; 
        transform: translateY(40px) scale(0.95); 
      } 
      to { 
        opacity: 1; 
        transform: translateY(0) scale(1); 
      } 
    }
    @media (max-width: 768px) {
      .search-container {
        padding: 0 20px;
        display: flex;
        justify-content: center;
        align-items: center;
      }
      .search-wrapper {
        flex-direction: column;
        border-radius: 24px;
        padding: 12px;
        width: 100%;
        max-width: 100%;
        margin: 0;
      }
      .search-input-wrapper {
        padding: 12px 20px;
        min-height: 48px;
        width: 100%;
      }
      .search-button {
        width: 100%;
        min-height: 48px;
        margin-top: 8px;
        justify-content: center;
      }
      .search-text {
        display: block;
      }
    }
    
    @media (max-width: 480px) {
      .search-container {
        padding: 0 16px;
      }
      .search-wrapper {
        padding: 10px;
        border-radius: 20px;
      }
      .search-input-wrapper {
        padding: 10px 16px;
        min-height: 44px;
      }
      .search-button {
        min-height: 44px;
        font-size: 15px;
      }
    }
  `]
})
export class HeroSearchBarComponent {
  @Input() query: string = '';
  @Output() queryChange = new EventEmitter<string>();
  @Output() search = new EventEmitter<string>();

  onSearch() {
    this.queryChange.emit(this.query);
    this.search.emit(this.query);
  }
}
