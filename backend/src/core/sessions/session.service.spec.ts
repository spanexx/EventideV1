import { Test, TestingModule } from '@nestjs/testing';
import { SessionService, Session } from './session.service';

describe('SessionService', () => {
  let service: SessionService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SessionService],
    }).compile();

    service = module.get<SessionService>(SessionService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createSession', () => {
    it('should create a new session', () => {
      const session = service.createSession(
        'user123',
        '127.0.0.1',
        'test-agent',
      );

      expect(session).toBeDefined();
      expect(session.id).toBeDefined();
      expect(session.userId).toBe('user123');
      expect(session.ipAddress).toBe('127.0.0.1');
      expect(session.userAgent).toBe('test-agent');
      expect(session.createdAt).toBeInstanceOf(Date);
      expect(session.expiresAt).toBeInstanceOf(Date);
    });
  });

  describe('getSession', () => {
    it('should retrieve an existing session', () => {
      const createdSession = service.createSession('user123');
      const retrievedSession = service.getSession(createdSession.id);

      expect(retrievedSession).toBeDefined();
      expect(retrievedSession!.id).toBe(createdSession.id);
      expect(retrievedSession!.userId).toBe('user123');
    });

    it('should return null for non-existent session', () => {
      const session = service.getSession('non-existent-id');
      expect(session).toBeNull();
    });

    it('should return null for expired session', () => {
      // Create a session that expires immediately
      const createdSession = service.createSession(
        'user123',
        undefined,
        undefined,
        -1,
      );
      const retrievedSession = service.getSession(createdSession.id);

      expect(retrievedSession).toBeNull();
    });
  });

  describe('destroySession', () => {
    it('should destroy an existing session', () => {
      const session = service.createSession('user123');
      const result = service.destroySession(session.id);

      expect(result).toBe(true);

      // Verify session is gone
      const retrievedSession = service.getSession(session.id);
      expect(retrievedSession).toBeNull();
    });

    it('should return false for non-existent session', () => {
      const result = service.destroySession('non-existent-id');
      expect(result).toBe(false);
    });
  });

  describe('destroyUserSessions', () => {
    it('should destroy all sessions for a user', () => {
      // Create multiple sessions for the same user
      service.createSession('user123');
      service.createSession('user123');
      service.createSession('user123');

      // Create a session for another user
      const otherUserSession = service.createSession('user456');

      // Destroy sessions for user123
      const count = service.destroyUserSessions('user123');

      expect(count).toBe(3);

      // Verify other user's session still exists
      const otherSession = service.getSession(otherUserSession.id);
      expect(otherSession).toBeDefined();
    });
  });

  describe('getUserSessions', () => {
    it('should return all active sessions for a user', () => {
      // Create sessions
      service.createSession('user123');
      service.createSession('user123');
      const expiredSession = service.createSession(
        'user123',
        undefined,
        undefined,
        -1,
      ); // Expired

      const sessions = service.getUserSessions('user123');

      // Should only return 2 active sessions, not the expired one
      expect(sessions).toHaveLength(2);
    });
  });

  describe('cleanupExpiredSessions', () => {
    it('should clean up expired sessions', () => {
      // Create an active session
      const activeSession = service.createSession('user123');

      // Create an expired session
      service.createSession('user456', undefined, undefined, -1);

      // Clean up expired sessions
      const count = service.cleanupExpiredSessions();

      expect(count).toBe(1);

      // Verify active session still exists
      const session = service.getSession(activeSession.id);
      expect(session).toBeDefined();
    });
  });

  describe('getSessionCount', () => {
    it('should return the total number of sessions', () => {
      expect(service.getSessionCount()).toBe(0);

      service.createSession('user123');
      service.createSession('user456');

      expect(service.getSessionCount()).toBe(2);
    });
  });

  describe('getUserSessionCount', () => {
    it('should return the number of sessions for a user', () => {
      expect(service.getUserSessionCount('user123')).toBe(0);

      service.createSession('user123');
      service.createSession('user123');
      service.createSession('user456');

      expect(service.getUserSessionCount('user123')).toBe(2);
      expect(service.getUserSessionCount('user456')).toBe(1);
    });
  });
});
