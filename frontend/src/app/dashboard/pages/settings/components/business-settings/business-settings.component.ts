import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatChipInputEvent } from '@angular/material/chips';
import { COMMA, ENTER } from '@angular/cdk/keycodes';

@Component({
  selector: 'app-business-settings',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatChipsModule,
    MatIconModule,
    MatAutocompleteModule,
  ],
  templateUrl: './business-settings.component.html',
  styleUrl: './business-settings.component.scss',
})
export class BusinessSettingsComponent implements OnInit, OnChanges {
  @Input() businessName!: string;
  @Input() bio!: string;
  @Input() contactPhone!: string;
  @Input() services: string[] = [];
  @Input() categories: string[] = [];
  @Input() availableDurations: number[] = [];
  @Input() locationCountry!: string;
  @Input() locationCity!: string;
  @Input() locationAddress!: string;
  @Input() savingBusinessSettings!: boolean;
  @Output() businessSettingsChange = new EventEmitter<any>();
  @Output() save = new EventEmitter<void>();

  constructor(private cdr: ChangeDetectorRef) {}

  ngOnChanges(changes: SimpleChanges): void {
    console.log('[BusinessSettingsComponent] ngOnChanges called', {
      changes: Object.keys(changes),
      businessName: { current: changes['businessName']?.currentValue, previous: changes['businessName']?.previousValue },
      bio: { current: changes['bio']?.currentValue, previous: changes['bio']?.previousValue },
      contactPhone: { current: changes['contactPhone']?.currentValue, previous: changes['contactPhone']?.previousValue },
      services: { current: changes['services']?.currentValue, previous: changes['services']?.previousValue },
      categories: { current: changes['categories']?.currentValue, previous: changes['categories']?.previousValue },
      locationCountry: { current: changes['locationCountry']?.currentValue, previous: changes['locationCountry']?.previousValue },
      locationCity: { current: changes['locationCity']?.currentValue, previous: changes['locationCity']?.previousValue },
      locationAddress: { current: changes['locationAddress']?.currentValue, previous: changes['locationAddress']?.previousValue }
    });
    
    // Always trigger change detection when any input changes
    this.cdr.markForCheck();
  }

  ngOnInit(): void {
    console.log('[BusinessSettingsComponent] ngOnInit called with inputs:', {
      businessName: this.businessName,
      bio: this.bio,
      contactPhone: this.contactPhone,
      services: this.services,
      categories: this.categories,
      availableDurations: this.availableDurations,
      locationCountry: this.locationCountry,
      locationCity: this.locationCity,
      locationAddress: this.locationAddress
    });
  }

  // Bridge properties for [(ngModel)] - ngModel needs property accessors
  get businessNameModel(): string {
    return this.businessName;
  }
  set businessNameModel(v: string) {
    this.businessSettingsChange.emit({ businessName: v });
  }

  get bioModel(): string {
    return this.bio;
  }
  set bioModel(v: string) {
    this.businessSettingsChange.emit({ bio: v });
  }

  get contactPhoneModel(): string {
    return this.contactPhone;
  }
  set contactPhoneModel(v: string) {
    this.businessSettingsChange.emit({ contactPhone: v });
  }

  get locationCountryModel(): string {
    return this.locationCountry;
  }
  set locationCountryModel(v: string) {
    this.businessSettingsChange.emit({ locationDetails: { country: v } });
  }

  get locationCityModel(): string {
    return this.locationCity;
  }
  set locationCityModel(v: string) {
    this.businessSettingsChange.emit({ locationDetails: { city: v } });
  }

  get locationAddressModel(): string {
    return this.locationAddress;
  }
  set locationAddressModel(v: string) {
    this.businessSettingsChange.emit({ locationDetails: { address: v } });
  }

  // Industry categories from backend
  industryCategories = [
    // Business & Consulting
    'Business Consulting',
    'Management Consulting',
    'Strategy Consulting',
    // Technology
    'Software Development',
    'Web Development',
    'Mobile Development',
    'IT Consulting',
    'Cybersecurity',
    'Data Analytics',
    'Cloud Services',
    // Marketing & Design
    'Digital Marketing',
    'Graphic Design',
    'Branding',
    'Content Creation',
    'Social Media',
    'SEO/SEM',
    // Finance & Legal
    'Financial Services',
    'Accounting',
    'Legal Services',
    'Tax Consulting',
    // Health & Wellness
    'Health & Wellness',
    'Life Coaching',
    'Career Coaching',
    'Fitness',
    // Creative Services
    'Photography',
    'Videography',
    'Writing',
    'Translation',
    // Real Estate & Property
    'Real Estate',
    'Property Management',
    // Events & Hospitality
    'Event Planning',
    'Hospitality',
    'Catering',
    // Logistics & Operations
    'Logistics',
    'Supply Chain',
    'Transportation',
    // Human Resources
    'HR Consulting',
    'Recruitment',
    'Training & Development',
    // Sales & Business Development
    'Sales Training',
    'Business Development',
    // Other
    'Other',
  ];

  // Common services suggestions
  commonServices = [
    'Project Consultation',
    'Strategic Planning',
    'Market Research',
    'Financial Analysis',
    'Software Development',
    'Web Design',
    'Mobile App Development',
    'Content Creation',
    'Social Media Management',
    'Brand Development',
    'SEO Optimization',
    'PPC Management',
    'Legal Consultation',
    'Tax Preparation',
    'Accounting Services',
    'Coaching Session',
    'Training Workshop',
    'Personal Training',
    'Photography Session',
    'Video Production',
    'Writing & Editing',
    'Real Estate Consulting',
    'Property Management',
    'Event Planning',
    'Logistics Coordination',
    'Supply Chain Analysis',
    'HR Consulting',
    'Recruitment Services',
    'Sales Training',
    'Business Development',
  ];

  // Common durations
  commonDurations = [15, 30, 45, 60, 90, 120];

  // Chip input properties
  readonly separatorKeysCodes = [ENTER, COMMA] as const;

  // Chip input methods
  addService(event: MatChipInputEvent): void {
    const value = (event.value || '').trim();
    if (value && !this.services.includes(value)) {
      this.businessSettingsChange.emit({ services: [...this.services, value] });
    }
    event.chipInput!.clear();
  }

  removeService(service: string): void {
    this.businessSettingsChange.emit({
      services: this.services.filter((s) => s !== service)
    });
  }

  addCategory(event: MatChipInputEvent): void {
    const value = (event.value || '').trim();
    if (value && !this.categories.includes(value)) {
      this.businessSettingsChange.emit({ categories: [...this.categories, value] });
    }
    event.chipInput!.clear();
  }

  removeCategory(category: string): void {
    this.businessSettingsChange.emit({
      categories: this.categories.filter((c) => c !== category)
    });
  }

  addDuration(event: MatChipInputEvent): void {
    const value = (event.value || '').trim();
    if (value) {
      const duration = parseInt(value);
      if (!isNaN(duration) && duration > 0 && !this.availableDurations.includes(duration)) {
        this.businessSettingsChange.emit({
          availableDurations: [...this.availableDurations, duration]
        });
      }
    }
    event.chipInput!.clear();
  }

  removeDuration(duration: number): void {
    this.businessSettingsChange.emit({
      availableDurations: this.availableDurations.filter((d) => d !== duration)
    });
  }

  onSave(): void {
    this.save.emit();
  }

  // TrackBy functions for performance
  trackByService(index: number, service: string): string {
    return service;
  }

  trackByCategory(index: number, category: string): string {
    return category;
  }

  trackByDuration(index: number, duration: number): number {
    return duration;
  }

  // Handle category selection from autocomplete
  onCategorySelected(event: any): void {
    const value = event.option.value.trim();
    if (value && !this.categories.includes(value)) {
      this.businessSettingsChange.emit({ categories: [...this.categories, value] });
    }
  }

  // Handle service selection from autocomplete
  onServiceSelected(event: any): void {
    const value = event.option.value.trim();
    if (value && !this.services.includes(value)) {
      this.businessSettingsChange.emit({ services: [...this.services, value] });
    }
  }

  // Handle duration selection from autocomplete
  onDurationSelected(event: any): void {
    const duration = parseInt(event.option.value);
    if (!isNaN(duration) && duration > 0 && !this.availableDurations.includes(duration)) {
      this.businessSettingsChange.emit({
        availableDurations: [...this.availableDurations, duration]
      });
    }
  }
}