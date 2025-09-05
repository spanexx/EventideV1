import { ComponentFixture, TestBed } from '@angular/core/testing';
import { GuestSidebarComponent } from './sidebar.component';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';

describe('GuestSidebarComponent', () => {
  let component: GuestSidebarComponent;
  let fixture: ComponentFixture<GuestSidebarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        CommonModule,
        MatSidenavModule,
        MatListModule,
        MatIconModule,
        RouterModule.forRoot([]),
        GuestSidebarComponent
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(GuestSidebarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have isOpen input property', () => {
    component.isOpen = true;
    expect(component.isOpen).toBe(true);
  });
});