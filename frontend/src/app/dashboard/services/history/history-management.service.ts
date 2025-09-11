import { Injectable } from '@angular/core';
import { Availability } from '../../models/availability.models';

@Injectable({
  providedIn: 'root'
})
export class HistoryManagementService {
  private history: Availability[][] = [];
  private historyIndex = -1;
  private readonly MAX_HISTORY = 50;
  
  // Throttling for history updates
  private lastSaveTime = 0;
  private readonly SAVE_THROTTLE = 1000; // 1 second

  /**
   * Save the current state to history with throttling
   * @param availability The current availability state
   */
  saveToHistory(availability: Availability[]): void {
    const currentTime = Date.now();
    // Only save to history if enough time has passed since the last save
    if (currentTime - this.lastSaveTime > this.SAVE_THROTTLE) {
      // If we're not at the end of the history, remove future states
      if (this.historyIndex < this.history.length - 1) {
        this.history = this.history.slice(0, this.historyIndex + 1);
      }
      
      // Add the current state to history
      this.history.push([...availability]);
      this.historyIndex++;
      
      // Limit history size
      if (this.history.length > this.MAX_HISTORY) {
        this.history.shift();
        this.historyIndex--;
      }
      
      // Update last save time
      this.lastSaveTime = currentTime;
    }
  }

  /**
   * Get the previous state from history
   * @returns The previous state or null if there is no previous state
   */
  getPreviousState(): Availability[] | null {
    if (this.canUndo()) {
      this.historyIndex--;
      return this.history[this.historyIndex];
    }
    return null;
  }

  /**
   * Get the next state from history
   * @returns The next state or null if there is no next state
   */
  getNextState(): Availability[] | null {
    if (this.canRedo()) {
      this.historyIndex++;
      return this.history[this.historyIndex];
    }
    return null;
  }

  /**
   * Check if we can undo (go back in history)
   * @returns True if we can undo, false otherwise
   */
  canUndo(): boolean {
    return this.historyIndex > 0;
  }

  /**
   * Check if we can redo (go forward in history)
   * @returns True if we can redo, false otherwise
   */
  canRedo(): boolean {
    return this.historyIndex < this.history.length - 1;
  }

  /**
   * Clear the history
   */
  clearHistory(): void {
    this.history = [];
    this.historyIndex = -1;
  }
}