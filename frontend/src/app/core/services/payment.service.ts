import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface CreateCheckoutSessionRequest {
  bookingId: string;
  amount: number;
  currency?: string;
  customerEmail: string;
  successUrl: string;
  cancelUrl: string;
}

export interface CheckoutSessionResponse {
  sessionId: string;
  url: string;
}

export interface PaymentSessionStatus {
  id: string;
  paymentStatus: string;
  paymentIntentId: string;
  metadata: Record<string, string>;
}

@Injectable({
  providedIn: 'root'
})
export class PaymentService {
  private readonly apiUrl = `${environment.apiUrl}/payment`;

  constructor(private http: HttpClient) {}

  createCheckoutSession(request: CreateCheckoutSessionRequest): Observable<CheckoutSessionResponse> {
    return this.http.post<CheckoutSessionResponse>(`${this.apiUrl}/create-checkout-session`, request);
  }

  getSessionStatus(sessionId: string): Observable<PaymentSessionStatus> {
    return this.http.get<PaymentSessionStatus>(`${this.apiUrl}/session/${sessionId}`);
  }

  redirectToCheckout(url: string): void {
    window.location.href = url;
  }
}
