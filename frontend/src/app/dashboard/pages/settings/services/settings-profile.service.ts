import { Injectable, signal } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { User as AuthUser } from '../../../../services/auth.service';
import { updateUser } from '../../../../auth/store/auth/actions/auth.actions';
import { selectAuthLoading } from '../../../../auth/store/auth/selectors/auth.selectors';

/**
 * Handles profile-related settings (firstName, lastName)
 */
@Injectable()
export class SettingsProfileService {
  // Profile fields
  firstName = signal<string>('');
  lastName = signal<string>('');
  
  // Use auth store loading state - initialized in constructor
  savingProfile!: Observable<boolean>;

  // Bridge properties for ngModel
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

  constructor(
    private store: Store,
    private snackBar: MatSnackBar,
  ) {
    this.savingProfile = this.store.select(selectAuthLoading);
  }

  updateFromUser(user: AuthUser | null): void {
    this.firstName.set(user?.firstName ?? '');
    this.lastName.set(user?.lastName ?? '');
  }

  saveProfile(): void {
    const f = this.firstName();
    const l = this.lastName();
    const updates: Partial<AuthUser> = { firstName: f, lastName: l };
    
    console.debug('[SettingsProfileService] Dispatching updateUser action', updates);
    this.store.dispatch(updateUser({ updates }));
  }
}
