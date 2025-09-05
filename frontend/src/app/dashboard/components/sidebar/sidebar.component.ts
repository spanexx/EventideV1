import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-dashboard-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, MatListModule, MatIconModule],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss'
})
export class DashboardSidebarComponent {
  menuItems = [
    { name: 'Overview', path: '/dashboard/overview', icon: 'dashboard' },
    { name: 'Availability', path: '/dashboard/availability', icon: 'calendar_today' },
    { name: 'Bookings', path: '/dashboard/bookings', icon: 'event' },
    { name: 'Analytics', path: '/dashboard/analytics/dashboard', icon: 'analytics' },
    { name: 'Reports', path: '/dashboard/analytics/reports', icon: 'description' },
    { name: 'Settings', path: '/dashboard/settings', icon: 'settings' }
  ];
}
