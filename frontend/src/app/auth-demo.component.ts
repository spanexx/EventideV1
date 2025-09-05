import { Component, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { User } from './services/auth.service';

// Import directly from the files instead of the index files
import * as AuthActions from './auth/store/auth/actions/auth.actions';
import * as AuthSelectors from './auth/store/auth/selectors/auth.selectors';

@Component({
  selector: 'app-auth-demo',
  template: `
    <div>
      <h2>Auth Store Demo</h2>
      
      <div *ngIf="loading$ | async">Loading...</div>
      
      <div *ngIf="error$ | async as error" class="error">
        Error: {{ error }}
      </div>
      
      <div *ngIf="user$ | async as user">
        <h3>Welcome, {{ user.email }}!</h3>
        <p>User ID: {{ user.id }}</p>
        <button (click)="logout()">Logout</button>
      </div>
      
      <div *ngIf="(isAuthenticated$ | async) === false && (loading$ | async) === false">
        <h3>Login</h3>
        <form (ngSubmit)="login()">
          <input type="email" [(ngModel)]="email" name="email" placeholder="Email" required>
          <input type="password" [(ngModel)]="password" name="password" placeholder="Password" required>
          <button type="submit">Login</button>
        </form>
        
        <h3>Signup</h3>
        <form (ngSubmit)="signup()">
          <input type="email" [(ngModel)]="signupEmail" name="signupEmail" placeholder="Email" required>
          <input type="password" [(ngModel)]="signupPassword" name="signupPassword" placeholder="Password" required>
          <input type="text" [(ngModel)]="firstName" name="firstName" placeholder="First Name">
          <input type="text" [(ngModel)]="lastName" name="lastName" placeholder="Last Name">
          <button type="submit">Signup</button>
        </form>
      </div>
    </div>
  `,
  styles: [`
    .error {
      color: red;
      margin: 10px 0;
    }
    
    form {
      margin: 20px 0;
      padding: 10px;
      border: 1px solid #ccc;
      border-radius: 4px;
    }
    
    input {
      display: block;
      margin: 10px 0;
      padding: 8px;
      width: 100%;
      box-sizing: border-box;
    }
    
    button {
      padding: 10px 20px;
      background-color: #007bff;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
    }
    
    button:hover {
      background-color: #0056b3;
    }
  `],
  standalone: true,
  imports: [CommonModule, FormsModule]
})
export class AuthDemoComponent implements OnInit {
  user$: Observable<User | null>;
  isAuthenticated$: Observable<boolean>;
  loading$: Observable<boolean>;
  error$: Observable<string | null>;
  
  email = '';
  password = '';
  signupEmail = '';
  signupPassword = '';
  firstName = '';
  lastName = '';

  constructor(private store: Store) {
    this.user$ = this.store.select(AuthSelectors.selectUser);
    this.isAuthenticated$ = this.store.select(AuthSelectors.selectIsAuthenticated);
    this.loading$ = this.store.select(AuthSelectors.selectAuthLoading);
    this.error$ = this.store.select(AuthSelectors.selectAuthError);
  }

  ngOnInit() {
    // Verify existing token on init
    this.store.dispatch(AuthActions.verifyToken());
  }

  login() {
    if (this.email && this.password) {
      this.store.dispatch(AuthActions.login({ email: this.email, password: this.password }));
    }
  }

  signup() {
    if (this.signupEmail && this.signupPassword) {
      this.store.dispatch(AuthActions.signup({
        email: this.signupEmail,
        password: this.signupPassword,
        firstName: this.firstName,
        lastName: this.lastName
      }));
    }
  }

  logout() {
    this.store.dispatch(AuthActions.logout());
  }
}