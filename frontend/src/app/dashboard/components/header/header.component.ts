import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { User } from '../../../services/auth.service';
import * as AuthActions from '../../../auth/store/auth';
import * as AuthSelectors from '../../../auth/store/auth';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-dashboard-header',
  standalone: true,
  imports: [CommonModule, RouterModule, MatToolbarModule, MatIconModule, MatMenuModule, MatButtonModule],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss'
})
export class DashboardHeaderComponent implements OnInit {
  @Output() toggleSidebar = new EventEmitter<void>();

  user$: Observable<User | null>;
  isAuthenticated$: Observable<boolean>;
  
  constructor(private store: Store) {
    this.user$ = this.store.select(AuthSelectors.selectUser);
    this.isAuthenticated$ = this.store.select(AuthSelectors.selectIsAuthenticated);
  }

  ngOnInit(): void {
  }
  
  logout(): void {
    this.store.dispatch(AuthActions.logout());
  }

  onToggleSidebar(): void {
    this.toggleSidebar.emit();
  }
}
