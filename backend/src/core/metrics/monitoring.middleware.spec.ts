import { MonitoringMiddleware } from './monitoring.middleware';
import { MetricsService } from './metrics.service';
import { Request, Response } from 'express';

describe('MonitoringMiddleware', () => {
  let middleware: MonitoringMiddleware;
  let metricsService: jest.Mocked<MetricsService>;
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: jest.Mock;

  beforeEach(() => {
    metricsService = {
      incrementConnection: jest.fn(),
      decrementConnection: jest.fn(),
      recordHttpRequest: jest.fn(),
    } as any;

    middleware = new MonitoringMiddleware(metricsService);

    req = {
      method: 'GET',
      originalUrl: '/test',
    };

    res = {
      on: jest.fn(),
      statusCode: 200,
    };

    next = jest.fn();
  });

  it('should be defined', () => {
    expect(middleware).toBeDefined();
  });

  it('should call next function', () => {
    (res.on as jest.Mock).mockImplementation((event, callback) => {
      if (event === 'finish') {
        callback();
      }
    });

    middleware.use(req as Request, res as Response, next);

    expect(next).toHaveBeenCalled();
  });

  it('should increment connection count on request', () => {
    (res.on as jest.Mock).mockImplementation((event, callback) => {
      if (event === 'finish') {
        callback();
      }
    });

    middleware.use(req as Request, res as Response, next);

    expect(metricsService.incrementConnection).toHaveBeenCalled();
  });

  it('should record metrics on response finish', () => {
    let finishCallback: Function | undefined;

    (res.on as jest.Mock).mockImplementation((event, callback) => {
      if (event === 'finish') {
        finishCallback = callback;
      }
    });

    middleware.use(req as Request, res as Response, next);

    // Simulate response finish
    if (finishCallback) {
      finishCallback();
    }

    expect(metricsService.decrementConnection).toHaveBeenCalled();
    expect(metricsService.recordHttpRequest).toHaveBeenCalled();
  });

  it('should decrement connection count on response close', () => {
    let closeCallback: Function | undefined;

    (res.on as jest.Mock).mockImplementation((event, callback) => {
      if (event === 'close') {
        closeCallback = callback;
      }
      if (event === 'finish') {
        // Don't call finish callback in this test
      }
    });

    middleware.use(req as Request, res as Response, next);

    // Simulate response close
    if (closeCallback) {
      closeCallback();
    }

    expect(metricsService.decrementConnection).toHaveBeenCalled();
  });
});
