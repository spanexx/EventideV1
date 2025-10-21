import { Injectable, signal } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { User as AuthUser } from '../../../../services/auth.service';
import { updateUser } from '../../../../auth/store/auth/actions/auth.actions';
import { selectAuthLoading } from '../../../../auth/store/auth/selectors/auth.selectors';

/**
 * Handles profile-related settings
 */
@Injectable({
  providedIn: 'root',
})
export class SettingsProfileService {
  firstName = signal<string>('');
  lastName = signal<string>('');
  savingProfile: Observable<boolean>;

  // Bridge properties for [(ngModel)]
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

  constructor(private store: Store) {
    this.savingProfile = this.store.select(selectAuthLoading);
  }

  updateFromUser(user: AuthUser | null): void {
    if (!user) return;
    this.firstName.set(user.firstName ?? '');
    this.lastName.set(user.lastName ?? '');
  }

  saveProfile(): void {
    const updates: Partial<AuthUser> = {
      firstName: this.firstName(),
      lastName: this.lastName(),
    };
    this.store.dispatch(updateUser({ updates }));
  }
}
