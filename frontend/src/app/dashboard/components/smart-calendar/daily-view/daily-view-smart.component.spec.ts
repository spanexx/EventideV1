import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DailyViewSmartComponent } from './daily-view-smart.component';

describe('DailyViewSmartComponent', () => {
  let component: DailyViewSmartComponent;
  let fixture: ComponentFixture<DailyViewSmartComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DailyViewSmartComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DailyViewSmartComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});