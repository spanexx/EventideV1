import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { TrustBadgeComponent } from './trust-badge.component';

@Component({
  selector: 'app-trust-section',
  standalone: true,
  imports: [CommonModule, MatIconModule, TrustBadgeComponent],
  template: `
    <section class="trust-section">
      <div class="trust-grid">
        <app-trust-badge *ngFor="let item of items" [badge]="item"></app-trust-badge>
      </div>
    </section>
  `,
  styles: [`
    .trust-section { padding: 80px 20px; background: white; }
    .trust-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 48px; max-width: 1200px; margin: 0 auto; }
  `]
})
export class TrustSectionComponent { @Input() items: any[] = []; }
