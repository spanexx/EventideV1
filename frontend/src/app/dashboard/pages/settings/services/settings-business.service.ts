import { Injectable, signal, computed } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { selectAuthLoading } from '../../../../auth/store/auth/selectors/auth.selectors';
import * as AuthActions from '../../../../auth/store/auth/actions/auth.actions';

@Injectable({
  providedIn: 'root'
})
export class SettingsBusinessService {
  // Business fields
  businessName = signal('');
  bio = signal('');
  contactPhone = signal('');
  services = signal<string[]>([]);
  categories = signal<string[]>([]);
  customCategories = signal<string[]>([]);
  availableDurations = signal<number[]>([]);
  locationDetails = signal('');
  locationCountryModel = signal('');
  locationCityModel = signal('');
  locationAddressModel = signal('');

  // Loading state
  savingBusinessSettings: Observable<boolean>;

  constructor(private store: Store) {
    this.savingBusinessSettings = this.store.select(selectAuthLoading);
  }

  updateFromUser(user: any) {
    if (user) {
      this.businessName.set(user.businessName || '');
      this.bio.set(user.bio || '');
      this.services.set(user.services || []);
      this.categories.set(user.categories || []);
      this.customCategories.set(user.customCategories || []);
      this.availableDurations.set(user.availableDurations || []);
      this.locationDetails.set(user.locationDetails || '');
      this.locationCountryModel.set(user.locationCountry || '');
      this.locationCityModel.set(user.locationCity || '');
      this.locationAddressModel.set(user.locationAddress || '');
    }
  }

  // ngModel bridges for templates (getter/setter over signals)
  get businessNameModel(): string { return this.businessName(); }
  set businessNameModel(v: string) { this.businessName.set(v ?? ''); }

  get bioModel(): string { return this.bio(); }
  set bioModel(v: string) { this.bio.set(v ?? ''); }

  get contactPhoneModel(): string { return this.contactPhone(); }
  set contactPhoneModel(v: string) { this.contactPhone.set(v ?? ''); }

  saveBusinessSettings() {
    const updates = {
      businessName: this.businessName(),
      bio: this.bio(),
      contactPhone: this.contactPhone(),
      services: this.services(),
      categories: this.categories(),
      customCategories: this.customCategories(),
      availableDurations: this.availableDurations(),
      locationDetails: this.locationDetails(),
      locationAddress: this.locationAddressModel(),
    };

    // Dispatch update via auth store
    this.store.dispatch(AuthActions.updateUser({ updates }));
  }
}