import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface UserPreferencesDto {
  timezone?: string;
  notifications?: {
    email?: boolean;
    sms?: boolean;
    push?: boolean;
  };
  calendar?: {
    defaultView?: string;
    autoSwitchView?: boolean;
  };
}

@Injectable({
  providedIn: 'root'
})
export class PreferencesService {
  private base = '/api/users/me';

  constructor(private http: HttpClient) { }

  getPreferences(): Observable<UserPreferencesDto> {
    console.log('🔁 [PreferencesService] GET', `${this.base}/preferences`);
    return this.http.get<UserPreferencesDto>(`${this.base}/preferences`);
  }

  updatePreferences(dto: Partial<UserPreferencesDto>) {
    console.log('🔁 [PreferencesService] PATCH', `${this.base}/preferences`, dto);
    return this.http.patch<UserPreferencesDto>(`${this.base}/preferences`, dto);
  }

  resetPreferences() {
    console.log('🔁 [PreferencesService] POST reset', `${this.base}/preferences/reset`);
    return this.http.post<UserPreferencesDto>(`${this.base}/preferences/reset`, {});
  }
}
