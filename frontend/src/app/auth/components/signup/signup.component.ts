import { Component, OnInit, inject } from '@angular/core';
import { Store } from '@ngrx/store';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { Observable } from 'rxjs';
import { CommonModule } from '@angular/common';
import * as AuthActions from '../../store/auth';
import * as AuthSelectors from '../../store/auth';

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './signup.component.html',
  styleUrls: ['./signup.component.scss']
})
export class SignupComponent implements OnInit {
  private store = inject(Store);
  private fb = inject(FormBuilder);
  private router = inject(Router);

  signupForm: FormGroup;
  loading$: Observable<boolean>;
  error$: Observable<string | null>;

  constructor() {
    this.signupForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]]
    }, {
      validators: this.passwordMatchValidator
    });

    this.loading$ = this.store.select(AuthSelectors.selectAuthLoading);
    this.error$ = this.store.select(AuthSelectors.selectAuthError);
  }

  ngOnInit(): void {
    // Clear any previous error messages when component initializes
    this.store.dispatch(AuthActions.signupFailure({ error: '' }));
  }

  passwordMatchValidator(form: FormGroup) {
    const password = form.get('password');
    const confirmPassword = form.get('confirmPassword');

    if (password && confirmPassword && password.value !== confirmPassword.value) {
      confirmPassword.setErrors({ passwordMismatch: true });
    } else {
      confirmPassword?.setErrors(null);
    }

    return null;
  }

  onSubmit(): void {
    if (this.signupForm.valid) {
      const { email, password } = this.signupForm.value;
      this.store.dispatch(AuthActions.signup({ email, password }));
    }
  }

  navigateToLogin(): void {
    this.router.navigate(['/auth/login']);
  }
}