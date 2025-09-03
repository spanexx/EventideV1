import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext } from '@nestjs/common';
import { UserPreferenceResolver } from './user-preference.resolver';
import { UsersService } from '../../modules/users/users.service';

describe('UserPreferenceResolver', () => {
  let resolver: UserPreferenceResolver;
  let usersService: jest.Mocked<UsersService>;

  beforeEach(async () => {
    const mockUsersService = {
      findById: jest.fn(),
      getUserPreferences: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserPreferenceResolver,
        { provide: UsersService, useValue: mockUsersService },
      ],
    }).compile();

    resolver = module.get<UserPreferenceResolver>(UserPreferenceResolver);
    usersService = module.get(UsersService);
  });

  it('should be defined', () => {
    expect(resolver).toBeDefined();
  });

  describe('resolve', () => {
    it('should return user language preference when user exists', async () => {
      const mockContext = createMockExecutionContext({
        headers: { 'x-user-id': 'user123' },
      });

      const mockUser = {
        id: 'user123',
        preferences: { language: 'es' },
      };

      usersService.findById.mockResolvedValue(mockUser as any);

      const result = await resolver.resolve(mockContext);

      expect(result).toBe('es');
      expect(usersService.findById).toHaveBeenCalledWith('user123');
    });

    it('should return undefined when no user ID in headers', async () => {
      const mockContext = createMockExecutionContext({
        headers: {},
      });

      const result = await resolver.resolve(mockContext);

      expect(result).toBeUndefined();
      expect(usersService.findById).not.toHaveBeenCalled();
    });

    it('should return undefined when user not found', async () => {
      const mockContext = createMockExecutionContext({
        headers: { 'x-user-id': 'nonexistent' },
      });

      usersService.findById.mockResolvedValue(null);

      const result = await resolver.resolve(mockContext);

      expect(result).toBeUndefined();
      expect(usersService.findById).toHaveBeenCalledWith('nonexistent');
    });

    it('should return undefined when user has no preferences', async () => {
      const mockContext = createMockExecutionContext({
        headers: { 'x-user-id': 'user123' },
      });

      const mockUser = {
        id: 'user123',
        preferences: null,
      };

      usersService.findById.mockResolvedValue(mockUser as any);

      const result = await resolver.resolve(mockContext);

      expect(result).toBeUndefined();
    });

    it('should return undefined when user preferences have no language', async () => {
      const mockContext = createMockExecutionContext({
        headers: { 'x-user-id': 'user123' },
      });

      const mockUser = {
        id: 'user123',
        preferences: { theme: 'dark' },
      };

      usersService.findById.mockResolvedValue(mockUser as any);

      const result = await resolver.resolve(mockContext);

      expect(result).toBeUndefined();
    });

    it('should handle service errors gracefully', async () => {
      const mockContext = createMockExecutionContext({
        headers: { 'x-user-id': 'user123' },
      });

      usersService.findById.mockRejectedValue(new Error('Database error'));

      const result = await resolver.resolve(mockContext);

      expect(result).toBeUndefined();
    });

    it('should handle different supported languages', async () => {
      const supportedLanguages = [
        'en',
        'es',
        'fr',
        'de',
        'it',
        'pt',
        'zh',
        'ja',
        'ko',
      ];

      for (const language of supportedLanguages) {
        const mockContext = createMockExecutionContext({
          headers: { 'x-user-id': `user-${language}` },
        });

        const mockUser = {
          id: `user-${language}`,
          preferences: { language },
        };

        usersService.findById.mockResolvedValue(mockUser as any);

        const result = await resolver.resolve(mockContext);

        expect(result).toBe(language);
      }
    });

    it('should handle case-sensitive language codes', async () => {
      const mockContext = createMockExecutionContext({
        headers: { 'x-user-id': 'user123' },
      });

      const mockUser = {
        id: 'user123',
        preferences: { language: 'EN' }, // uppercase
      };

      usersService.findById.mockResolvedValue(mockUser as any);

      const result = await resolver.resolve(mockContext);

      expect(result).toBe('EN');
    });

    it('should handle numeric user IDs', async () => {
      const mockContext = createMockExecutionContext({
        headers: { 'x-user-id': '12345' },
      });

      const mockUser = {
        id: '12345',
        preferences: { language: 'fr' },
      };

      usersService.findById.mockResolvedValue(mockUser as any);

      const result = await resolver.resolve(mockContext);

      expect(result).toBe('fr');
      expect(usersService.findById).toHaveBeenCalledWith('12345');
    });
  });

  describe('integration with i18n module', () => {
    it('should work with i18n resolver chain', async () => {
      // Test multiple calls as would happen in i18n resolution
      const mockContext1 = createMockExecutionContext({
        headers: { 'x-user-id': 'user1' },
      });
      const mockContext2 = createMockExecutionContext({
        headers: { 'x-user-id': 'user2' },
      });

      usersService.findById
        .mockResolvedValueOnce({
          id: 'user1',
          preferences: { language: 'es' },
        } as any)
        .mockResolvedValueOnce({
          id: 'user2',
          preferences: { language: 'fr' },
        } as any);

      const result1 = await resolver.resolve(mockContext1);
      const result2 = await resolver.resolve(mockContext2);

      expect(result1).toBe('es');
      expect(result2).toBe('fr');
    });
  });

  describe('error scenarios', () => {
    it('should handle malformed user preferences', async () => {
      const mockContext = createMockExecutionContext({
        headers: { 'x-user-id': 'user123' },
      });

      const mockUser = {
        id: 'user123',
        preferences: 'invalid-preferences', // not an object
      };

      usersService.findById.mockResolvedValue(mockUser as any);

      const result = await resolver.resolve(mockContext);

      expect(result).toBeUndefined();
    });

    it('should handle null language in preferences', async () => {
      const mockContext = createMockExecutionContext({
        headers: { 'x-user-id': 'user123' },
      });

      const mockUser = {
        id: 'user123',
        preferences: { language: null },
      };

      usersService.findById.mockResolvedValue(mockUser as any);

      const result = await resolver.resolve(mockContext);

      expect(result).toBeUndefined();
    });

    it('should handle empty string language', async () => {
      const mockContext = createMockExecutionContext({
        headers: { 'x-user-id': 'user123' },
      });

      const mockUser = {
        id: 'user123',
        preferences: { language: '' },
      };

      usersService.findById.mockResolvedValue(mockUser as any);

      const result = await resolver.resolve(mockContext);

      expect(result).toBeUndefined();
    });
  });
});

// Helper function to create mock execution context
function createMockExecutionContext(requestData: any): ExecutionContext {
  return {
    switchToHttp: () => ({
      getRequest: () => requestData,
      getResponse: () => ({}),
      getNext: () => ({}),
    }),
    getArgs: () => [],
    getArgByIndex: () => ({}),
    switchToRpc: () => ({
      getData: () => ({}),
      getContext: () => ({}),
    }),
    switchToWs: () => ({
      getData: () => ({}),
      getClient: () => ({}),
    }),
    getType: () => 'http' as any,
    getClass: () => ({}),
    getHandler: () => ({}),
  } as ExecutionContext;
}
