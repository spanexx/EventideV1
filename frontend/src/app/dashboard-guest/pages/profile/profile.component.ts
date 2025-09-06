import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { Store } from '@ngrx/store';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Observable } from 'rxjs';
import { take } from 'rxjs/operators';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import * as GuestDashboardActions from '../../store/actions/guest-dashboard.actions';
import * as GuestDashboardSelectors from '../../store/selectors/guest-dashboard.selectors';
import { GuestInfo, GuestPreferences } from '../../models/guest.models';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatCheckboxModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProfileComponent implements OnInit {
  profileForm: FormGroup;
  preferencesForm: FormGroup;
  profile$: Observable<GuestInfo | null>;
  loading$: Observable<boolean>;
  error$: Observable<string | null>;

  constructor(
    private store: Store,
    private fb: FormBuilder
  ) {
    this.profileForm = this.fb.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      phone: ['']
    });

    this.preferencesForm = this.fb.group({
      emailNotifications: [true],
      smsNotifications: [false]
    });

    this.profile$ = this.store.select(GuestDashboardSelectors.selectProfileInfo);
    this.loading$ = this.store.select(GuestDashboardSelectors.selectProfileLoading);
    this.error$ = this.store.select(GuestDashboardSelectors.selectProfileError);
  }

  ngOnInit(): void {
    this.store.dispatch(GuestDashboardActions.loadProfile());
    
    // Populate form with existing profile data
    this.profile$.pipe(take(1)).subscribe(profile => {
      if (profile) {
        this.profileForm.patchValue({
          name: profile.name,
          email: profile.email,
          phone: profile.phone || ''
        });
      }
    });
  }

  onSubmitProfile(): void {
    if (this.profileForm.valid) {
      const profileData: GuestInfo = {
        id: '', // This would come from the existing profile
        name: this.profileForm.value.name,
        email: this.profileForm.value.email,
        phone: this.profileForm.value.phone,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      this.store.dispatch(GuestDashboardActions.updateProfile({ profile: profileData }));
    }
  }

  onSubmitPreferences(): void {
    if (this.preferencesForm.valid) {
      const preferencesData: GuestPreferences = {
        notifications: {
          email: this.preferencesForm.value.emailNotifications,
          sms: this.preferencesForm.value.smsNotifications
        },
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
      };
      this.store.dispatch(GuestDashboardActions.updatePreferences({ preferences: preferencesData }));
    }
  }
}