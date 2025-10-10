import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-animated-background',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="hero-background">
      <div class="animated-circles">
        <div class="circle circle-1" [style.animationDuration]="speed"></div>
        <div class="circle circle-2" [style.animationDuration]="speed"></div>
        <div class="circle circle-3" [style.animationDuration]="speed"></div>
      </div>
    </div>
  `,
  styles: [`
    .hero-background { position: absolute; top: 0; left: 0; width: 100%; height: 100%; opacity: 0.3; }
    .animated-circles { position: relative; width: 100%; height: 100%; }
    .circle { position: absolute; border-radius: 50%; background: radial-gradient(circle, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0.05) 70%, transparent 100%); animation: float 20s infinite ease-in-out; filter: blur(40px); }
    .circle-1 { width: 400px; height: 400px; top: 5%; left: 5%; animation-delay: 0s; background: radial-gradient(circle, rgba(99,102,241,0.2) 0%, rgba(139,92,246,0.1) 50%, transparent 100%); }
    .circle-2 { width: 300px; height: 300px; top: 40%; right: 10%; animation-delay: 7s; background: radial-gradient(circle, rgba(168,85,247,0.2) 0%, rgba(217,70,239,0.1) 50%, transparent 100%); }
    .circle-3 { width: 350px; height: 350px; bottom: 5%; left: 45%; animation-delay: 14s; background: radial-gradient(circle, rgba(59,130,246,0.2) 0%, rgba(99,102,241,0.1) 50%, transparent 100%); }
    @keyframes float { 0%, 100% { transform: translate(0,0) scale(1); opacity: 0.6; } 33% { transform: translate(30px,-40px) scale(1.1); opacity: 0.8; } 66% { transform: translate(-20px,30px) scale(0.9); opacity: 0.7; } }
  `]
})
export class AnimatedBackgroundComponent {
  /** CSS time value like '10s' or '15s' */
  @Input() speed: string = '12s';
}
