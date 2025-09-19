import { Injectable, inject } from '@angular/core';
import { AIService } from './ai.service';

const MAX_LOG_SIZE = 1000;
const MAX_ARCHIVED_LOGS = 5;
const DB_NAME = 'app-logs';
const DB_VERSION = 1;
const CURRENT_LOG_STORE = 'current_log';
const ARCHIVED_LOGS_STORE = 'archived_logs';

@Injectable({
  providedIn: 'root'
})
export class LogService {
  private db: IDBDatabase | null = null;
  private originalConsole = {
    log: console.log.bind(console),
    error: console.error.bind(console),
    warn: console.warn.bind(console),
    info: console.info.bind(console),
  };

  private aiService = inject(AIService);

  constructor() {}

  public init(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!('indexedDB' in window)) {
        this.originalConsole.error('IndexedDB not supported');
        return reject('IndexedDB not supported');
      }

      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(CURRENT_LOG_STORE)) {
          db.createObjectStore(CURRENT_LOG_STORE, { autoIncrement: true });
        }
        if (!db.objectStoreNames.contains(ARCHIVED_LOGS_STORE)) {
          db.createObjectStore(ARCHIVED_LOGS_STORE, { autoIncrement: true });
        }
      };

      request.onsuccess = (event) => {
        this.db = (event.target as IDBOpenDBRequest).result;
        this.overrideConsole();
        resolve();
      };

      request.onerror = (event) => {
        this.originalConsole.error('IndexedDB error:', (event.target as IDBOpenDBRequest).error);
        reject((event.target as IDBOpenDBRequest).error);
      };
    });
  }

  private overrideConsole(): void {
    console.log = this.log.bind(this, 'log');
    console.error = this.log.bind(this, 'error');
    console.warn = this.log.bind(this, 'warn');
    console.info = this.log.bind(this, 'info');
  }

  private async log(level: string, ...args: any[]): Promise<void> {
    this.originalConsole.log(...args);

    const logEntry = {
      level,
      timestamp: new Date().toISOString(),
      message: args.map(arg => this.stringify(arg)).join(' ')
    };

    try {
      await this.addToStore(CURRENT_LOG_STORE, logEntry);
      await this.checkLogSizeAndRotate();
    } catch (error) {
      this.originalConsole.error('Failed to save log to IndexedDB', error);
    }
  }

  private stringify(arg: any): string {
    if (typeof arg === 'string') {
      return arg;
    }
    if (arg instanceof Error) {
      return arg.message;
    }
    try {
      return JSON.stringify(arg, null, 2);
    } catch (e) {
      return 'Un-stringifiable object';
    }
  }

  private async checkLogSizeAndRotate(): Promise<void> {
    const logCount = await this.countStore(CURRENT_LOG_STORE);

    if (logCount >= MAX_LOG_SIZE) {
      const logs = await this.getAllFromStore(CURRENT_LOG_STORE);
      const logArchive = {
        timestamp: new Date().toISOString(),
        logs: logs
      };
      await this.addToStore(ARCHIVED_LOGS_STORE, logArchive);
      await this.clearStore(CURRENT_LOG_STORE);
      await this.checkArchiveLimit();
    }
  }

  private async checkArchiveLimit(): Promise<void> {
    let archiveCount = await this.countStore(ARCHIVED_LOGS_STORE);

    while (archiveCount > MAX_ARCHIVED_LOGS) {
      const oldest = await this.getOldestFromStore(ARCHIVED_LOGS_STORE);
      if (oldest) {
        this.summarizeAndSendToAI(oldest.value);
        await this.deleteFromStore(ARCHIVED_LOGS_STORE, oldest.key);
      }
      archiveCount--;
    }
  }

  private async summarizeAndSendToAI(logArchive: any): Promise<void> {
    try {
      const summary = await this.aiService.summarize(logArchive.logs);
      this.originalConsole.info('AI Summary:', summary);
      // Here you could potentially store the summary
    } catch (error) {
      this.originalConsole.error('Failed to summarize logs', error);
    }
  }

  // Promise-based helpers for IndexedDB
  private getStore(storeName: string, mode: IDBTransactionMode): IDBObjectStore {
    if (!this.db) {
      throw new Error('Database not initialized');
    }
    const transaction = this.db.transaction([storeName], mode);
    return transaction.objectStore(storeName);
  }

  private addToStore(storeName: string, value: any): Promise<void> {
    return new Promise((resolve, reject) => {
      const store = this.getStore(storeName, 'readwrite');
      const request = store.add(value);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  private countStore(storeName: string): Promise<number> {
    return new Promise((resolve, reject) => {
      const store = this.getStore(storeName, 'readonly');
      const request = store.count();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  private getAllFromStore(storeName: string): Promise<any[]> {
    return new Promise((resolve, reject) => {
      const store = this.getStore(storeName, 'readonly');
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  private clearStore(storeName: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const store = this.getStore(storeName, 'readwrite');
      const request = store.clear();
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  private deleteFromStore(storeName: string, key: IDBValidKey): Promise<void> {
    return new Promise((resolve, reject) => {
      const store = this.getStore(storeName, 'readwrite');
      const request = store.delete(key);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  private getOldestFromStore(storeName: string): Promise<{ key: IDBValidKey; value: any } | null> {
    return new Promise((resolve, reject) => {
      const store = this.getStore(storeName, 'readonly');
      const request = store.openCursor();
      request.onsuccess = () => {
        if (request.result) {
          resolve({ key: request.result.key, value: request.result.value });
        } else {
          resolve(null);
        }
      };
      request.onerror = () => reject(request.error);
    });
  }
}
