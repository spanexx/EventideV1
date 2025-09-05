import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ProfileComponent } from './profile.component';
import { Store } from '@ngrx/store';
import { of } from 'rxjs';
import { FormBuilder } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

describe('ProfileComponent', () => {
  let component: ProfileComponent;
  let fixture: ComponentFixture<ProfileComponent>;
  let mockStore: any;

  beforeEach(async () => {
    mockStore = {
      pipe: jasmine.createSpy('pipe').and.returnValue(of(null)),
      dispatch: jasmine.createSpy('dispatch')
    };

    await TestBed.configureTestingModule({
      imports: [
        CommonModule,
        ReactiveFormsModule,
        NoopAnimationsModule,
        MatCardModule,
        MatFormFieldModule,
        MatInputModule,
        MatButtonModule,
        MatCheckboxModule,
        MatProgressSpinnerModule,
        ProfileComponent
      ],
      providers: [
        { provide: Store, useValue: mockStore },
        FormBuilder
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ProfileComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should dispatch loadProfile action on init', () => {
    expect(mockStore.dispatch).toHaveBeenCalledWith(
      jasmine.objectContaining({
        type: '[Guest Dashboard] Load Profile'
      })
    );
  });

  it('should have valid profile form', () => {
    expect(component.profileForm.valid).toBeFalsy(); // Empty form should be invalid
  });

  it('should have valid preferences form', () => {
    expect(component.preferencesForm.valid).toBeTruthy(); // Default preferences form should be valid
  });

  it('should dispatch updateProfile action when valid profile form is submitted', () => {
    // Set valid values
    component.profileForm.controls['name'].setValue('John Doe');
    component.profileForm.controls['email'].setValue('john.doe@example.com');
    
    component.onSubmitProfile();
    
    expect(mockStore.dispatch).toHaveBeenCalledWith(
      jasmine.objectContaining({
        type: '[Guest Dashboard] Update Profile'
      })
    );
  });

  it('should not dispatch updateProfile action when invalid profile form is submitted', () => {
    // Reset the dispatch spy
    mockStore.dispatch.calls.reset();
    
    // Don't set required values, form should be invalid
    component.onSubmitProfile();
    
    expect(mockStore.dispatch).not.toHaveBeenCalled();
  });
});