import { Injectable } from '@angular/core';
import { MatSnackBar, MatSnackBarConfig } from '@angular/material/snack-bar';

@Injectable({
  providedIn: 'root'
})
export class SnackbarService {
  private defaultConfig: MatSnackBarConfig = {
    duration: 3000,
    horizontalPosition: 'center',
    verticalPosition: 'bottom'
  };

  constructor(private snackBar: MatSnackBar) { }

  /**
   * Show a success message
   * @param message The message to display
   * @param action The action button text (default: 'Close')
   * @param config Additional configuration options
   */
  showSuccess(message: string, action: string = 'Close', config?: MatSnackBarConfig): void {
    const mergedConfig: MatSnackBarConfig = {
      ...this.defaultConfig,
      ...config,
      duration: config?.duration || 3000,
      panelClass: ['success-snackbar']
    };

    this.snackBar.open(message, action, mergedConfig);
  }

  /**
   * Show an error message
   * @param message The message to display
   * @param action The action button text (default: 'Close')
   * @param config Additional configuration options
   */
  showError(message: string, action: string = 'Close', config?: MatSnackBarConfig): void {
    const mergedConfig: MatSnackBarConfig = {
      ...this.defaultConfig,
      ...config,
      duration: config?.duration || 5000,
      panelClass: ['error-snackbar']
    };

    this.snackBar.open(message, action, mergedConfig);
  }

  /**
   * Show an info message
   * @param message The message to display
   * @param action The action button text (default: 'Close')
   * @param config Additional configuration options
   */
  showInfo(message: string, action: string = 'Close', config?: MatSnackBarConfig): void {
    const mergedConfig: MatSnackBarConfig = {
      ...this.defaultConfig,
      ...config,
      duration: config?.duration || 4000,
      panelClass: ['info-snackbar']
    };

    this.snackBar.open(message, action, mergedConfig);
  }

  /**
   * Show a warning message
   * @param message The message to display
   * @param action The action button text (default: 'Close')
   * @param config Additional configuration options
   */
  showWarning(message: string, action: string = 'Close', config?: MatSnackBarConfig): void {
    const mergedConfig: MatSnackBarConfig = {
      ...this.defaultConfig,
      ...config,
      duration: config?.duration || 4000,
      panelClass: ['warning-snackbar']
    };

    this.snackBar.open(message, action, mergedConfig);
  }

  /**
   * Dismiss the currently open snackbar
   */
  dismiss(): void {
    this.snackBar.dismiss();
  }
}