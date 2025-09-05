import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ResetPasswordComponent } from './reset-password.component';
import { Store } from '@ngrx/store';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';
import * as AuthActions from '../../../store/auth/actions/auth.actions';

describe('ResetPasswordComponent', () => {
  let component: ResetPasswordComponent;
  let fixture: ComponentFixture<ResetPasswordComponent>;
  let store: any;
  let router: any;

  const mockStore = {
    select: jasmine.createSpy('select').and.returnValue(of(false)),
    dispatch: jasmine.createSpy('dispatch')
  };

  const mockRouter = {
    navigate: jasmine.createSpy('navigate')
  };

  const mockActivatedRoute = {
    snapshot: {
      queryParams: {
        token: 'test-token'
      }
    }
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ResetPasswordComponent, ReactiveFormsModule],
      providers: [
        FormBuilder,
        { provide: Store, useValue: mockStore },
        { provide: Router, useValue: mockRouter },
        { provide: ActivatedRoute, useValue: mockActivatedRoute }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ResetPasswordComponent);
    component = fixture.componentInstance;
    store = TestBed.inject(Store);
    router = TestBed.inject(Router);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize the form with empty fields', () => {
    expect(component.resetPasswordForm.get('newPassword')?.value).toBe('');
    expect(component.resetPasswordForm.get('confirmPassword')?.value).toBe('');
  });

  it('should validate newPassword field as required', () => {
    const passwordControl = component.resetPasswordForm.get('newPassword');
    passwordControl?.setValue('');
    expect(passwordControl?.valid).toBeFalsy();
    expect(passwordControl?.errors?.['required']).toBeTruthy();
  });

  it('should validate newPassword field minimum length', () => {
    const passwordControl = component.resetPasswordForm.get('newPassword');
    passwordControl?.setValue('123');
    expect(passwordControl?.valid).toBeFalsy();
    expect(passwordControl?.errors?.['minlength']).toBeTruthy();
  });

  it('should validate confirmPassword field as required', () => {
    const confirmPasswordControl = component.resetPasswordForm.get('confirmPassword');
    confirmPasswordControl?.setValue('');
    expect(confirmPasswordControl?.valid).toBeFalsy();
    expect(confirmPasswordControl?.errors?.['required']).toBeTruthy();
  });

  it('should validate password match', () => {
    component.resetPasswordForm.setValue({
      newPassword: 'password123',
      confirmPassword: 'differentpassword'
    });

    expect(component.resetPasswordForm.valid).toBeFalsy();
    expect(component.resetPasswordForm.get('confirmPassword')?.errors?.['passwordMismatch']).toBeTruthy();
  });

  it('should dispatch resetPassword action on valid form submission', () => {
    component.resetPasswordForm.setValue({
      newPassword: 'newpassword123',
      confirmPassword: 'newpassword123'
    });

    component.onSubmit();

    expect(store.dispatch).toHaveBeenCalledWith(
      AuthActions.resetPassword({ token: 'test-token', newPassword: 'newpassword123' })
    );
  });

  it('should not dispatch resetPassword action on invalid form submission', () => {
    component.resetPasswordForm.setValue({
      newPassword: 'newpassword123',
      confirmPassword: 'differentpassword'
    });

    component.onSubmit();

    expect(store.dispatch).not.toHaveBeenCalled();
  });

  it('should navigate to login page', () => {
    component.navigateToLogin();
    expect(router.navigate).toHaveBeenCalledWith(['/auth/login']);
  });
});