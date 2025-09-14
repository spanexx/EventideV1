import { Injectable } from '@angular/core';
import { KeyboardShortcutService } from '../keyboard/keyboard-shortcut.service';

@Injectable({
  providedIn: 'root'
})
export class AvailabilityKeyboardService {
  constructor(private keyboardShortcutService: KeyboardShortcutService) {}

  /**
   * Check if the calendar is focused
   */
  isCalendarFocused(event: KeyboardEvent): boolean {
    return this.keyboardShortcutService.isCalendarFocused(event);
  }

  /**
   * Handle keyboard shortcuts for the availability calendar
   */
  handleKeyboardShortcut(
    event: KeyboardEvent,
    undo: () => void,
    redo: () => void,
    refreshAvailability: () => void,
    copyWeekSchedule: () => void,
    handleAddAvailabilityShortcut: () => void,
    copySlot: () => void,
    pasteSlot: () => void
  ): void {
    // Ctrl/Cmd + Z - Undo
    if (this.keyboardShortcutService.isUndoShortcut(event)) {
      event.preventDefault();
      undo();
      return;
    }
    
    // Ctrl/Cmd + Shift + Z or Ctrl/Cmd + Y - Redo
    if (this.keyboardShortcutService.isRedoShortcut(event)) {
      event.preventDefault();
      redo();
      return;
    }
    
    // Ctrl/Cmd + C - Copy slot
    if (this.keyboardShortcutService.isCopySlotShortcut(event)) {
      event.preventDefault();
      copySlot();
      return;
    }
    
    // Ctrl/Cmd + V - Paste slot
    if (this.keyboardShortcutService.isPasteSlotShortcut(event)) {
      event.preventDefault();
      pasteSlot();
      return;
    }
    
    // R - Refresh
    if (this.keyboardShortcutService.isRefreshShortcut(event)) {
      event.preventDefault();
      refreshAvailability();
      return;
    }
    
    // C - Copy week
    if (this.keyboardShortcutService.isCopyWeekShortcut(event)) {
      event.preventDefault();
      copyWeekSchedule();
      return;
    }
    
    // A - Add availability
    if (this.keyboardShortcutService.isAddAvailabilityShortcut(event)) {
      event.preventDefault();
      handleAddAvailabilityShortcut();
      return;
    }
    
    // F5 - Refresh (standard browser refresh)
    if (this.keyboardShortcutService.isF5RefreshShortcut(event)) {
      event.preventDefault();
      refreshAvailability();
      return;
    }
  }
}