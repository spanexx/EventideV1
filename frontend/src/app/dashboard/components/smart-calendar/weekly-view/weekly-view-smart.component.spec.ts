import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WeeklyViewSmartComponent } from './weekly-view-smart.component';

describe('WeeklyViewSmartComponent', () => {
  let component: WeeklyViewSmartComponent;
  let fixture: ComponentFixture<WeeklyViewSmartComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ WeeklyViewSmartComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(WeeklyViewSmartComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});