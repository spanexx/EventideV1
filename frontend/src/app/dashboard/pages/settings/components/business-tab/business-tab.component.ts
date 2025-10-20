import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatChipInputEvent } from '@angular/material/chips';
import { COMMA, ENTER } from '@angular/cdk/keycodes';
import { SettingsBusinessService } from '../../services/settings-business.service';
import { SettingsChipsService } from '../../services/settings-chips.service';

@Component({
  selector: 'app-business-tab',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatChipsModule,
    MatIconModule,
    MatAutocompleteModule,
  ],
  templateUrl: './business-tab.component.html',
  styleUrl: './business-tab.component.scss',
})
export class BusinessTabComponent {
  readonly separatorKeysCodes = [ENTER, COMMA] as const;

  industryCategories = [
    'Business Consulting', 'Management Consulting', 'Strategy Consulting',
    'Software Development', 'Web Development', 'Mobile Development', 'IT Consulting',
    'Cybersecurity', 'Data Analytics', 'Cloud Services', 'Digital Marketing',
    'Graphic Design', 'Branding', 'Content Creation', 'Social Media', 'SEO/SEM',
    'Financial Services', 'Accounting', 'Legal Services', 'Tax Consulting',
    'Health & Wellness', 'Life Coaching', 'Career Coaching', 'Fitness',
    'Photography', 'Videography', 'Writing', 'Translation', 'Real Estate',
    'Property Management', 'Event Planning', 'Hospitality', 'Catering',
    'Logistics', 'Supply Chain', 'Transportation', 'HR Consulting',
    'Recruitment', 'Training & Development', 'Sales Training',
    'Business Development', 'Other',
  ];

  commonServices = [
    'Project Consultation', 'Strategic Planning', 'Market Research',
    'Financial Analysis', 'Software Development', 'Web Design',
    'Mobile App Development', 'Content Creation', 'Social Media Management',
    'Brand Development', 'SEO Optimization', 'PPC Management',
    'Legal Consultation', 'Tax Preparation', 'Accounting Services',
    'Coaching Session', 'Training Workshop', 'Personal Training',
    'Photography Session', 'Video Production', 'Writing & Editing',
    'Real Estate Consulting', 'Property Management', 'Event Planning',
    'Logistics Coordination', 'Supply Chain Analysis', 'HR Consulting',
    'Recruitment Services', 'Sales Training', 'Business Development',
  ];

  commonDurations = [15, 30, 45, 60, 90, 120];

  constructor(
    public businessService: SettingsBusinessService,
    public chipsService: SettingsChipsService,
  ) {}

  addService(event: MatChipInputEvent): void {
    this.chipsService.addService(event);
  }

  removeService(service: string): void {
    this.chipsService.removeService(service);
  }

  onServiceSelected(event: any): void {
    this.chipsService.onServiceSelected(event);
  }

  addCategory(event: MatChipInputEvent): void {
    this.chipsService.addCategory(event);
  }

  removeCategory(category: string): void {
    this.chipsService.removeCategory(category);
  }

  onCategorySelected(event: any): void {
    this.chipsService.onCategorySelected(event);
  }

  addDuration(event: MatChipInputEvent): void {
    this.chipsService.addDuration(event);
  }

  removeDuration(duration: string): void {
    this.chipsService.removeDuration(duration);
  }

  onDurationSelected(event: any): void {
    this.chipsService.onDurationSelected(event);
  }
}
