import { ComponentFixture, TestBed } from '@angular/core/testing';
import { GoogleLoginComponent } from './google-login.component';
import { Store } from '@ngrx/store';
import { Router, ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';
import { AuthService } from '../../../services/auth.service';
import * as AuthActions from '../../../store/auth/actions/auth.actions';

describe('GoogleLoginComponent', () => {
  let component: GoogleLoginComponent;
  let fixture: ComponentFixture<GoogleLoginComponent>;
  let store: any;
  let router: any;
  let authService: any;

  const mockStore = {
    select: jasmine.createSpy('select').and.returnValue(of(false)),
    dispatch: jasmine.createSpy('dispatch')
  };

  const mockRouter = {
    navigate: jasmine.createSpy('navigate')
  };

  const mockAuthService = {
    handleGoogleCallback: jasmine.createSpy('handleGoogleCallback')
  };

  const mockActivatedRoute = {
    snapshot: {
      queryParams: {}
    }
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GoogleLoginComponent],
      providers: [
        { provide: Store, useValue: mockStore },
        { provide: Router, useValue: mockRouter },
        { provide: ActivatedRoute, useValue: mockActivatedRoute },
        { provide: AuthService, useValue: mockAuthService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(GoogleLoginComponent);
    component = fixture.componentInstance;
    store = TestBed.inject(Store);
    router = TestBed.inject(Router);
    authService = TestBed.inject(AuthService);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should navigate to login if no token or error', () => {
    expect(router.navigate).toHaveBeenCalledWith(['/auth/login']);
  });

  it('should handle successful Google login', () => {
    // Create a new component instance with token params
    const mockActivatedRouteWithToken = {
      snapshot: {
        queryParams: {
          access_token: 'test-token',
          user: 'test-user-data'
        }
      }
    };

    TestBed.overrideProvider(ActivatedRoute, { useValue: mockActivatedRouteWithToken });
    const fixtureWithToken = TestBed.createComponent(GoogleLoginComponent);
    const componentWithToken = fixtureWithToken.componentInstance;

    expect(authService.handleGoogleCallback).toHaveBeenCalledWith('test-token', 'test-user-data');
    expect(router.navigate).toHaveBeenCalledWith(['/dashboard']);
  });

  it('should handle Google login error', () => {
    // Create a new component instance with error params
    const mockActivatedRouteWithError = {
      snapshot: {
        queryParams: {
          error: 'google_auth_failed'
        }
      }
    };

    TestBed.overrideProvider(ActivatedRoute, { useValue: mockActivatedRouteWithError });
    TestBed.createComponent(GoogleLoginComponent);

    expect(store.dispatch).toHaveBeenCalledWith(
      AuthActions.googleLoginFailure({ error: 'google_auth_failed' })
    );
  });
});