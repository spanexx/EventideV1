import { Injectable, signal, computed } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { selectAuthLoading } from '../../../../auth/store/auth/selectors/auth.selectors';
import * as AuthActions from '../../../../auth/store/auth/actions/auth.actions';
import { User as AuthUser } from '../../../../services/auth.service';

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

  updateFromUser(user: AuthUser | null) {
    if (user) {
      console.debug('[SettingsBusinessService] updating from user', user.email);
      this.businessName.set(user.businessName || '');
      this.bio.set(user.bio || '');
      this.contactPhone.set(user.contactPhone || '');
      this.services.set(user.services || []);
      this.categories.set(user.categories || []);
      this.customCategories.set(user.customCategories || []);
      this.availableDurations.set(user.availableDurations || []);

      // Handle location details properly
      if (user.locationDetails) {
        this.locationDetails.set(JSON.stringify(user.locationDetails));
        this.locationCountryModel.set(user.locationDetails.country || '');
        this.locationCityModel.set(user.locationDetails.city || '');
        this.locationAddressModel.set(user.locationDetails.address || '');
      } else {
        this.locationDetails.set('');
        this.locationCountryModel.set('');
        this.locationCityModel.set('');
        this.locationAddressModel.set('');
      }
    } else {
      console.debug('[SettingsBusinessService] clearing business data');
      this.clearBusinessData();
    }
  }

  private clearBusinessData() {
    this.businessName.set('');
    this.bio.set('');
    this.contactPhone.set('');
    this.services.set([]);
    this.categories.set([]);
    this.customCategories.set([]);
    this.availableDurations.set([]);
    this.locationDetails.set('');
    this.locationCountryModel.set('');
    this.locationCityModel.set('');
    this.locationAddressModel.set('');
  }

  updateField(updates: any) {
    if (updates.businessName !== undefined) this.businessName.set(updates.businessName);
    if (updates.bio !== undefined) this.bio.set(updates.bio);
    if (updates.contactPhone !== undefined) this.contactPhone.set(updates.contactPhone);
    if (updates.services !== undefined) this.services.set(updates.services);
    if (updates.categories !== undefined) this.categories.set(updates.categories);
    if (updates.customCategories !== undefined) this.customCategories.set(updates.customCategories);
    if (updates.availableDurations !== undefined) this.availableDurations.set(updates.availableDurations);
    if (updates.locationDetails?.country !== undefined) this.locationCountryModel.set(updates.locationDetails.country);
    if (updates.locationDetails?.city !== undefined) this.locationCityModel.set(updates.locationDetails.city);
    if (updates.locationDetails?.address !== undefined) this.locationAddressModel.set(updates.locationDetails.address);
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
      locationDetails: {
        country: this.locationCountryModel(),
        city: this.locationCityModel(),
        address: this.locationAddressModel(),
      },
    };

    // Dispatch update via auth store
    this.store.dispatch(AuthActions.updateUser({ updates }));
  }
}