import { HttpInterceptorFn, HttpResponse } from '@angular/common/http';
import { map } from 'rxjs/operators';
import { Observable } from 'rxjs';

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string;
  meta: {
    timestamp: string;
    statusCode: number;
  };
}

export const responseInterceptor: HttpInterceptorFn = (req, next) => {
  return next(req).pipe(
    map((event) => {
      if (event instanceof HttpResponse) {
        // If response has the wrapper format, unwrap it
        if (
          event.body &&
          typeof event.body === 'object' &&
          'success' in event.body &&
          'data' in event.body
        ) {
          // Clone the response with unwrapped data
          return event.clone({
            body: event.body.data
          });
        }
      }
      // Return event as is if not wrapped or not HttpResponse
      return event;
    })
  );
};