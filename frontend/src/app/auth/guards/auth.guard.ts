import { Injectable, inject } from '@angular/core';
import { CanActivate, Router, UrlTree } from '@angular/router';
import { Store } from '@ngrx/store';
import { Observable, map, take } from 'rxjs';
import * as AuthSelectors from '../store/auth';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  private store = inject(Store);
  private router = inject(Router);

  canActivate(): Observable<boolean | UrlTree> {
    return this.store.select(AuthSelectors.selectIsAuthenticated).pipe(
      take(1),
      map(isAuthenticated => {
        if (isAuthenticated) {
          return true;
        } else {
          // Redirect to login page if not authenticated
          return this.router.createUrlTree(['/auth/login']);
        }
      })
    );
  }
}