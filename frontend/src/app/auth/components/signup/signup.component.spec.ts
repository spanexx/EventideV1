import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SignupComponent } from './signup.component';
import { Store } from '@ngrx/store';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { of } from 'rxjs';

describe('SignupComponent', () => {
  let component: SignupComponent;
  let fixture: ComponentFixture<SignupComponent>;
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
      imports: [SignupComponent, ReactiveFormsModule],
      providers: [
        FormBuilder,
        { provide: Store, useValue: mockStore },
        { provide: Router, useValue: mockRouter }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(SignupComponent);
    component = fixture.componentInstance;
    store = TestBed.inject(Store);
    router = TestBed.inject(Router);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize the form with empty fields', () => {
    expect(component.signupForm.get('email')?.value).toBe('');
    expect(component.signupForm.get('password')?.value).toBe('');
    expect(component.signupForm.get('confirmPassword')?.value).toBe('');
  });

  it('should validate email field as required', () => {
    const emailControl = component.signupForm.get('email');
    emailControl?.setValue('');
    expect(emailControl?.valid).toBeFalsy();
    expect(emailControl?.errors?.['required']).toBeTruthy();
  });

  it('should validate email field format', () => {
    const emailControl = component.signupForm.get('email');
    emailControl?.setValue('invalid-email');
    expect(emailControl?.valid).toBeFalsy();
    expect(emailControl?.errors?.['email']).toBeTruthy();
  });

  it('should validate password field as required', () => {
    const passwordControl = component.signupForm.get('password');
    passwordControl?.setValue('');
    expect(passwordControl?.valid).toBeFalsy();
    expect(passwordControl?.errors?.['required']).toBeTruthy();
  });

  it('should validate password field minimum length', () => {
    const passwordControl = component.signupForm.get('password');
    passwordControl?.setValue('123');
    expect(passwordControl?.valid).toBeFalsy();
    expect(passwordControl?.errors?.['minlength']).toBeTruthy();
  });

  it('should validate confirmPassword field as required', () => {
    const confirmPasswordControl = component.signupForm.get('confirmPassword');
    confirmPasswordControl?.setValue('');
    expect(confirmPasswordControl?.valid).toBeFalsy();
    expect(confirmPasswordControl?.errors?.['required']).toBeTruthy();
  });

  it('should validate password match', () => {
    component.signupForm.setValue({
      email: 'test@example.com',
      password: 'password123',
      confirmPassword: 'differentpassword'
    });

    expect(component.signupForm.valid).toBeFalsy();
    expect(component.signupForm.get('confirmPassword')?.errors?.['passwordMismatch']).toBeTruthy();
  });

  it('should navigate to login page', () => {
    component.navigateToLogin();
    expect(router.navigate).toHaveBeenCalledWith(['/auth/login']);
  });
});