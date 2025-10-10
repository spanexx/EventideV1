import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router';

@Component({
  selector: 'app-final-cta',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule],
  template: `
    <section class="final-cta">
      <div class="cta-content">
        <h2 class="cta-title">Ready to Experience Excellence?</h2>
        <p class="cta-subtitle">Join thousands of satisfied users who trust us with their appointments</p>
        <div class="cta-buttons">
          <button mat-raised-button color="primary" class="cta-primary" (click)="getStarted()">Get Started Now<mat-icon>arrow_forward</mat-icon></button>
          <button mat-stroked-button class="cta-secondary" (click)="learnMore()">Learn More</button>
        </div>
        <div class="cta-trust-badges">
          <div class="trust-badge"><mat-icon>verified</mat-icon><span>Verified Secure</span></div>
          <div class="trust-badge"><mat-icon>lock</mat-icon><span>SSL Encrypted</span></div>
          <div class="trust-badge"><mat-icon>star</mat-icon><span>4.9/5 Rating</span></div>
        </div>
      </div>
    </section>
  `,
  styles: [`
    .final-cta { padding: 100px 20px; background: linear-gradient(135deg, #1e3c72 0%, #2a5298 50%, #7e22ce 100%); color: white; text-align: center; }
    .cta-content { max-width: 800px; margin: 0 auto; }
    .cta-title { font-size: 48px; font-weight: 700; margin: 0 0 20px 0; }
    .cta-subtitle { font-size: 20px; margin: 0 0 40px 0; opacity: 0.95; }
    .cta-buttons { display: flex; gap: 16px; justify-content: center; flex-wrap: wrap; margin-bottom: 40px; }
    .cta-primary, .cta-secondary { height: 56px; padding: 0 40px; font-size: 16px; font-weight: 600; }
    .cta-trust-badges { display: flex; justify-content: center; gap: 32px; flex-wrap: wrap; }
    .trust-badge { display: flex; align-items: center; gap: 8px; font-size: 14px; opacity: 0.9; }
    .trust-badge mat-icon { font-size: 20px; width: 20px; height: 20px; }
    @media (max-width: 768px) { .cta-title { font-size: 32px; } }
  `]
})
export class FinalCtaComponent {
  constructor(private router: Router) {}
  getStarted() { this.router.navigate(['/providers']); }
  learnMore() { const el = document.querySelector('.how-it-works-section'); if (el) (el as HTMLElement).scrollIntoView({ behavior: 'smooth' }); }
}
