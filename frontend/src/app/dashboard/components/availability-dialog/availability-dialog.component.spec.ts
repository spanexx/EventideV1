import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Store } from '@ngrx/store';
import { of } from 'rxjs';
import { AvailabilityDialogComponent } from './availability-dialog.component';
import { AvailabilityService } from '../../services/availability.service';
import { SnackbarService } from '../../../shared/services/snackbar.service';
import { CommonModule } from '@angular/common';
import { MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { FormsModule } from '@angular/forms';

describe('AvailabilityDialogComponent', () => {
  let component: AvailabilityDialogComponent;
  let fixture: ComponentFixture<AvailabilityDialogComponent>;
  let mockStore: any;
  let mockAvailabilityService: any;
  let mockSnackbarService: any;
  let mockDialogRef: any;

  const mockAvailability = {
    id: '1',
    providerId: 'provider-1',
    type: 'one_off',
    date: new Date('2023-01-01'),
    startTime: new Date('2023-01-01T09:00:00'),
    endTime: new Date('2023-01-01T10:00:00'),
    duration: 60,
    isBooked: false
  };

  const mockDialogData = {
    availability: mockAvailability,
    date: new Date('2023-01-01')
  };

  beforeEach(async () => {
    mockStore = {
      pipe: jasmine.createSpy('pipe').and.returnValue(of({ id: 'provider-1' }))
    };

    mockAvailabilityService = {
      createAllDayAvailability: jasmine.createSpy('createAllDayAvailability').and.returnValue(of([]))
    };

    mockSnackbarService = {
      showError: jasmine.createSpy('showError')
    };

    mockDialogRef = {
      close: jasmine.createSpy('close')
    };

    await TestBed.configureTestingModule({
      imports: [
        CommonModule,
        MatDialogModule,
        MatButtonModule,
        MatFormFieldModule,
        MatInputModule,
        MatIconModule,
        MatCheckboxModule,
        MatSelectModule,
        MatSnackBarModule,
        MatDatepickerModule,
        MatNativeDateModule,
        FormsModule
      ],
      declarations: [AvailabilityDialogComponent],
      providers: [
        { provide: Store, useValue: mockStore },
        { provide: MatDialogRef, useValue: mockDialogRef },
        { provide: MAT_DIALOG_DATA, useValue: mockDialogData },
        { provide: AvailabilityService, useValue: mockAvailabilityService },
        { provide: SnackbarService, useValue: mockSnackbarService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(AvailabilityDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('onNumberOfSlotsChange', () => {
    it('should update numberOfSlots and call updateSlotPreview', () => {
      spyOn(component, 'updateSlotPreview');
      const event = { target: { value: '5' } };
      
      component.onNumberOfSlotsChange(event);
      
      expect(component.numberOfSlots).toBe(5);
      expect(component.updateSlotPreview).toHaveBeenCalled();
    });

    it('should clamp numberOfSlots to minimum of 1', () => {
      spyOn(component, 'updateSlotPreview');
      const event = { target: { value: '0' } };
      
      component.onNumberOfSlotsChange(event);
      
      expect(component.numberOfSlots).toBe(1);
      expect(component.updateSlotPreview).toHaveBeenCalled();
    });

    it('should clamp numberOfSlots to maximum of 24', () => {
      spyOn(component, 'updateSlotPreview');
      const event = { target: { value: '30' } };
      
      component.onNumberOfSlotsChange(event);
      
      expect(component.numberOfSlots).toBe(24);
      expect(component.updateSlotPreview).toHaveBeenCalled();
    });
  });

  describe('onAutoDistributeChange', () => {
    it('should update autoDistribute and call updateSlotPreview', () => {
      spyOn(component, 'updateSlotPreview');
      const event = { checked: false };
      
      component.onAutoDistributeChange(event);
      
      expect(component.autoDistribute).toBe(false);
      expect(component.updateSlotPreview).toHaveBeenCalled();
    });
  });

  describe('calculateEvenDistribution', () => {
    it('should calculate evenly distributed slots', () => {
      component.numberOfSlots = 2;
      component.data.date = new Date('2023-01-01');
      
      const result = component.calculateEvenDistribution();
      
      expect(result.length).toBe(2);
      expect(result[0].startTime.getHours()).toBe(8);
      expect(result[0].endTime.getHours()).toBeGreaterThan(8);
      expect(result[1].startTime.getTime()).toBeGreaterThan(result[0].endTime.getTime());
    });

    it('should adjust number of slots if duration is too small', () => {
      component.numberOfSlots = 100; // Too many slots for a day
      component.data.date = new Date('2023-01-01');
      
      const result = component.calculateEvenDistribution();
      
      // Should have been adjusted to a reasonable number
      expect(result.length).toBeLessThan(25);
      expect(result.length).toBeGreaterThan(0);
    });
  });

  describe('createAllDaySlots', () => {
    it('should call the availability service and close the dialog on success', () => {
      const mockSlots = [mockAvailability];
      mockAvailabilityService.createAllDayAvailability.and.returnValue(of(mockSlots));
      
      component.createAllDaySlots('provider-1');
      
      expect(mockAvailabilityService.createAllDayAvailability).toHaveBeenCalled();
      expect(mockDialogRef.close).toHaveBeenCalledWith(mockSlots);
    });

    it('should show error message on failure', () => {
      const error = new Error('Test error');
      mockAvailabilityService.createAllDayAvailability.and.returnValue(
        jasmine.createSpyObj('Observable', ['subscribe']).and.callFake((observers: any) => {
          observers.error(error);
          return { unsubscribe: () => {} };
        })
      );
      
      component.createAllDaySlots('provider-1');
      
      expect(mockSnackbarService.showError).toHaveBeenCalledWith('Failed to create all-day slots: Test error');
    });
  });
});