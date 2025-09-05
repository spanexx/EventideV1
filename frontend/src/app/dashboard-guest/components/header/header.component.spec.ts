import { ComponentFixture, TestBed } from '@angular/core/testing';
import { GuestHeaderComponent } from './header.component';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';

describe('GuestHeaderComponent', () => {
  let component: GuestHeaderComponent;
  let fixture: ComponentFixture<GuestHeaderComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        CommonModule,
        MatToolbarModule,
        MatButtonModule,
        MatIconModule,
        GuestHeaderComponent
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(GuestHeaderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should emit toggleSidebar event when onToggleSidebar is called', () => {
    spyOn(component.toggleSidebar, 'emit');
    component.onToggleSidebar();
    expect(component.toggleSidebar.emit).toHaveBeenCalled();
  });
});