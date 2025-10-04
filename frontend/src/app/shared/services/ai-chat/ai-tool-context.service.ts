import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { take } from 'rxjs/operators';
import * as AuthSelectors from '../../../auth/store/auth/selectors/auth.selectors';
import { AIConversationContext } from './ai-tool-definitions';

@Injectable({
  providedIn: 'root'
})
export class AIToolContextService {
  private context: AIConversationContext = {
    userId: '',
    currentPage: '',
    currentDate: new Date(),
    recentActions: []
  };

  constructor(
    private store: Store,
    private router: Router
  ) {
    console.log('[AIToolContextService] Constructor called');
    this.initializeContext();
  }

  private initializeContext(): void {
    console.log('[AIToolContextService] Initializing context...');
    
    // Get current user
    this.store.select(AuthSelectors.selectUserId).pipe(take(1)).subscribe(userId => {
      if (userId) {
        console.log('[AIToolContextService] Found user ID:', userId);
        this.context.userId = userId;
      } else {
        console.log('[AIToolContextService] No user ID found');
      }
    });

    // Track current page
    this.context.currentPage = this.router.url;
    console.log('[AIToolContextService] Current page:', this.context.currentPage);
    
    this.router.events.subscribe(() => {
      this.context.currentPage = this.router.url;
      console.log('[AIToolContextService] Page changed to:', this.context.currentPage);
    });
    
    console.log('[AIToolContextService] Context initialized:', this.context);
  }

  getContext(): AIConversationContext {
    return { ...this.context };
  }

  updateContext(updates: Partial<AIConversationContext>): void {
    this.context = { ...this.context, ...updates };
  }

  addToRecentActions(action: string): void {
    this.context.recentActions.unshift(action);
    if (this.context.recentActions.length > 10) {
      this.context.recentActions = this.context.recentActions.slice(0, 10);
    }
  }

  getUserId(): string {
    return this.context.userId;
  }

  getCurrentPage(): string {
    return this.context.currentPage;
  }
}