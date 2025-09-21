import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ContentMetrics } from '../../../../../../../app/dashboard/services/smart-calendar-manager.service';

@Component({
  selector: 'app-header-metrics',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatTooltipModule
  ],
  templateUrl: './metrics.component.html',
  styleUrls: ['./metrics.component.scss']
})
export class HeaderMetricsComponent {
  @Input() metrics: ContentMetrics | null = null;
}