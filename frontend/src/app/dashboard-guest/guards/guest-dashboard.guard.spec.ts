import { TestBed } from '@angular/core/testing';
import { GuestDashboardGuard } from './guest-dashboard.guard';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';
import { of } from 'rxjs';

describe('GuestDashboardGuard', () => {
  let guard: GuestDashboardGuard;
  let mockAuthService: any;
  let mockRouter: any;

  beforeEach(() => {
    mockAuthService = {
      isAuthenticated$: of(true)
    };

    mockRouter = {
      navigate: jasmine.createSpy('navigate')
    };

    TestBed.configureTestingModule({
      providers: [
        GuestDashboardGuard,
        { provide: AuthService, useValue: mockAuthService },
        { provide: Router, useValue: mockRouter }
      ]
    });
    guard = TestBed.inject(GuestDashboardGuard);
  });

  it('should be created', () => {
    expect(guard).toBeTruthy();
  });

  it('should allow activation when user is authenticated', (done) => {
    mockAuthService.isAuthenticated$ = of(true);
    
    guard.canActivate().subscribe(result => {
      expect(result).toBe(true);
      expect(mockRouter.navigate).not.toHaveBeenCalled();
      done();
    });
  });

  it('should not allow activation and redirect when user is not authenticated', (done) => {
    mockAuthService.isAuthenticated$ = of(false);
    
    guard.canActivate().subscribe(result => {
      expect(result).toBe(false);
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/auth/login']);
      done();
    });
  });
});