import { Injectable, Logger } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';

export interface Session {
  id: string;
  userId: string;
  createdAt: Date;
  expiresAt: Date;
  ipAddress?: string;
  userAgent?: string;
}

@Injectable()
export class SessionService {
  private readonly logger = new Logger(SessionService.name);
  private readonly sessions: Map<string, Session> = new Map();
  private readonly userSessions: Map<string, string[]> = new Map(); // userId -> sessionIds

  createSession(
    userId: string,
    ipAddress?: string,
    userAgent?: string,
    ttl: number = 3600000, // 1 hour default
  ): Session {
    const sessionId = uuidv4();
    const createdAt = new Date();
    const expiresAt = new Date(createdAt.getTime() + ttl);

    const session: Session = {
      id: sessionId,
      userId,
      createdAt,
      expiresAt,
      ipAddress,
      userAgent,
    };

    // Store the session
    this.sessions.set(sessionId, session);

    // Track user sessions
    if (!this.userSessions.has(userId)) {
      this.userSessions.set(userId, []);
    }
    this.userSessions.get(userId)!.push(sessionId);

    this.logger.log(`Created session ${sessionId} for user ${userId}`);

    return session;
  }

  getSession(sessionId: string): Session | null {
    const session = this.sessions.get(sessionId);

    if (!session) {
      return null;
    }

    // Check if session has expired
    if (session.expiresAt < new Date()) {
      this.destroySession(sessionId);
      return null;
    }

    return session;
  }

  destroySession(sessionId: string): boolean {
    const session = this.sessions.get(sessionId);

    if (!session) {
      return false;
    }

    // Remove from user sessions tracking
    const userSessionIds = this.userSessions.get(session.userId);
    if (userSessionIds) {
      const index = userSessionIds.indexOf(sessionId);
      if (index > -1) {
        userSessionIds.splice(index, 1);
      }
    }

    // Remove the session
    this.sessions.delete(sessionId);
    this.logger.log(
      `Destroyed session ${sessionId} for user ${session.userId}`,
    );

    return true;
  }

  destroyUserSessions(userId: string): number {
    const sessionIds = this.userSessions.get(userId) || [];
    let count = 0;

    for (const sessionId of sessionIds) {
      if (this.sessions.has(sessionId)) {
        this.sessions.delete(sessionId);
        count++;
      }
    }

    // Clear the user's session list
    this.userSessions.delete(userId);

    this.logger.log(`Destroyed ${count} sessions for user ${userId}`);

    return count;
  }

  getUserSessions(userId: string): Session[] {
    const sessionIds = this.userSessions.get(userId) || [];
    const sessions: Session[] = [];

    for (const sessionId of sessionIds) {
      const session = this.getSession(sessionId);
      if (session) {
        sessions.push(session);
      }
    }

    return sessions;
  }

  cleanupExpiredSessions(): number {
    const now = new Date();
    let count = 0;

    for (const [sessionId, session] of this.sessions.entries()) {
      if (session.expiresAt < now) {
        this.destroySession(sessionId);
        count++;
      }
    }

    return count;
  }

  getSessionCount(): number {
    return this.sessions.size;
  }

  getUserSessionCount(userId: string): number {
    return this.userSessions.get(userId)?.length || 0;
  }
}
