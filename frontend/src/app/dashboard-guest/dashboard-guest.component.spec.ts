import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DashboardGuestComponent } from './dashboard-guest.component';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { GuestHeaderComponent } from './components/header/header.component';
import { GuestSidebarComponent } from './components/sidebar/sidebar.component';

describe('DashboardGuestComponent', () => {
  let component: DashboardGuestComponent;
  let fixture: ComponentFixture<DashboardGuestComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        CommonModule,
        RouterModule.forRoot([]),
        DashboardGuestComponent,
        GuestHeaderComponent,
        GuestSidebarComponent
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(DashboardGuestComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have isSidebarOpen property initialized to true', () => {
    expect(component.isSidebarOpen).toBe(true);
  });

  it('should toggle isSidebarOpen when toggleSidebar is called', () => {
    const initialValue = component.isSidebarOpen;
    component.toggleSidebar();
    expect(component.isSidebarOpen).toBe(!initialValue);
  });
});