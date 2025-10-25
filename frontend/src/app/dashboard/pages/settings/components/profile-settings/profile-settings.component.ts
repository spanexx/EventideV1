import { Component, OnInit, OnChanges, SimpleChanges, signal, inject, DestroyRef, Input, EventEmitter, Output, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import * as AuthActions from '../../../../../auth/store/auth/actions/auth.actions';
import { AuthService, User as AuthUser } from '../../../../../services/auth.service';
import { selectUserEmail } from '../../../../../auth/store/auth/selectors/auth.selectors';
import { SettingsProfileService } from '../../services/settings-profile.service';

@Component({
  selector: 'app-profile-settings',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSnackBarModule,
  ],
  templateUrl: './profile-settings.component.html',
  styleUrl: './profile-settings.component.scss',
})
export class ProfileSettingsComponent implements OnInit, OnChanges {
  private authService = inject(AuthService);
  private snackBar = inject(MatSnackBar);
  private store = inject(Store);
  private destroyRef = inject(DestroyRef);
  private profileService = inject(SettingsProfileService);
  private cdr = inject(ChangeDetectorRef);

  // Inputs from parent
  @Input() firstName: any;
  @Input() lastName: any;
  @Input() savingProfile: any;
  @Input() userEmail: any;

  // Outputs to parent
  @Output() saveProfileEvent = new EventEmitter<void>();

  // Bridge properties for [(ngModel)] - ngModel needs property accessors
  get firstNameModel(): string {
    return this.firstName?.() || '';
  }
  set firstNameModel(v: string) {
    this.profileService.firstName.set(v);
  }

  get lastNameModel(): string {
    return this.lastName?.() || '';
  }
  set lastNameModel(v: string) {
    this.profileService.lastName.set(v);
  }

  ngOnChanges(changes: SimpleChanges): void {
    // Trigger change detection when inputs change
    if (changes['firstName'] || changes['lastName']) {
      console.debug('[ProfileSettingsComponent] inputs changed', {
        firstName: this.firstName,
        lastName: this.lastName
      });
      // Update profile service signals when inputs change
      if (this.firstName?.()) {
        this.profileService.firstName.set(this.firstName());
      }
      if (this.lastName?.()) {
        this.profileService.lastName.set(this.lastName());
      }
      this.cdr.markForCheck();
    }
  }

  ngOnInit(): void {
    console.debug('[ProfileSettingsComponent] initialized with', {
      firstName: this.firstName,
      lastName: this.lastName
    });
    // Initialize profile service with input values
    if (this.firstName?.()) {
      this.profileService.firstName.set(this.firstName());
    }
    if (this.lastName?.()) {
      this.profileService.lastName.set(this.lastName());
    }
  }

  public saveProfile(): void {
    this.saveProfileEvent.emit();
  }
}