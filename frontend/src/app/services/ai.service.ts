import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { lastValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';

interface OpenRouterResponse {
  choices: {
    message: {
      content: string;
    };
  }[];
}

@Injectable({
  providedIn: 'root'
})
export class AIService {
  private http = inject(HttpClient);
  private apiUrl = 'https://openrouter.ai/api/v1/chat/completions';
  private apiKey = environment.openRouterApiKey;

  constructor() { }

  async summarize(logs: any[]): Promise<string> {
    if (!this.apiKey) {
      return 'API key not configured.';
    }

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json'
    });

    const prompt = this.createPrompt(logs);

    const body = {
      model: 'deepseek/deepseek-r1-0528:free',
      messages: [
        { role: 'user', content: prompt }
      ]
    };

    try {
      const response = await lastValueFrom(this.http.post<OpenRouterResponse>(this.apiUrl, body, { headers }));
      return response.choices[0].message.content;
    } catch (error) {
      console.error('Error calling OpenRouter API:', error);
      return 'Failed to get summary from AI.';
    }
  }

  private createPrompt(logs: any[]): string {
    const logSummary = logs.map(log => `${log.timestamp} [${log.level}] ${log.message}`).join('\n');
    return `
      Please summarize the following log entries. Provide a brief overview of the main events, errors, and warnings.
      The logs are:
      ---\n      ${logSummary}
      ---
    `;
  }
}
