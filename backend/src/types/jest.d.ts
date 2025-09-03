import 'jest';

declare global {
  namespace jest {
    interface Matchers<R> {
      toBe(expected: unknown): R;
      toEqual(expected: unknown): R;
      toBeDefined(): R;
      toBeNull(): R;
      toHaveBeenCalled(): R;
      toHaveBeenCalledWith(...args: any[]): R;
      toHaveProperty(property: string): R;
      toThrow(error?: string | Error | RegExp): R;
      stringMatching(expected: string | RegExp): any;
      resolves: jest.Matchers<Promise<R>>;
      rejects: jest.Matchers<Promise<R>>;
    }
  }
}

// Add Jest extensions
declare module 'expect' {
  interface AsymmetricMatchers {
    stringMatching(pattern: string | RegExp): any;
  }
}
