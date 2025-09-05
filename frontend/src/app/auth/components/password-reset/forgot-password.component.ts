import { Component, OnInit, inject } from '@angular/core';
import { Store } from '@ngrx/store';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { Observable } from 'rxjs';
import { CommonModule } from '@angular/common';
import * as AuthActions from '../../store/auth';
import * as AuthSelectors from '../../store/auth';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './forgot-password.component.html',
  styleUrls: ['./forgot-password.component.scss']
})
export class ForgotPasswordComponent implements OnInit {
  private store = inject(Store);
  private fb = inject(FormBuilder);
  private router = inject(Router);

  forgotPasswordForm: FormGroup;
  loading$: Observable<boolean>;
  error$: Observable<string | null>;
  message$: Observable<string | null>;

  constructor() {
    this.forgotPasswordForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]]
    });

    this.loading$ = this.store.select(AuthSelectors.selectAuthLoading);
    this.error$ = this.store.select(AuthSelectors.selectAuthError);
    this.message$ = this.store.select(AuthSelectors.selectForgotPasswordMessage);
  }

  ngOnInit(): void {
    // Clear any previous messages when component initializes
    this.store.dispatch(AuthActions.forgotPasswordFailure({ error: '' }));
    this.store.dispatch(AuthActions.forgotPasswordSuccess({ message: '' }));
  }

  onSubmit(): void {
    if (this.forgotPasswordForm.valid) {
      const { email } = this.forgotPasswordForm.value;
      this.store.dispatch(AuthActions.forgotPassword({ email }));
    }
  }

  navigateToLogin(): void {
    this.router.navigate(['/auth/login']);
  }
}