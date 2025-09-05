import { Component, OnInit, inject } from '@angular/core';
import { Store } from '@ngrx/store';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { Observable } from 'rxjs';
import { CommonModule } from '@angular/common';
import * as AuthActions from '../../store/auth';
import * as AuthSelectors from '../../store/auth';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './reset-password.component.html',
  styleUrls: ['./reset-password.component.scss']
})
export class ResetPasswordComponent implements OnInit {
  private store = inject(Store);
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  resetPasswordForm: FormGroup;
  loading$: Observable<boolean>;
  error$: Observable<string | null>;
  message$: Observable<string | null>;
  token: string | null = null;

  constructor() {
    this.resetPasswordForm = this.fb.group({
      newPassword: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]]
    }, {
      validators: this.passwordMatchValidator
    });

    this.loading$ = this.store.select(AuthSelectors.selectAuthLoading);
    this.error$ = this.store.select(AuthSelectors.selectAuthError);
    this.message$ = this.store.select(AuthSelectors.selectResetPasswordMessage);
  }

  ngOnInit(): void {
    // Get token from query params
    this.token = this.route.snapshot.queryParams['token'] || null;

    // Clear any previous messages when component initializes
    this.store.dispatch(AuthActions.resetPasswordFailure({ error: '' }));
    this.store.dispatch(AuthActions.resetPasswordSuccess({ message: '' }));
  }

  passwordMatchValidator(form: FormGroup) {
    const password = form.get('newPassword');
    const confirmPassword = form.get('confirmPassword');

    if (password && confirmPassword && password.value !== confirmPassword.value) {
      confirmPassword.setErrors({ passwordMismatch: true });
    } else {
      confirmPassword?.setErrors(null);
    }

    return null;
  }

  onSubmit(): void {
    if (this.resetPasswordForm.valid && this.token) {
      const { newPassword } = this.resetPasswordForm.value;
      this.store.dispatch(AuthActions.resetPassword({ token: this.token, newPassword }));
    }
  }

  navigateToLogin(): void {
    this.router.navigate(['/auth/login']);
  }
}