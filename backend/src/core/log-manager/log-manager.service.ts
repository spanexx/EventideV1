import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs/promises';
import * as path from 'path';
import axios from 'axios';

const MAX_LOG_LINES = 1000;
const MAX_ARCHIVED_LOGS = 5;

interface OpenRouterResponse {
  choices: {
    message: {
      content: string;
    };
  }[];
}

@Injectable()
export class LogManagerService {
  private openRouterApiKey: string;
  private isRotating = false;

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('OPENROUTER_API_KEY');
    if (!apiKey) {
      console.error('OPENROUTER_API_KEY is not configured.');
      this.openRouterApiKey = '';
    } else {
      this.openRouterApiKey = apiKey;
    }
  }

  async initializeLogFile(logDirectory: string, logFileName: string): Promise<void> {
    try {
      await fs.mkdir(logDirectory, { recursive: true });
      await fs.appendFile(path.join(logDirectory, logFileName), '');
    } catch (error) {
      console.error(`Failed to initialize log directory ${logDirectory}:`, error);
    }
  }

  async log(logDirectory: string, logFileName: string, message: string): Promise<void> {
    try {
      const logFilePath = path.join(logDirectory, logFileName);
      await fs.appendFile(logFilePath, message + '\n');
      await this.checkLogRotation(logDirectory, logFileName);
    } catch (error) {
      console.error('Failed to write to log file:', error);
    }
  }

  private async checkLogRotation(logDirectory: string, logFileName: string): Promise<void> {
    if (this.isRotating) {
      return; // Rotation is already in progress
    }

    this.isRotating = true;

    try {
      const logFilePath = path.join(logDirectory, logFileName);
      const content = await fs.readFile(logFilePath, 'utf-8');
      const lines = content.split('\n');

      if (lines.length > MAX_LOG_LINES) {
        const timestamp = new Date().toISOString().replace(/:/g, '-');
        const archiveFileName = path.join(logDirectory, `archived-${timestamp}.log`);
        
        // Before renaming, ensure the file exists and has content
        const stats = await fs.stat(logFilePath);
        if (stats.size > 0) {
          await fs.rename(logFilePath, archiveFileName);
          await fs.appendFile(logFilePath, ''); // Create a new empty log file
          await this.checkArchiveLimit(logDirectory);
        } else {
          // If the file is empty, just clear it without archiving
          await fs.writeFile(logFilePath, '');
        }
      }
    } catch (error) {
      console.error('Error during log rotation:', error);
    } finally {
      this.isRotating = false;
    }
  }

  private async checkArchiveLimit(logDirectory: string): Promise<void> {
    try {
      const files = await fs.readdir(logDirectory);
      const archivedLogs = files
        .filter(file => file.startsWith('archived-') && file.endsWith('.log'))
        .sort()
        .map(file => path.join(logDirectory, file));

      // Loop to remove all logs that exceed the limit
      while (archivedLogs.length > MAX_ARCHIVED_LOGS) {
        const oldestLog = archivedLogs.shift(); // Get and remove the oldest from the array
        if (oldestLog) {
          await this.summarizeAndRemove(oldestLog, logDirectory);
        }
      }
    } catch (error) {
      console.error('Error checking archive limit:', error);
    }
  }

  private async summarizeAndRemove(filePath: string, logDirectory: string): Promise<void> {
    // Defensive check to ensure we only process .log files
    if (!filePath.endsWith('.log')) {
      console.error(`Attempted to summarize a non-log file, skipping: ${filePath}`);
      return;
    }

    try {
      const summaryFilePath = path.join(logDirectory, '_summaries.txt');
      let existingSummary = '';
      try {
        existingSummary = await fs.readFile(summaryFilePath, 'utf-8');
      } catch (error) {
        // If the file doesn't exist, we'll just create it.
      }

      const newLogContent = await fs.readFile(filePath, 'utf-8');
      const newSummary = await this.getAiSummary(newLogContent, existingSummary);

      // Do not update the summary file if there are no significant events.
      if (newSummary.trim() !== 'No significant events to report.') {
        await fs.writeFile(summaryFilePath, newSummary);
      }

      await fs.unlink(filePath);
    } catch (error) {
      console.error(`Failed to summarize and remove ${filePath}:`, error);
    }
  }

  private async getAiSummary(newLogContent: string, existingSummary: string): Promise<string> {
    if (!this.openRouterApiKey) {
      return 'API key not configured. Cannot summarize log.';
    }

    const prompt = `
      You are a log summarization assistant. Your instructions are: if there is nothing to summarize, no issues and no concerns, there is no need to summarize too much.
      Focus on significant events like errors, failures, and key state changes.
      Intelligently merge the new information into the existing summary, creating a concise, consolidated overview.
      **If the new log content contains no significant events, issues, or concerns, your entire response must be only the following phrase: "No significant events to report."**

      **Existing Summary:**
      ---
      ${existingSummary}
      ---

      **New Log Content:**
      ---
      ${newLogContent}
      ---

      Provide the new, consolidated summary.
    `;

    try {
      const response = await axios.post<OpenRouterResponse>('https://openrouter.ai/api/v1/chat/completions', {
        model: 'mistralai/mistral-7b-instruct:free',
        messages: [{ role: 'user', content: prompt }],
      }, {
        headers: {
          'Authorization': `Bearer ${this.openRouterApiKey}`,
          'Content-Type': 'application/json',
        },
      });
      return response.data.choices[0].message.content;
    } catch (error) {
      console.error('Error calling OpenRouter API:', error.response?.data || error.message);
      return 'Failed to get summary from AI.';
    }
  }
}
