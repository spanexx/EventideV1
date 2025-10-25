import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { map, tap } from 'rxjs/operators';
import * as AuthActions from '../actions/auth.actions';
import { AuthService } from '../../../../services/auth.service';
import { RoutePersistenceService } from '../../../../core/services/route-persistence.service';

@Injectable()
export class SessionEffects {
  private actions$ = inject(Actions);
  private authService = inject(AuthService);
  private routePersistence = inject(RoutePersistenceService);

  logout$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(AuthActions.logout),
      tap(() => {
        console.info('[SessionEffects] logout dispatched, calling AuthService.logout');
        this.authService.logout();
        this.routePersistence.clearLastRoute();
        console.info('[SessionEffects] Triggering full app refresh after logout');
        window.location.reload();
      }),
      map(() => {
        console.info('[SessionEffects] logoutSuccess dispatched');
        return AuthActions.logoutSuccess();
      }),
    );
  });
}
