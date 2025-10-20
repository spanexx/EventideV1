import { Injectable, signal } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { User as AuthUser } from '../../../../services/auth.service';
import { updateUser } from '../../../../auth/store/auth/actions/auth.actions';
import { selectAuthLoading } from '../../../../auth/store/auth/selectors/auth.selectors';

/**
 * Handles business-related settings
 */
@Injectable()
export class SettingsBusinessService {
  // Business fields
  businessName = signal<string>('');
  bio = signal<string>('');
  contactPhone = signal<string>('');
  services = signal<string[]>([]);
  categories = signal<string[]>([]);
  customCategories = signal<string[]>([]);
  availableDurations = signal<number[]>([30, 60, 90]);
  locationCountry = signal<string>('');
  locationCity = signal<string>('');
  locationAddress = signal<string>('');
  savingBusinessSettings!: Observable<boolean>;

  // Bridge properties for ngModel
  get businessNameModel(): string {
    return this.businessName();
  }
  set businessNameModel(v: string) {
    this.businessName.set(v);
  }

  get bioModel(): string {
    return this.bio();
  }
  set bioModel(v: string) {
    this.bio.set(v);
  }

  get contactPhoneModel(): string {
    return this.contactPhone();
  }
  set contactPhoneModel(v: string) {
    this.contactPhone.set(v);
  }

  get locationCountryModel(): string {
    return this.locationCountry();
  }
  set locationCountryModel(v: string) {
    this.locationCountry.set(v);
  }

  get locationCityModel(): string {
    return this.locationCity();
  }
  set locationCityModel(v: string) {
    this.locationCity.set(v);
  }

  get locationAddressModel(): string {
    return this.locationAddress();
  }
  set locationAddressModel(v: string) {
    this.locationAddress.set(v);
  }

  constructor(
    private store: Store,
    private snackBar: MatSnackBar,
  ) {
    this.savingBusinessSettings = this.store.select(selectAuthLoading);
  }

  updateFromUser(user: AuthUser | null): void {
    this.businessName.set(user?.businessName ?? '');
    this.bio.set(user?.bio ?? '');
    this.contactPhone.set(user?.contactPhone ?? '');
    this.services.set(user?.services ?? []);
    this.categories.set(user?.categories ?? []);
    this.availableDurations.set(user?.availableDurations ?? [30, 60, 90]);
    this.locationCountry.set(user?.locationDetails?.country ?? '');
    this.locationCity.set(user?.locationDetails?.city ?? '');
    this.locationAddress.set(user?.locationDetails?.address ?? '');
  }

  saveBusinessSettings(): void {
    const businessSettings = {
      businessName: this.businessName(),
      bio: this.bio(),
      contactPhone: this.contactPhone(),
      services: this.services(),
      categories: this.categories(),
      customCategories: this.customCategories(),
      availableDurations: this.availableDurations().map((d) => parseInt(d.toString())),
      locationDetails: {
        country: this.locationCountry(),
        city: this.locationCity(),
        address: this.locationAddress(),
      },
    };

    console.debug('[SettingsBusinessService] Dispatching updateUser action', businessSettings);
    this.store.dispatch(updateUser({ updates: businessSettings }));
  }
}
