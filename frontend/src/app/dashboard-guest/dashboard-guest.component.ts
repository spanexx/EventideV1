import { Component, ChangeDetectionStrategy } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { GuestHeaderComponent } from './components/header/header.component';
import { GuestSidebarComponent } from './components/sidebar/sidebar.component';

@Component({
  selector: 'app-dashboard-guest',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    GuestHeaderComponent,
    GuestSidebarComponent
  ],
  templateUrl: './dashboard-guest.component.html',
  styleUrl: './dashboard-guest.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DashboardGuestComponent {
  isSidebarOpen = true;

  toggleSidebar(): void {
    this.isSidebarOpen = !this.isSidebarOpen;
  }
}