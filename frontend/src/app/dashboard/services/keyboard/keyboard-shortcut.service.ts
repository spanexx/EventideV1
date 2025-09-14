import { Injectable } from '@angular/core';
import { DialogManagementService } from '../dialog/dialog-management.service';

@Injectable({
  providedIn: 'root'
})
export class KeyboardShortcutService {
  constructor(private dialogService: DialogManagementService) {}

  /**
   * Check if the calendar is focused
   * @param event The keyboard event
   * @returns True if the calendar is focused, false otherwise
   */
  isCalendarFocused(event: KeyboardEvent): boolean {
    return event.target instanceof HTMLElement && 
           (event.target.tagName === 'BODY' || 
            event.target.classList.contains('fc') || 
            event.target.closest('.fc')) !== null;
  }

  /**
   * Check if it's an undo shortcut (Ctrl/Cmd + Z)
   * @param event The keyboard event
   * @returns True if it's an undo shortcut, false otherwise
   */
  isUndoShortcut(event: KeyboardEvent): boolean {
    return (event.ctrlKey || event.metaKey) && event.key === 'z' && !event.shiftKey;
  }

  /**
   * Check if it's a redo shortcut (Ctrl/Cmd + Shift + Z or Ctrl/Cmd + Y)
   * @param event The keyboard event
   * @returns True if it's a redo shortcut, false otherwise
   */
  isRedoShortcut(event: KeyboardEvent): boolean {
    return (event.ctrlKey || event.metaKey) && 
           ((event.shiftKey && event.key === 'Z') || event.key === 'y');
  }

  /**
   * Check if it's a refresh shortcut (R)
   * @param event The keyboard event
   * @returns True if it's a refresh shortcut, false otherwise
   */
  isRefreshShortcut(event: KeyboardEvent): boolean {
    return event.key === 'r' && !event.ctrlKey && !event.metaKey && !event.shiftKey;
  }

  /**
   * Check if it's a copy week shortcut (C)
   * @param event The keyboard event
   * @returns True if it's a copy week shortcut, false otherwise
   */
  isCopyWeekShortcut(event: KeyboardEvent): boolean {
    return event.key === 'c' && !event.ctrlKey && !event.metaKey && !event.shiftKey;
  }

  /**
   * Check if it's a copy slot shortcut (Ctrl+C)
   * @param event The keyboard event
   * @returns True if it's a copy slot shortcut, false otherwise
   */
  isCopySlotShortcut(event: KeyboardEvent): boolean {
    return (event.ctrlKey || event.metaKey) && event.key === 'c' && !event.shiftKey;
  }

  /**
   * Check if it's a paste slot shortcut (Ctrl+V)
   * @param event The keyboard event
   * @returns True if it's a paste slot shortcut, false otherwise
   */
  isPasteSlotShortcut(event: KeyboardEvent): boolean {
    return (event.ctrlKey || event.metaKey) && event.key === 'v' && !event.shiftKey;
  }

  /**
   * Check if it's an add availability shortcut (A)
   * @param event The keyboard event
   * @returns True if it's an add availability shortcut, false otherwise
   */
  isAddAvailabilityShortcut(event: KeyboardEvent): boolean {
    return event.key === 'a' && !event.ctrlKey && !event.metaKey && !event.shiftKey;
  }

  /**
   * Check if it's a refresh shortcut (F5)
   * @param event The keyboard event
   * @returns True if it's a refresh shortcut, false otherwise
   */
  isF5RefreshShortcut(event: KeyboardEvent): boolean {
    return event.key === 'F5';
  }

  /**
   * Check if an availability dialog is already open
   * @returns True if an availability dialog is open, false otherwise
   */
  isAvailabilityDialogOpen(): boolean {
    return this.dialogService.isAvailabilityDialogOpen();
  }

  /**
   * Focus an existing availability dialog if one is open
   */
  focusExistingAvailabilityDialog(): void {
    this.dialogService.focusExistingAvailabilityDialog();
  }
}