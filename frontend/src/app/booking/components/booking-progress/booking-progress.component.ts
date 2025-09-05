import { Component, OnInit } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-booking-progress',
  template: `
    <div class="progress-container">
      <div class="progress-step" [class.active]="currentStep >= 1" [class.completed]="currentStep > 1">
        <div class="step-icon">1</div>
        <div class="step-label">Duration</div>
      </div>
      
      <div class="progress-line" [class.completed]="currentStep > 1"></div>
      
      <div class="progress-step" [class.active]="currentStep >= 2" [class.completed]="currentStep > 2">
        <div class="step-icon">2</div>
        <div class="step-label">Availability</div>
      </div>
      
      <div class="progress-line" [class.completed]="currentStep > 2"></div>
      
      <div class="progress-step" [class.active]="currentStep >= 3" [class.completed]="currentStep > 3">
        <div class="step-icon">3</div>
        <div class="step-label">Information</div>
      </div>
      
      <div class="progress-line" [class.completed]="currentStep > 3"></div>
      
      <div class="progress-step" [class.active]="currentStep >= 4" [class.completed]="currentStep > 4">
        <div class="step-icon">4</div>
        <div class="step-label">Confirmation</div>
      </div>
    </div>
  `,
  styles: [`
    .progress-container {
      display: flex;
      justify-content: space-between;
      align-items: center;
      width: 100%;
      max-width: 600px;
      margin: 20px auto;
    }
    
    .progress-step {
      display: flex;
      flex-direction: column;
      align-items: center;
      z-index: 1;
    }
    
    .step-icon {
      width: 30px;
      height: 30px;
      border-radius: 50%;
      background-color: #e0e0e0;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: bold;
      color: #9e9e9e;
      margin-bottom: 5px;
    }
    
    .step-label {
      font-size: 12px;
      color: #9e9e9e;
    }
    
    .progress-step.active .step-icon {
      background-color: #2196f3;
      color: white;
    }
    
    .progress-step.active .step-label {
      color: #2196f3;
      font-weight: bold;
    }
    
    .progress-step.completed .step-icon {
      background-color: #4caf50;
      color: white;
    }
    
    .progress-step.completed .step-label {
      color: #4caf50;
    }
    
    .progress-line {
      flex: 1;
      height: 2px;
      background-color: #e0e0e0;
      margin: 0 -15px;
    }
    
    .progress-line.completed {
      background-color: #4caf50;
    }
  `]
})
export class BookingProgressComponent implements OnInit {
  currentStep = 1;
  
  constructor(private router: Router) {}
  
  ngOnInit(): void {
    // Set initial step based on current route
    this.updateStepFromRoute(this.router.url);
    
    // Listen for route changes
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: any) => {
      this.updateStepFromRoute(event.url);
    });
  }
  
  private updateStepFromRoute(url: string): void {
    if (url.includes('/booking/duration')) {
      this.currentStep = 1;
    } else if (url.includes('/booking/availability')) {
      this.currentStep = 2;
    } else if (url.includes('/booking/information')) {
      this.currentStep = 3;
    } else if (url.includes('/booking/confirmation')) {
      this.currentStep = 4;
    }
  }
}