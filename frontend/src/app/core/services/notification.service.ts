import { Injectable } from '@angular/core';
import { MatSnackBar, MatSnackBarConfig } from '@angular/material/snack-bar';

export interface NotificationConfig {
  duration?: number;
  action?: string;
  panelClass?: string[];
  horizontalPosition?: 'start' | 'center' | 'end' | 'left' | 'right';
  verticalPosition?: 'top' | 'bottom';
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private defaultConfig: MatSnackBarConfig = {
    duration: 5000,
    horizontalPosition: 'right',
    verticalPosition: 'top'
  };

  constructor(private snackBar: MatSnackBar) {}

  /**
   * Show a success notification
   */
  success(message: string, config?: NotificationConfig): void {
    const snackBarConfig: MatSnackBarConfig = {
      ...this.defaultConfig,
      ...config,
      panelClass: ['success-snackbar', ...(config?.panelClass || [])]
    };

    this.snackBar.open(message, config?.action || 'Close', snackBarConfig);
  }

  /**
   * Show an error notification
   */
  error(message: string, config?: NotificationConfig): void {
    const snackBarConfig: MatSnackBarConfig = {
      ...this.defaultConfig,
      duration: config?.duration || 8000, // Longer duration for errors
      ...config,
      panelClass: ['error-snackbar', ...(config?.panelClass || [])]
    };

    this.snackBar.open(message, config?.action || 'Close', snackBarConfig);
  }

  /**
   * Show a warning notification
   */
  warning(message: string, config?: NotificationConfig): void {
    const snackBarConfig: MatSnackBarConfig = {
      ...this.defaultConfig,
      ...config,
      panelClass: ['warning-snackbar', ...(config?.panelClass || [])]
    };

    this.snackBar.open(message, config?.action || 'Close', snackBarConfig);
  }

  /**
   * Show an info notification
   */
  info(message: string, config?: NotificationConfig): void {
    const snackBarConfig: MatSnackBarConfig = {
      ...this.defaultConfig,
      ...config,
      panelClass: ['info-snackbar', ...(config?.panelClass || [])]
    };

    this.snackBar.open(message, config?.action || 'Close', snackBarConfig);
  }

  /**
   * Show a custom notification
   */
  show(message: string, action?: string, config?: NotificationConfig): void {
    const snackBarConfig: MatSnackBarConfig = {
      ...this.defaultConfig,
      ...config
    };

    this.snackBar.open(message, action || 'Close', snackBarConfig);
  }

  /**
   * Dismiss all notifications
   */
  dismiss(): void {
    this.snackBar.dismiss();
  }
}
