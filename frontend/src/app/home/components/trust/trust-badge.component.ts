import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

export interface TrustBadgeModel {
  icon: string;
  title: string;
  description?: string;
}

@Component({
  selector: 'app-trust-badge',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  template: `
    <div class="trust-item">
      <div class="trust-icon"><mat-icon>{{ badge.icon }}</mat-icon></div>
      <h3>{{ badge.title }}</h3>
      <p *ngIf="badge.description">{{ badge.description }}</p>
    </div>
  `,
  styles: [`
    .trust-item { text-align: center; }
    .trust-item h3 { font-size: 20px; font-weight: 600; margin: 0 0 12px 0; color: #1a202c; }
    .trust-item p { font-size: 14px; line-height: 1.6; color: #718096; margin: 0; }
    .trust-icon { width: 80px; height: 80px; margin: 0 auto 24px; border-radius: 50%; background: linear-gradient(135deg, #667eea15 0%, #764ba215 100%); display: flex; align-items: center; justify-content: center; }
    .trust-icon mat-icon { font-size: 40px; width: 40px; height: 40px; color: #667eea; }
  `]
})
export class TrustBadgeComponent {
  @Input() badge!: TrustBadgeModel;
}
