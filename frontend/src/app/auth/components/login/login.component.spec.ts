import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LoginComponent } from './login.component';
import { Store } from '@ngrx/store';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { of } from 'rxjs';
import * as AuthActions from '../../../store/auth/actions/auth.actions';
import * as AuthSelectors from '../../../store/auth/selectors/auth.selectors';

describe('LoginComponent', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;
  let store: any;
  let router: any;

  const mockStore = {
    select: jasmine.createSpy('select').and.returnValue(of(false)),
    dispatch: jasmine.createSpy('dispatch')
  };

  const mockRouter = {
    navigate: jasmine.createSpy('navigate')
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LoginComponent, ReactiveFormsModule],
      providers: [
        FormBuilder,
        { provide: Store, useValue: mockStore },
        { provide: Router, useValue: mockRouter }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    store = TestBed.inject(Store);
    router = TestBed.inject(Router);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize the form with empty fields', () => {
    expect(component.loginForm.get('email')?.value).toBe('');
    expect(component.loginForm.get('password')?.value).toBe('');
  });

  it('should validate email field as required', () => {
    const emailControl = component.loginForm.get('email');
    emailControl?.setValue('');
    expect(emailControl?.valid).toBeFalsy();
    expect(emailControl?.errors?.['required']).toBeTruthy();
  });

  it('should validate email field format', () => {
    const emailControl = component.loginForm.get('email');
    emailControl?.setValue('invalid-email');
    expect(emailControl?.valid).toBeFalsy();
    expect(emailControl?.errors?.['email']).toBeTruthy();
  });

  it('should validate password field as required', () => {
    const passwordControl = component.loginForm.get('password');
    passwordControl?.setValue('');
    expect(passwordControl?.valid).toBeFalsy();
    expect(passwordControl?.errors?.['required']).toBeTruthy();
  });

  it('should validate password field minimum length', () => {
    const passwordControl = component.loginForm.get('password');
    passwordControl?.setValue('123');
    expect(passwordControl?.valid).toBeFalsy();
    expect(passwordControl?.errors?.['minlength']).toBeTruthy();
  });

  it('should dispatch login action on valid form submission', () => {
    component.loginForm.setValue({
      email: 'test@example.com',
      password: 'password123'
    });

    component.onSubmit();

    expect(store.dispatch).toHaveBeenCalledWith(
      AuthActions.login({ email: 'test@example.com', password: 'password123' })
    );
  });

  it('should not dispatch login action on invalid form submission', () => {
    component.loginForm.setValue({
      email: '',
      password: ''
    });

    component.onSubmit();

    expect(store.dispatch).not.toHaveBeenCalled();
  });

  it('should navigate to signup page', () => {
    component.navigateToSignup();
    expect(router.navigate).toHaveBeenCalledWith(['/auth/signup']);
  });

  it('should navigate to forgot password page', () => {
    component.navigateToForgotPassword();
    expect(router.navigate).toHaveBeenCalledWith(['/auth/forgot-password']);
  });
});