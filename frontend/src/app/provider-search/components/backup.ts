// import { Component, OnInit } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { FormsModule } from '@angular/forms';
// import { Router } from '@angular/router';
// import { MatFormFieldModule } from '@angular/material/form-field';
// import { MatInputModule } from '@angular/material/input';
// import { MatButtonModule } from '@angular/material/button';
// import { MatCardModule } from '@angular/material/card';
// import { MatIconModule } from '@angular/material/icon';
// import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
// import { MatTooltipModule } from '@angular/material/tooltip';
// import { MatPaginatorModule } from '@angular/material/paginator';
// import { MatMenuModule } from '@angular/material/menu';
// import { HttpClient } from '@angular/common/http';
// import { environment } from '../../environments/environment';

// interface Provider {
//   _id: string;
//   id?: string;
//   name: string;
//   email: string;
//   username?: string;
//   role: string;
//   firstName?: string;
//   lastName?: string;
//   businessName?: string;
//   businessDescription?: string;
//   bio?: string;
//   location?: string;
//   contactPhone?: string;
//   services?: string[];
//   categories?: string[];
//   customCategories?: string[];
//   specialties?: string[];
//   availableDurations?: number[];
//   rating?: number;
//   reviewCount?: number;
// }

// @Component({
//   selector: 'app-provider-search',
//   standalone: true,
//   imports: [
//     CommonModule,
//     FormsModule,
//     MatFormFieldModule,
//     MatInputModule,
//     MatButtonModule,
//     MatCardModule,
//     MatIconModule,
//     MatProgressSpinnerModule,
//     MatTooltipModule,
//     MatPaginatorModule,
//     MatMenuModule
//   ],
//   templateUrl: './provider-search.component.html',
//   styleUrls: ['./provider-search.component.scss']
// })
// export class ProviderSearchComponent implements OnInit {
//   searchQuery: string = '';
//   providers: Provider[] = [];
//   allProviders: Provider[] = [];
//   loading: boolean = false;
//   error: string | null = null;
//   searched: boolean = false;
  
//   // Pagination
//   currentPage: number = 1;
//   pageSize: number = 10;
//   totalProviders: number = 0;
//   totalPages: number = 0;
  
//   // Filters
//   selectedCategory: string = '';
//   selectedRating: number = 0;
//   hoverRating: number = 0;
//   availableCategories: string[] = [];
//   maxVisibleCategories: number = 6;
  
//   // Expose Math to template
//   Math = Math;

//   private API_URL = `${environment.apiUrl}/public/providers`;

//   constructor(
//     private http: HttpClient,
//     private router: Router
//   ) {}

//   ngOnInit() {
//     this.loadAllProviders();
//   }

//   loadAllProviders(page: number = 1) {
//     this.loading = true;
//     this.error = null;
//     this.currentPage = page;

//     this.http.get<any>(`${this.API_URL}?page=${page}&limit=100`).subscribe({
//       next: (response) => {
//         const data = response.data || response;
//         this.allProviders = Array.isArray(data) ? data : (data.providers || []);
//         this.extractCategories();
//         this.applyFilters();
//         this.loading = false;
//         console.log('✅ Loaded providers:', this.allProviders.length);
//       },
//       error: (err) => {
//         this.error = 'Failed to load providers. Please try again.';
//         this.loading = false;
//         console.error('❌ Error loading providers:', err);
//       }
//     });
//   }

//   extractCategories() {
//     const categorySet = new Set<string>();
//     this.allProviders.forEach(provider => {
//       provider.categories?.forEach(cat => categorySet.add(cat));
//       provider.customCategories?.forEach(cat => categorySet.add(cat));
//     });
//     this.availableCategories = Array.from(categorySet).sort();
//   }

//   applyFilters() {
//     let filtered = [...this.allProviders];

//     // Filter by category
//     if (this.selectedCategory) {
//       filtered = filtered.filter(provider => 
//         provider.categories?.includes(this.selectedCategory) ||
//         provider.customCategories?.includes(this.selectedCategory)
//       );
//     }

//     // Filter by search query
//     if (this.searchQuery.trim()) {
//       const query = this.searchQuery.trim().toLowerCase();
//       const isUsernameSearch = query.startsWith('@');
//       const searchTerm = isUsernameSearch ? query.substring(1) : query;
      
//       filtered = filtered.filter(provider => {
//         if (isUsernameSearch && provider.username) {
//           return provider.username.toLowerCase().includes(searchTerm);
//         }
        
//         return (
//           provider.username?.toLowerCase().includes(searchTerm) ||
//           provider.firstName?.toLowerCase().includes(searchTerm) ||
//           provider.lastName?.toLowerCase().includes(searchTerm) ||
//           provider.businessName?.toLowerCase().includes(searchTerm) ||
//           provider.bio?.toLowerCase().includes(searchTerm) ||
//           provider.businessDescription?.toLowerCase().includes(searchTerm) ||
//           provider.location?.toLowerCase().includes(searchTerm) ||
//           provider.services?.some(s => s.toLowerCase().includes(searchTerm)) ||
//           provider.categories?.some(s => s.toLowerCase().includes(searchTerm))
//         );
//       });
//     }

//     // Filter by rating range
//     if (this.selectedRating > 0) {
//       const minRating = this.selectedRating;
//       const maxRating = this.selectedRating < 5 ? this.selectedRating + 0.9 : 5.0;
      
//       // Filter providers within the rating range
//       const inRange = filtered.filter(p => {
//         const rating = p.rating || 0;
//         return rating >= minRating && rating <= maxRating;
//       });
      
//       const outOfRange = filtered.filter(p => {
//         const rating = p.rating || 0;
//         return rating < minRating || rating > maxRating;
//       });
      
//       // Sort both groups by rating desc
//       inRange.sort((a, b) => (b.rating || 0) - (a.rating || 0));
//       outOfRange.sort((a, b) => (b.rating || 0) - (a.rating || 0));
      
//       // Put in-range first, then out-of-range
//       filtered = [...inRange, ...outOfRange];
      
//       console.log(`⭐ Rating filter ${minRating}-${maxRating}: ${inRange.length} in range, ${outOfRange.length} outside`);
//       console.log('Top 5 in range:', inRange.slice(0, 5).map(p => `${p.username}(${p.rating})`));
//       console.log('Top 5 outside:', outOfRange.slice(0, 5).map(p => `${p.username}(${p.rating})`));
//     } else {
//       // Default: sort by rating desc (highest first)
//       filtered.sort((a, b) => (b.rating || 0) - (a.rating || 0));
//     }

//     this.providers = [...filtered];
//     this.totalProviders = filtered.length;
//     this.totalPages = Math.ceil(this.totalProviders / this.pageSize);
//     this.currentPage = 1;
    
//     console.log(`📊 Filtered results: ${this.providers.length} providers`);
//     console.log('First 5 in display:', this.providers.slice(0, 5).map(p => `${p.username}(${p.rating})`));
//     if (this.selectedCategory) console.log(`📁 Category: ${this.selectedCategory}`);
//     if (this.selectedRating > 0) console.log(`⭐ Rating range: ${this.selectedRating}-${this.selectedRating < 5 ? this.selectedRating + 0.9 : 5.0}`);
//   }

//   search() {
//     this.searched = true;
//     this.applyFilters();
//   }

//   selectCategory(category: string) {
//     this.selectedCategory = category;
//     this.applyFilters();
//   }

//   selectRating(rating: number) {
//     // Toggle: if clicking same rating, clear it
//     if (this.selectedRating === rating) {
//       this.selectedRating = 0;
//       console.log('🌟 Rating cleared');
//     } else {
//       this.selectedRating = rating;
//       console.log('🌟 Rating selected:', rating);
//     }
//     this.applyFilters();
//   }

//   clearRating() {
//     this.selectedRating = 0;
//     this.hoverRating = 0;
//     console.log('🌟 Rating filter cleared');
//     this.applyFilters();
//   }

//   getVisibleCategories(): string[] {
//     return this.availableCategories.slice(0, this.maxVisibleCategories);
//   }

//   getHiddenCategories(): string[] {
//     return this.availableCategories.slice(this.maxVisibleCategories);
//   }

//   clearFilters() {
//     this.selectedCategory = '';
//     this.selectedRating = 0;
//     this.hoverRating = 0;
//     this.searchQuery = '';
//     this.applyFilters();
//   }

//   getFullName(provider: Provider): string {
//     if (provider.firstName && provider.lastName) {
//       return `${provider.firstName} ${provider.lastName}`;
//     }
//     return provider.name || provider.email;
//   }

//   getServices(provider: Provider): string[] {
//     return provider.services || provider.specialties || [];
//   }

//   getPaginatedProviders(): Provider[] {
//     const start = (this.currentPage - 1) * this.pageSize;
//     const end = start + this.pageSize;
//     return this.providers.slice(start, end);
//   }

//   isOutsideRatingRange(provider: Provider): boolean {
//     if (this.selectedRating === 0) return false;
    
//     const rating = provider.rating || 0;
//     const minRating = this.selectedRating;
//     const maxRating = this.selectedRating < 5 ? this.selectedRating + 0.9 : 5.0;
    
//     return rating < minRating || rating > maxRating;
//   }

//   isFirstBelowRating(index: number): boolean {
//     if (this.selectedRating === 0) return false;
    
//     const paginatedProviders = this.getPaginatedProviders();
//     const provider = paginatedProviders[index];
//     const rating = provider.rating || 0;
    
//     const minRating = this.selectedRating;
//     const maxRating = this.selectedRating < 5 ? this.selectedRating + 0.9 : 5.0;
    
//     // Check if this provider is outside the rating range
//     const isOutsideRange = rating < minRating || rating > maxRating;
//     if (!isOutsideRange) return false;
    
//     // Check if previous provider was in range (or doesn't exist)
//     if (index === 0) {
//       return true;
//     }
    
//     const previousProvider = paginatedProviders[index - 1];
//     const prevRating = previousProvider.rating || 0;
//     const prevInRange = prevRating >= minRating && prevRating <= maxRating;
    
//     return prevInRange;
//   }

//   viewProvider(providerId: string | undefined) {
//     if (!providerId) return;
//     this.router.navigate(['/provider', providerId]);
//   }

//   bookProvider(providerId: string | undefined) {
//     if (!providerId) return;
//     this.router.navigate(['/booking', providerId, 'duration']);
//   }

//   onPageChange(page: number) {
//     this.currentPage = page;
//     // Scroll to top
//     window.scrollTo({ top: 0, behavior: 'smooth' });
//   }

//   nextPage() {
//     if (this.currentPage < this.totalPages) {
//       this.onPageChange(this.currentPage + 1);
//     }
//   }

//   previousPage() {
//     if (this.currentPage > 1) {
//       this.onPageChange(this.currentPage - 1);
//     }
//   }

//   handlePageClick(page: number | string) {
//     if (typeof page === 'number') {
//       this.onPageChange(page);
//     }
//   }

//   getPageNumbers(): (number | string)[] {
//     const pages: (number | string)[] = [];
//     const maxVisible = 5;
    
//     if (this.totalPages <= maxVisible) {
//       // Show all pages if total is small
//       for (let i = 1; i <= this.totalPages; i++) {
//         pages.push(i);
//       }
//     } else {
//       // Always show first page
//       pages.push(1);
      
//       if (this.currentPage > 3) {
//         pages.push('...');
//       }
      
//       // Show pages around current page
//       const start = Math.max(2, this.currentPage - 1);
//       const end = Math.min(this.totalPages - 1, this.currentPage + 1);
      
//       for (let i = start; i <= end; i++) {
//         pages.push(i);
//       }
      
//       if (this.currentPage < this.totalPages - 2) {
//         pages.push('...');
//       }
      
//       // Always show last page
//       pages.push(this.totalPages);
//     }
    
//     return pages;
//   }
// }
