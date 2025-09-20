import { Component, OnInit, OnDestroy } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Store } from '@ngrx/store';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import * as DashboardActions from './store/actions/dashboard.actions';
import * as AuthSelectors from '../auth/store/auth';
import { DashboardSocketService } from './services/dashboard-socket.service';
import { DashboardHeaderComponent } from './components/header/header.component';
import { DashboardSidebarComponent } from './components/sidebar/sidebar.component';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    DashboardHeaderComponent,
    DashboardSidebarComponent
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  isSidebarOpen = true;

  constructor(
    private store: Store,
    private socketService: DashboardSocketService
  ) { }

  ngOnInit(): void {
    this.store.dispatch(DashboardActions.loadDashboardStats());
    this.store.dispatch(DashboardActions.loadRecentActivity());

    this.store.select(AuthSelectors.selectUser).pipe(
      takeUntil(this.destroy$)
    ).subscribe(user => {
      if (user && user.id) {
        this.socketService.joinProviderRoom(user.id);
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.socketService.disconnect();
  }

  toggleSidebar(): void {
    this.isSidebarOpen = !this.isSidebarOpen;
  }
}
