import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

interface Provider {
  _id: string;
  name: string;
  email: string;
  role: string;
  businessName?: string;
  businessDescription?: string;
  specialties?: string[];
  rating?: number;
}

@Component({
  selector: 'app-provider-search',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatProgressSpinnerModule
  ],
  template: `
    <div class="provider-search-container">
      <div class="search-header">
        <h1>Find a Provider</h1>
        <p>Search for service providers by name, specialty, or business</p>
      </div>

      <div class="search-box">
        <mat-form-field appearance="outline" class="search-field">
          <mat-label>Search providers...</mat-label>
          <input 
            matInput 
            [(ngModel)]="searchQuery" 
            (keyup.enter)="search()"
            placeholder="Enter name, specialty, or business name">
          <mat-icon matSuffix>search</mat-icon>
        </mat-form-field>
        <button mat-raised-button color="primary" (click)="search()">
          Search
        </button>
      </div>

      <div *ngIf="loading" class="loading">
        <mat-spinner diameter="40"></mat-spinner>
        <p>Searching providers...</p>
      </div>

      <div *ngIf="error" class="error-message">
        <mat-icon>error</mat-icon>
        <p>{{ error }}</p>
      </div>

      <div *ngIf="!loading && providers.length === 0 && searched" class="no-results">
        <mat-icon>search_off</mat-icon>
        <p>No providers found matching your search.</p>
        <p class="hint">Try different keywords or browse all providers.</p>
      </div>

      <div class="providers-grid" *ngIf="!loading && providers.length > 0">
        <mat-card *ngFor="let provider of providers" class="provider-card">
          <mat-card-header>
            <div class="provider-avatar" mat-card-avatar>
              <mat-icon>person</mat-icon>
            </div>
            <mat-card-title>{{ provider.businessName || provider.name }}</mat-card-title>
            <mat-card-subtitle>{{ provider.email }}</mat-card-subtitle>
          </mat-card-header>
          
          <mat-card-content>
            <p *ngIf="provider.businessDescription" class="description">
              {{ provider.businessDescription }}
            </p>
            
            <div *ngIf="provider.specialties && provider.specialties.length > 0" class="specialties">
              <mat-icon>local_offer</mat-icon>
              <span *ngFor="let specialty of provider.specialties" class="specialty-tag">
                {{ specialty }}
              </span>
            </div>
            
            <div *ngIf="provider.rating" class="rating">
              <mat-icon>star</mat-icon>
              <span>{{ provider.rating }} / 5</span>
            </div>
          </mat-card-content>
          
          <mat-card-actions>
            <button mat-button color="primary" (click)="viewProvider(provider._id)">
              <mat-icon>visibility</mat-icon>
              View Profile
            </button>
            <button mat-raised-button color="accent" (click)="bookProvider(provider._id)">
              <mat-icon>event</mat-icon>
              Book Now
            </button>
          </mat-card-actions>
        </mat-card>
      </div>
    </div>
  `,
  styles: [`
    .provider-search-container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 40px 20px;
    }

    .search-header {
      text-align: center;
      margin-bottom: 40px;
    }

    .search-header h1 {
      font-size: 2.5rem;
      margin-bottom: 10px;
      color: #333;
    }

    .search-header p {
      font-size: 1.1rem;
      color: #666;
    }

    .search-box {
      display: flex;
      gap: 10px;
      max-width: 600px;
      margin: 0 auto 40px;
    }

    .search-field {
      flex: 1;
    }

    .loading {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 20px;
      padding: 60px 20px;
      color: #666;
    }

    .error-message {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 20px;
      background: #ffebee;
      border-radius: 8px;
      color: #c62828;
      margin-bottom: 20px;
    }

    .no-results {
      text-align: center;
      padding: 60px 20px;
      color: #666;
    }

    .no-results mat-icon {
      font-size: 64px;
      width: 64px;
      height: 64px;
      color: #999;
      margin-bottom: 20px;
    }

    .no-results .hint {
      font-size: 0.9rem;
      color: #999;
    }

    .providers-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
      gap: 20px;
    }

    .provider-card {
      height: 100%;
      display: flex;
      flex-direction: column;
    }

    .provider-avatar {
      background: #e3f2fd;
      border-radius: 50%;
      width: 40px;
      height: 40px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .provider-avatar mat-icon {
      color: #1976d2;
    }

    mat-card-content {
      flex: 1;
    }

    .description {
      margin: 10px 0;
      color: #666;
      line-height: 1.5;
    }

    .specialties {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-wrap: wrap;
      margin: 15px 0;
    }

    .specialties mat-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
      color: #666;
    }

    .specialty-tag {
      background: #e3f2fd;
      color: #1976d2;
      padding: 4px 12px;
      border-radius: 16px;
      font-size: 0.85rem;
    }

    .rating {
      display: flex;
      align-items: center;
      gap: 5px;
      color: #ff9800;
      margin-top: 10px;
    }

    .rating mat-icon {
      font-size: 20px;
      width: 20px;
      height: 20px;
    }

    mat-card-actions {
      display: flex;
      gap: 10px;
      padding: 16px;
    }

    mat-card-actions button {
      flex: 1;
    }

    @media (max-width: 768px) {
      .providers-grid {
        grid-template-columns: 1fr;
      }

      .search-box {
        flex-direction: column;
      }
    }
  `]
})
export class ProviderSearchComponent implements OnInit {
  searchQuery: string = '';
  providers: Provider[] = [];
  loading: boolean = false;
  error: string | null = null;
  searched: boolean = false;

  private API_URL = `${environment.apiUrl}/users`;

  constructor(
    private http: HttpClient,
    private router: Router
  ) {}

  ngOnInit() {
    // Load all providers initially
    this.loadAllProviders();
  }

  loadAllProviders() {
    this.loading = true;
    this.error = null;

    this.http.get<Provider[]>(`${this.API_URL}/providers`).subscribe({
      next: (providers) => {
        this.providers = providers;
        this.loading = false;
        console.log('✅ Loaded providers:', providers.length);
      },
      error: (err) => {
        this.error = 'Failed to load providers. Please try again.';
        this.loading = false;
        console.error('❌ Error loading providers:', err);
      }
    });
  }

  search() {
    if (!this.searchQuery.trim()) {
      this.loadAllProviders();
      return;
    }

    this.loading = true;
    this.error = null;
    this.searched = true;

    const query = this.searchQuery.trim().toLowerCase();
    
    this.http.get<Provider[]>(`${this.API_URL}/providers`).subscribe({
      next: (allProviders) => {
        // Filter providers based on search query
        this.providers = allProviders.filter(provider => 
          provider.name.toLowerCase().includes(query) ||
          provider.email.toLowerCase().includes(query) ||
          provider.businessName?.toLowerCase().includes(query) ||
          provider.businessDescription?.toLowerCase().includes(query) ||
          provider.specialties?.some(s => s.toLowerCase().includes(query))
        );
        
        this.loading = false;
        console.log('✅ Search results:', this.providers.length);
      },
      error: (err) => {
        this.error = 'Search failed. Please try again.';
        this.loading = false;
        console.error('❌ Search error:', err);
      }
    });
  }

  viewProvider(providerId: string) {
    this.router.navigate(['/provider', providerId]);
  }

  bookProvider(providerId: string) {
    this.router.navigate(['/booking', providerId, 'duration']);
  }
}
