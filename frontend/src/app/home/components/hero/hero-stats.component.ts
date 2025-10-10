import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-hero-stats',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="hero-stats">
      <div class="stat-item">
        <div class="stat-number">{{ stats.providers }}</div>
        <div class="stat-label">Active Providers</div>
      </div>
      <div class="stat-divider"></div>
      <div class="stat-item">
        <div class="stat-number">{{ stats.bookings }}</div>
        <div class="stat-label">Bookings Made</div>
      </div>
      <div class="stat-divider"></div>
      <div class="stat-item">
        <div class="stat-number">{{ stats.satisfaction }}%</div>
        <div class="stat-label">Satisfaction Rate</div>
      </div>
    </div>
  `,
  styles: [`
    .hero-stats { display: flex; justify-content: center; align-items: center; gap: 48px; flex-wrap: wrap; }
    .stat-item { text-align: center; }
    .stat-number { font-size: 48px; font-weight: 700; line-height: 1; margin-bottom: 8px; }
    .stat-label { font-size: 14px; opacity: 0.9; text-transform: uppercase; letter-spacing: 1px; }
    .stat-divider { width: 1px; height: 60px; background: rgba(255,255,255,0.3); }
    @media (max-width: 768px) { .stat-divider { display: none; } .hero-stats { gap: 24px; } }
  `]
})
export class HeroStatsComponent {
  @Input() stats: { providers: number; bookings: number; satisfaction: number } = { providers: 0, bookings: 0, satisfaction: 0 };
}
