import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';
import { ProviderService, Provider } from '../../provider-search/services/provider.service';

@Injectable({
  providedIn: 'root'
})
export class ProviderInfoService {
  private currentProvider$ = new BehaviorSubject<Provider | null>(null);

  constructor(private providerService: ProviderService) {}

  /**
   * Get provider info by ID
   */
  getProviderInfo(providerId: string): Observable<Provider> {
    return this.providerService.getProviderById(providerId).pipe(
      tap(provider => {
        this.currentProvider$.next(provider);
        console.log('📋 [ProviderInfo] Provider loaded:', {
          id: provider.id,
          requiresPayment: provider.preferences?.payment?.requirePaymentForBookings,
          hourlyRate: provider.preferences?.payment?.hourlyRate,
          currency: provider.preferences?.payment?.currency
        });
      })
    );
  }

  /**
   * Get current provider from cache
   */
  getCurrentProvider(): Provider | null {
    return this.currentProvider$.value;
  }

  /**
   * Observable for current provider
   */
  getCurrentProvider$(): Observable<Provider | null> {
    return this.currentProvider$.asObservable();
  }

  /**
   * Check if provider requires payment
   */
  requiresPayment(): boolean {
    const provider = this.currentProvider$.value;
    return provider?.preferences?.payment?.requirePaymentForBookings ?? false;
  }

  /**
   * Get provider's hourly rate in cents
   */
  getHourlyRate(): number {
    const provider = this.currentProvider$.value;
    return provider?.preferences?.payment?.hourlyRate ?? 5000;
  }

  /**
   * Get provider's currency
   */
  getCurrency(): string {
    const provider = this.currentProvider$.value;
    return provider?.preferences?.payment?.currency ?? 'usd';
  }

  /**
   * Calculate booking amount based on duration
   */
  calculateAmount(durationMinutes: number): number {
    if (!this.requiresPayment()) {
      return 0;
    }
    
    const hourlyRate = this.getHourlyRate();
    const hours = durationMinutes / 60;
    return Math.round(hourlyRate * hours);
  }

  /**
   * Clear cached provider
   */
  clearProvider(): void {
    this.currentProvider$.next(null);
  }
}
