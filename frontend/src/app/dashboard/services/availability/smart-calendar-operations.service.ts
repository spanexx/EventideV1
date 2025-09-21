import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Availability } from '../../models/availability.models';
import { SmartCalendarManagerService, ContentMetrics, SmartCalendarConfig, FilterOptions } from '../smart-calendar-manager.service';
import { SmartContentAnalyzerService, ContentAnalysisResult } from '../';
import { SnackbarService } from '../../../shared/services/snackbar.service';
import { MatDialog } from '@angular/material/dialog';
import { SmartCalendarAnalysisDialogComponent } from '../../components/smart-calendar-analysis-dialog/smart-calendar-analysis-dialog.component';
import { SmartCalendarRecommendationsDialogComponent } from '../../components/smart-calendar-recommendations-dialog/smart-calendar-recommendations-dialog.component';

@Injectable({
  providedIn: 'root'
})
export class SmartCalendarOperationsService {
  constructor(
    private smartCalendarManager: SmartCalendarManagerService,
    private contentAnalyzer: SmartContentAnalyzerService,
    private snackbarService: SnackbarService,
    private dialog: MatDialog
  ) {}

  /**
   * Analyze calendar content using smart content analyzer
   * @param availability Current availability data
   * @param smartMetricsSubject BehaviorSubject to update metrics
   * @param viewRecommendationSubject BehaviorSubject to update view recommendation
   */
  analyzeCalendarContent(
    availability: Availability[],
    smartMetricsSubject: any,
    viewRecommendationSubject: any
  ): void {
    if (availability && availability.length > 0) {
      // Analyze the content using our content analyzer service
      this.contentAnalyzer.analyzeContent(availability).subscribe(analysis => {
        // Update metrics
        const totalSlots = availability.length;
        const bookedSlots = availability.filter(slot => slot.isBooked).length;
        const occupancyRate = Math.round((bookedSlots / totalSlots) * 100);
        
        // Detect conflicts
        const conflicts = this.contentAnalyzer.detectConflicts(availability);
        
        const metrics = {
          totalSlots: totalSlots,
          bookedSlots: bookedSlots,
          expiredSlots: 0, // We would calculate this based on dates
          upcomingSlots: 0, // We would calculate this based on dates
          conflictingSlots: conflicts.length,
          occupancyRate: occupancyRate
        };
        
        smartMetricsSubject.next(metrics);
        
        // Update view recommendation from the analysis
        let viewRecommendation = '';
        if (analysis.viewOptimization.recommendedView) {
          viewRecommendation = analysis.viewOptimization.recommendedView;
          viewRecommendationSubject.next(analysis.viewOptimization.recommendedView);
        }
        
        // Also update the content insights
        if (analysis.contentInsights) {
          const insights = analysis.contentInsights;
          const currentMetrics = smartMetricsSubject.value;
          
          // Create a new metrics object with updated values
          const updatedMetrics: ContentMetrics = { ...currentMetrics };
          
          if (insights['totalSlots'] !== undefined) {
            updatedMetrics.totalSlots = insights['totalSlots'];
          }
          if (insights['bookedSlots'] !== undefined) {
            updatedMetrics.bookedSlots = insights['bookedSlots'];
          }
          if (insights['occupancyRate'] !== undefined) {
            updatedMetrics.occupancyRate = insights['occupancyRate'];
          }
          if (insights['conflictingSlots'] !== undefined) {
            updatedMetrics.conflictingSlots = insights['conflictingSlots'];
          }
          
          smartMetricsSubject.next(updatedMetrics);
        }
        
        // Show analysis dialog with the results
        const dialogRef = this.dialog.open(SmartCalendarAnalysisDialogComponent, {
          width: '600px',
          data: {
            metrics: metrics,
            viewRecommendation: analysis.viewOptimization.recommendedView || '',
            occupancyRate: occupancyRate
          }
        });
        
        this.snackbarService.showSuccess('Calendar analysis complete');
      });
    } else {
      this.snackbarService.showInfo('No data to analyze');
    }
  }

  /**
   * Get smart recommendations based on calendar content
   * @param availability Current availability data
   * @param smartRecommendationsSubject BehaviorSubject to update recommendations
   */
  getSmartRecommendations(
    availability: Availability[],
    smartRecommendationsSubject: any
  ): void {
    if (availability && availability.length > 0) {
      // First update the manager with current metrics based on availability data
      const totalSlots = availability.length;
      const bookedSlots = availability.filter(slot => slot.isBooked).length;
      const occupancyRate = Math.round((bookedSlots / totalSlots) * 100);
      
      // Update metrics in the smart calendar manager
      this.smartCalendarManager.updateMetrics({
        totalSlots: totalSlots,
        bookedSlots: bookedSlots,
        occupancyRate: occupancyRate
      });
      
      // Generate recommendations using our smart calendar manager
      this.smartCalendarManager.generateRecommendations().subscribe(recommendations => {
        smartRecommendationsSubject.next(recommendations);
        
        // Show recommendations dialog with the results
        const dialogRef = this.dialog.open(SmartCalendarRecommendationsDialogComponent, {
          width: '600px',
          data: {
            recommendations: recommendations || []
          }
        });
        
        if (recommendations.length > 0) {
          this.snackbarService.showInfo(`Found ${recommendations.length} recommendations`);
        } else {
          this.snackbarService.showInfo('No recommendations at this time');
        }
      });
    } else {
      this.snackbarService.showInfo('No data to analyze for recommendations');
    }
  }
  
  /**
   * Performs a search on the calendar data using enhanced AI-powered natural language processing
   * @param query Search query
   * @param availability Current availability data
   * @param refreshCalendar Function to refresh the calendar with search results
   * @param smartMetricsSubject BehaviorSubject to update metrics
   */
  async performSearch(
    query: string,
    availability: Availability[],
    refreshCalendar: (results: Availability[]) => void,
    smartMetricsSubject: any,
    contentAnalyzer: SmartContentAnalyzerService,
    // Add calendar API for navigation
    calendarApi?: any
  ): Promise<void> {
    if (!query) {
      this.snackbarService.showInfo('Please enter a search query');
      return;
    }
    
    try {
      // Use enhanced AI search if available
      const searchResult = await contentAnalyzer.searchWithEnhancedNLP(query, availability);
      
      // Update the calendar with search results
      refreshCalendar(searchResult.results);
      
      // Navigate to date if navigation info is provided
      if (calendarApi && searchResult.navigation) {
        this.navigateToDate(calendarApi, searchResult.navigation.date, searchResult.navigation.view);
      }
      
      // Update metrics with search results
      const totalSlots = searchResult.results.length;
      const bookedSlots = searchResult.results.filter((slot: Availability) => slot.isBooked).length;
      const occupancyRate = totalSlots > 0 ? Math.round((bookedSlots / totalSlots) * 100) : 0;
      
      // Detect conflicts in search results
      const conflicts = contentAnalyzer.detectConflicts(searchResult.results);
      
      smartMetricsSubject.next({
        totalSlots: totalSlots,
        bookedSlots: bookedSlots,
        expiredSlots: 0, // We would calculate this based on dates
        upcomingSlots: 0, // We would calculate this based on dates
        conflictingSlots: conflicts.length,
        occupancyRate: occupancyRate
      });
      
      // Show enhanced search results feedback
      if (searchResult.results.length > 0) {
        this.snackbarService.showSuccess(
          `Found ${searchResult.results.length} results: ${searchResult.interpretation}`
        );
      } else {
        this.snackbarService.showInfo(
          `No results found: ${searchResult.interpretation}`
        );
      }
      
      // Store suggestions for future use (could emit to a suggestions subject)
      if (searchResult.suggestions && searchResult.suggestions.length > 0) {
        console.log('AI Search suggestions:', searchResult.suggestions);
      }
      
    } catch (error) {
      console.error('Enhanced AI search failed, falling back to basic search:', error);
      
      // Fallback to basic search
      const searchResults = await contentAnalyzer.searchWithNLP(query, availability);
      
      // Update the calendar with search results
      refreshCalendar(searchResults);
      
      // Update metrics with search results
      const totalSlots = searchResults.length;
      const bookedSlots = searchResults.filter((slot: Availability) => slot.isBooked).length;
      const occupancyRate = totalSlots > 0 ? Math.round((bookedSlots / totalSlots) * 100) : 0;
      
      // Detect conflicts in search results
      const conflicts = contentAnalyzer.detectConflicts(searchResults);
      
      smartMetricsSubject.next({
        totalSlots: totalSlots,
        bookedSlots: bookedSlots,
        expiredSlots: 0, // We would calculate this based on dates
        upcomingSlots: 0, // We would calculate this based on dates
        conflictingSlots: conflicts.length,
        occupancyRate: occupancyRate
      });
      
      this.snackbarService.showSuccess(`Found ${searchResults.length} matching slots`);
    }
  }

  /**
   * Navigates the calendar to a specific date and view
   * @param calendarApi FullCalendar API instance
   * @param date Date to navigate to (YYYY-MM-DD format)
   * @param view Optional view to switch to
   */
  private navigateToDate(calendarApi: any, date: string, view?: 'timeGridDay' | 'timeGridWeek' | 'dayGridMonth'): void {
    try {
      // Change view if specified
      if (view && calendarApi.view.type !== view) {
        calendarApi.changeView(view);
      }
      
      // Navigate to the specific date
      const targetDate = new Date(date);
      if (!isNaN(targetDate.getTime())) {
        calendarApi.gotoDate(targetDate);
        console.log(`📅 Navigated to date: ${date} with view: ${view || calendarApi.view.type}`);
      }
    } catch (error) {
      console.error('❌ Failed to navigate to date:', error);
    }
  }

  /**
   * Opens a filter dialog to configure calendar filters
   * @param currentFilters Current filter options
   * @param availability$ Observable of availability data
   * @param refreshCalendar Function to refresh the calendar with filtered data
   * @param smartMetricsSubject BehaviorSubject to update metrics
   */
  applyFilters(
    filters: FilterOptions,
    currentFilters: FilterOptions,
    availability$: Observable<Availability[]>,
    refreshCalendar: (results: Availability[]) => void,
    smartMetricsSubject: any,
    smartCalendarManager: SmartCalendarManagerService,
    contentAnalyzer: SmartContentAnalyzerService
  ): void {
    // Update current filters
    const updatedFilters = { ...currentFilters, ...filters };
    
    // Apply filters to the availability data
    availability$.subscribe(availability => {
      const filteredData = smartCalendarManager.applyFilters(availability, updatedFilters);
      
      // Update the calendar with filtered data
      refreshCalendar(filteredData);
      
      // Update metrics with filtered data
      const totalSlots = filteredData.length;
      const bookedSlots = filteredData.filter(slot => slot.isBooked).length;
      const occupancyRate = totalSlots > 0 ? Math.round((bookedSlots / totalSlots) * 100) : 0;
      
      // Detect conflicts in filtered data
      const conflicts = contentAnalyzer.detectConflicts(filteredData);
      
      smartMetricsSubject.next({
        totalSlots: totalSlots,
        bookedSlots: bookedSlots,
        expiredSlots: 0, // We would calculate this based on dates
        upcomingSlots: 0, // We would calculate this based on dates
        conflictingSlots: conflicts.length,
        occupancyRate: occupancyRate
      });
      
      this.snackbarService.showSuccess(`Filtered to ${filteredData.length} slots`);
    });
  }

  /**
   * Initialize the smart calendar features
   * @param availability$ Observable of availability data
   * @param smartMetricsSubject BehaviorSubject to update metrics
   * @param viewRecommendationSubject BehaviorSubject to update view recommendation
   * @param previousAvailabilityLength Track previous availability length
   * @param previousRecommendedView Track previous recommended view
   * @param previousConfig Track previous configuration
   * @param previousMetrics Track previous metrics
   * @param analysisTimeout Track analysis timeout
   */
  initializeSmartCalendar(
    availability$: Observable<Availability[]>,
    smartMetricsSubject: any,
    viewRecommendationSubject: any,
    previousAvailabilityLength: number,
    previousRecommendedView: string | null,
    previousConfig: Partial<SmartCalendarConfig>,
    previousMetrics: ContentMetrics,
    analysisTimeout: any,
    contentAnalyzer: SmartContentAnalyzerService
  ): any {
    // Track if we've already processed the initial availability data
    let hasProcessedInitialData = false;
    
    // Subscribe to availability updates to trigger smart calendar analysis
    const subscription = availability$.subscribe(availability => {
      // Update smart calendar metrics
      if (availability && availability.length > 0) {
        // Only process if this is new data or we haven't processed initial data yet
        if (!hasProcessedInitialData || availability.length !== previousAvailabilityLength) {
          hasProcessedInitialData = true;
          previousAvailabilityLength = availability.length;
          
          const totalSlots = availability.length;
          const bookedSlots = availability.filter(slot => slot.isBooked).length;
          const occupancyRate = Math.round((bookedSlots / totalSlots) * 100);
          
          // Detect conflicts
          const conflicts = contentAnalyzer.detectConflicts(availability);
          
          // Update metrics subject for UI display
          smartMetricsSubject.next({
            totalSlots: totalSlots,
            bookedSlots: bookedSlots,
            expiredSlots: 0, // We would calculate this based on dates
            upcomingSlots: 0, // We would calculate this based on dates
            conflictingSlots: conflicts.length,
            occupancyRate: occupancyRate
          });
          
          // Debounce the content analysis to prevent too many rapid calls
          clearTimeout(analysisTimeout);
          analysisTimeout = setTimeout(() => {
            // Analyze content to get view recommendations
            contentAnalyzer.analyzeContent(availability).subscribe(analysis => {
              // Update view recommendation from the analysis
              if (analysis.viewOptimization.recommendedView) {
                viewRecommendationSubject.next(analysis.viewOptimization.recommendedView);
              }
            });
          }, 300); // Debounce for 300ms
        }
      }
    });
    
    // Subscribe to smart calendar manager configuration changes
    const configSubscription = this.smartCalendarManager.config$.subscribe(config => {
      // Handle configuration changes if needed
    });
    
    // Subscribe to smart calendar manager metrics changes
    const metricsSubscription = this.smartCalendarManager.metrics$.subscribe(metrics => {
      // Handle metrics changes if needed
    });
    
    return {
      subscription,
      configSubscription,
      metricsSubscription,
      previousAvailabilityLength
    };
  }
}