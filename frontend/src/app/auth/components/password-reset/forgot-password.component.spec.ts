import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ForgotPasswordComponent } from './forgot-password.component';
import { Store } from '@ngrx/store';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { of } from 'rxjs';
import * as AuthActions from '../../../store/auth/actions/auth.actions';

describe('ForgotPasswordComponent', () => {
  let component: ForgotPasswordComponent;
  let fixture: ComponentFixture<ForgotPasswordComponent>;
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
      imports: [ForgotPasswordComponent, ReactiveFormsModule],
      providers: [
        FormBuilder,
        { provide: Store, useValue: mockStore },
        { provide: Router, useValue: mockRouter }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ForgotPasswordComponent);
    component = fixture.componentInstance;
    store = TestBed.inject(Store);
    router = TestBed.inject(Router);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize the form with empty email field', () => {
    expect(component.forgotPasswordForm.get('email')?.value).toBe('');
  });

  it('should validate email field as required', () => {
    const emailControl = component.forgotPasswordForm.get('email');
    emailControl?.setValue('');
    expect(emailControl?.valid).toBeFalsy();
    expect(emailControl?.errors?.['required']).toBeTruthy();
  });

  it('should validate email field format', () => {
    const emailControl = component.forgotPasswordForm.get('email');
    emailControl?.setValue('invalid-email');
    expect(emailControl?.valid).toBeFalsy();
    expect(emailControl?.errors?.['email']).toBeTruthy();
  });

  it('should dispatch forgotPassword action on valid form submission', () => {
    component.forgotPasswordForm.setValue({
      email: 'test@example.com'
    });

    component.onSubmit();

    expect(store.dispatch).toHaveBeenCalledWith(
      AuthActions.forgotPassword({ email: 'test@example.com' })
    );
  });

  it('should not dispatch forgotPassword action on invalid form submission', () => {
    component.forgotPasswordForm.setValue({
      email: ''
    });

    component.onSubmit();

    expect(store.dispatch).not.toHaveBeenCalled();
  });

  it('should navigate to login page', () => {
    component.navigateToLogin();
    expect(router.navigate).toHaveBeenCalledWith(['/auth/login']);
  });
});