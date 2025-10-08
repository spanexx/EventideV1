import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { firstValueFrom } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  async verifyEmail(token: string): Promise<void> {
    const url = `${this.apiUrl}/auth/verify-email`;
    return firstValueFrom(this.http.post<void>(url, { token }));
  }

  async resendVerificationEmail(): Promise<void> {
    const url = `${this.apiUrl}/auth/resend-verification`;
    return firstValueFrom(this.http.post<void>(url, {}));
  }
}
