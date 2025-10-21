import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-summary-card',
  templateUrl: './summary-card.component.html',
  styleUrls: ['./summary-card.component.scss'],
  standalone: true,
  imports: [CommonModule, MatCardModule, MatIconModule, MatProgressSpinnerModule]
})
export class SummaryCardComponent {
  @Input() title: string = '';
  @Input() value: string | number = '';
  @Input() change: number | null = null;
  @Input() icon: string = '';
  @Input() loading: boolean = false;
  @Input() hasError: boolean = false;
}