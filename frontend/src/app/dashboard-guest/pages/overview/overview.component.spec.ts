import { ComponentFixture, TestBed } from '@angular/core/testing';
import { OverviewComponent } from './overview.component';
import { Store } from '@ngrx/store';
import { of } from 'rxjs';
import { MatCardModule } from '@angular/material/card';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { CommonModule } from '@angular/common';

describe('OverviewComponent', () => {
  let component: OverviewComponent;
  let fixture: ComponentFixture<OverviewComponent>;
  let mockStore: any;

  beforeEach(async () => {
    mockStore = {
      pipe: jasmine.createSpy('pipe').and.returnValue(of([])),
      dispatch: jasmine.createSpy('dispatch')
    };

    await TestBed.configureTestingModule({
      imports: [
        CommonModule,
        MatCardModule,
        MatGridListModule,
        MatButtonModule,
        MatIconModule,
        MatProgressSpinnerModule,
        OverviewComponent
      ],
      providers: [
        { provide: Store, useValue: mockStore }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(OverviewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should dispatch loadBookings action on init', () => {
    expect(mockStore.dispatch).toHaveBeenCalled();
  });
});