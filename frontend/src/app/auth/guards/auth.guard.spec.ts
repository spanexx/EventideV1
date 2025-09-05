import { TestBed } from '@angular/core/testing';
import { AuthGuard } from './auth.guard';
import { Store } from '@ngrx/store';
import { Router } from '@angular/router';
import { of } from 'rxjs';
import { RouterTestingModule } from '@angular/router/testing';

describe('AuthGuard', () => {
  let guard: AuthGuard;
  let store: any;
  let router: any;

  const mockStore = {
    select: jasmine.createSpy('select')
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [RouterTestingModule],
      providers: [
        AuthGuard,
        { provide: Store, useValue: mockStore },
        Router
      ]
    });
    guard = TestBed.inject(AuthGuard);
    store = TestBed.inject(Store);
    router = TestBed.inject(Router);
  });

  it('should be created', () => {
    expect(guard).toBeTruthy();
  });

  it('should allow activation when user is authenticated', (done) => {
    store.select.and.returnValue(of(true));
    
    guard.canActivate().subscribe(result => {
      expect(result).toBe(true);
      done();
    });
  });

  it('should redirect to login when user is not authenticated', (done) => {
    store.select.and.returnValue(of(false));
    
    guard.canActivate().subscribe(result => {
      expect(result.toString()).toContain('/auth/login');
      done();
    });
  });
});