import { Component, OnInit, signal, inject, DestroyRef } from '@angular/core';
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

@Component({
  selector: 'app-profile-settings',
  standalone: true,
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
export class ProfileSettingsComponent implements OnInit {
  private authService = inject(AuthService);
  private snackBar = inject(MatSnackBar);
  private store = inject(Store);
  private destroyRef = inject(DestroyRef);

  // Local editable fields for profile
  firstName = signal<string>('');
  lastName = signal<string>('');
  savingProfile = signal(false);

  // Bridge properties for [(ngModel)] - ngModel needs property accessors
  get firstNameModel(): string {
    return this.firstName();
  }
  set firstNameModel(v: string) {
    this.firstName.set(v);
  }

  get lastNameModel(): string {
    return this.lastName();
  }
  set lastNameModel(v: string) {
    this.lastName.set(v);
  }

  userEmail$!: Observable<string>;

  constructor() {
    // Subscribe to current user to populate editable fields
    this.authService.currentUser$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((u) => {
      const user = u as AuthUser | null;
      this.firstName.set(user?.firstName ?? '');
      this.lastName.set(user?.lastName ?? '');
    });
  }

  ngOnInit(): void {
    this.userEmail$ = this.store.select(selectUserEmail);
    // Refresh user data from the API to ensure we have the latest data
    this.store.dispatch(AuthActions.refreshUser());
  }

  public saveProfile(): void {
    const f = this.firstName();
    const l = this.lastName();
    const updates: Partial<AuthUser> = { firstName: f, lastName: l };
    this.savingProfile.set(true);
    this.authService.updateCurrentUser(updates).subscribe({
      next: (user) => {
        this.snackBar.open('Profile updated', 'Close', { duration: 2000 });
        this.savingProfile.set(false);
      },
      error: (err) => {
        console.error('Failed to update profile', err);
        this.snackBar.open('Failed to update profile', 'Close', { duration: 3000 });
        this.savingProfile.set(false);
      },
    });
  }
}