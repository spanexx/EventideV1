import { Component, OnInit, OnDestroy, Input, ViewChild, AfterViewInit } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { SmartCalendarManagerService, SmartCalendarConfig, ContentMetrics } from '../../services/smart-calendar-manager.service';
import { SmartContentAnalyzerService, ContentAnalysisResult } from '../../services/smart-content-analyzer.service';
import { CommonModule } from '@angular/common';
import { Availability } from '../../models/availability.models';
import { FullCalendarComponent } from '@fullcalendar/angular';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { SmartCalendarLoggerService } from '../../services/smart-calendar-logger.service';

@Component({
  selector: 'app-smart-calendar',
  templateUrl: './smart-calendar.component.html',
  styleUrls: ['./smart-calendar.component.scss'],
  standalone: true,
  imports: [CommonModule, MatIconModule, MatButtonModule, MatTooltipModule]
})
export class SmartCalendarComponent implements OnInit, OnDestroy, AfterViewInit {
  @Input() availability: Availability[] | null = [];
  @Input() calendarComponent: FullCalendarComponent | null = null;
  
  @ViewChild('smartCalendarContainer') smartCalendarContainer: any;
  
  private destroy$ = new Subject<void>();
  
  config: SmartCalendarConfig | undefined;
  metrics: ContentMetrics | undefined;
  
  // Smart features data
  viewRecommendation: string = '';
  occupancyRate: number = 0;
  totalSlots: number = 0;
  bookedSlots: number = 0;
  conflictingSlots: number = 0;
  optimalBookingWindows: any[] = [];
  currentMonth: string = '';
  currentDateRange: string = '';
  
  constructor(
    private smartCalendarManager: SmartCalendarManagerService,
    private contentAnalyzer: SmartContentAnalyzerService,
    private logger: SmartCalendarLoggerService
  ) { }

  ngOnInit(): void {
    this.logger.info('SmartCalendarComponent', 'Initializing smart calendar component');
    
    // Subscribe to configuration changes
    this.smartCalendarManager.config$
      .pipe(takeUntil(this.destroy$))
      .subscribe(config => {
        this.config = config;
        this.onConfigChange();
      });
      
    // Subscribe to metrics changes
    this.smartCalendarManager.metrics$
      .pipe(takeUntil(this.destroy$))
      .subscribe(metrics => {
        this.metrics = metrics;
        this.onMetricsChange();
      });
      
    // Initialize with default metrics
    this.updateMetrics();
  }

  ngAfterViewInit(): void {
    this.logger.info('SmartCalendarComponent', 'View initialized');
    // After view is initialized, we can access the calendar component
    setTimeout(() => {
      this.analyzeContent();
      this.updateCalendarInfo();
    }, 0);
  }

  ngOnDestroy(): void {
    this.logger.info('SmartCalendarComponent', 'Destroying smart calendar component');
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Handles configuration changes
   */
  private onConfigChange(): void {
    this.logger.info('SmartCalendarComponent', 'Configuration changed', this.config);
    // Implement logic to handle configuration changes
  }

  /**
   * Handles metrics changes
   */
  private onMetricsChange(): void {
    this.logger.info('SmartCalendarComponent', 'Metrics changed', this.metrics);
    // Implement logic to handle metrics changes
  }

  /**
   * Triggers content analysis
   */
  analyzeContent(): void {
    this.logger.info('SmartCalendarComponent', 'Starting content analysis with availability data', { 
      availabilityCount: this.availability ? this.availability.length : 0 
    });
    
    if (this.availability && this.availability.length > 0) {
      // Analyze the content using our content analyzer service
      this.contentAnalyzer.analyzeContent(this.availability).subscribe((analysis: ContentAnalysisResult) => {
        this.logger.info('SmartCalendarComponent', 'Content analysis results received', analysis);
        // Update view recommendation based on analysis
        if (analysis.viewOptimization.recommendedView) {
          this.viewRecommendation = analysis.viewOptimization.recommendedView;
          this.logger.info('SmartCalendarComponent', 'Updated view recommendation', this.viewRecommendation);
        }
        
        // Update optimal booking windows
        if (analysis.contentInsights.optimalBookingWindows) {
          this.optimalBookingWindows = analysis.contentInsights.optimalBookingWindows;
          this.logger.info('SmartCalendarComponent', 'Updated optimal booking windows', this.optimalBookingWindows);
        }
        
        // Handle analysis results
      });
    } else {
      this.logger.warn('SmartCalendarComponent', 'No availability data to analyze');
    }
  }

  /**
   * Updates view settings based on content
   */
  updateViewSettings(): void {
    this.logger.info('SmartCalendarComponent', 'Updating view settings');
    this.smartCalendarManager.optimizeViewSettings();
    // If we have a calendar component, we can change its view
    if (this.calendarComponent) {
      const calendarApi = this.calendarComponent.getApi();
      if (calendarApi && this.viewRecommendation) {
        calendarApi.changeView(this.viewRecommendation);
      }
    }
  }

  /**
   * Generates smart recommendations
   */
  generateRecommendations(): void {
    this.logger.info('SmartCalendarComponent', 'Generating smart recommendations');
    this.smartCalendarManager.generateRecommendations().subscribe((recommendations: any[]) => {
      this.logger.info('SmartCalendarComponent', 'Smart recommendations received', recommendations);
      
      if (recommendations.length > 0) {
        this.logger.info('SmartCalendarComponent', `Found ${recommendations.length} recommendations`);
      } else {
        this.logger.info('SmartCalendarComponent', 'No recommendations at this time');
      }
    });
  }
  
  /**
   * Updates metrics based on availability data
   */
  updateMetrics(): void {
    this.logger.info('SmartCalendarComponent', 'Updating metrics with availability data', { 
      availabilityCount: this.availability ? this.availability.length : 0 
    });
    
    if (this.availability && this.availability.length > 0) {
      this.totalSlots = this.availability.length;
      this.bookedSlots = this.availability.filter(slot => slot.isBooked).length;
      this.occupancyRate = Math.round((this.bookedSlots / this.totalSlots) * 100);
      
      // Detect conflicts
      const conflicts = this.contentAnalyzer.detectConflicts(this.availability);
      this.conflictingSlots = conflicts.length;
      
      // Identify optimal booking windows
      this.optimalBookingWindows = this.contentAnalyzer.identifyOptimalBookingWindows(this.availability);
      
      this.logger.info('SmartCalendarComponent', 'Calculated metrics', {
        totalSlots: this.totalSlots,
        bookedSlots: this.bookedSlots,
        conflictingSlots: this.conflictingSlots,
        occupancyRate: this.occupancyRate,
        optimalBookingWindows: this.optimalBookingWindows
      });
      
      // Update the smart calendar manager with these metrics
      this.smartCalendarManager.updateMetrics({
        totalSlots: this.totalSlots,
        bookedSlots: this.bookedSlots,
        expiredSlots: 0, // We would calculate this based on dates
        upcomingSlots: 0, // We would calculate this based on dates
        conflictingSlots: this.conflictingSlots,
        occupancyRate: this.occupancyRate
      });
    } else {
      this.logger.warn('SmartCalendarComponent', 'No availability data to calculate metrics from');
    }
  }
  
  /**
   * Updates calendar information such as current month and date range
   */
  updateCalendarInfo(): void {
    this.logger.info('SmartCalendarComponent', 'Updating calendar information');
    
    if (this.calendarComponent) {
      const calendarApi = this.calendarComponent.getApi();
      if (calendarApi) {
        // Get the current view
        const view = calendarApi.view;
        
        // Extract month and year from the current view
        if (view.currentStart) {
          const date = new Date(view.currentStart);
          const monthNames = [
            'January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'
          ];
          
          this.currentMonth = `${monthNames[date.getMonth()]} ${date.getFullYear()}`;
          
          // Format date range
          const startDate = new Date(view.currentStart);
          const endDate = new Date(view.currentEnd);
          endDate.setDate(endDate.getDate() - 1); // Subtract one day to get the last day of the range
          
          const formatDate = (d: Date) => {
            return `${d.getDate()} ${monthNames[d.getMonth()]}`;
          };
          
          this.currentDateRange = `${formatDate(startDate)} - ${formatDate(endDate)}, ${date.getFullYear()}`;
          
          this.logger.info('SmartCalendarComponent', 'Updated calendar info', {
            currentMonth: this.currentMonth,
            currentDateRange: this.currentDateRange
          });
        }
      }
    }
  }
  
  /**
   * Switches to the recommended view
   */
  switchToRecommendedView(): void {
    this.logger.info('SmartCalendarComponent', 'Switching to recommended view', this.viewRecommendation);
    
    if (this.calendarComponent && this.viewRecommendation) {
      const calendarApi = this.calendarComponent.getApi();
      if (calendarApi) {
        calendarApi.changeView(this.viewRecommendation);
        // Update calendar info after view change
        setTimeout(() => {
          this.updateCalendarInfo();
        }, 100);
      }
    }
  }
  
  /**
   * Gets the current view from the calendar
   */
  getCurrentView(): string {
    if (this.calendarComponent) {
      const calendarApi = this.calendarComponent.getApi();
      if (calendarApi) {
        return calendarApi.view.type;
      }
    }
    return 'timeGridWeek'; // Default view
  }
}