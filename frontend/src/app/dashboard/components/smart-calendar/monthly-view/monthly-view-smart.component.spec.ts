import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MonthlyViewSmartComponent } from './monthly-view-smart.component';

describe('MonthlyViewSmartComponent', () => {
  let component: MonthlyViewSmartComponent;
  let fixture: ComponentFixture<MonthlyViewSmartComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ MonthlyViewSmartComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(MonthlyViewSmartComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});