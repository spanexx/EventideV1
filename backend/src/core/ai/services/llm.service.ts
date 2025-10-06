import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';

const OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1';

@Injectable()
export class LlmService {
  private readonly logger = new Logger(LlmService.name);
  private readonly apiKey = process.env.OPENROUTER_API_KEY || '';
  private readonly defaultModel = process.env.OPENROUTER_MODEL || 'openai/gpt-oss-20b:free';

  private getHeaders() {
    return {
      Authorization: `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': process.env.APP_URL || 'http://localhost:3000',
      'X-Title': process.env.APP_NAME || 'Eventide LLM'
    };
  }

  async chatCompletion(messages: Array<{ role: string; content: string }>, options: any = {}) {
    if (!this.apiKey || this.apiKey === 'your-api-key-here' || this.apiKey === 'dummy-key-for-testing') {
      throw new Error('OPENROUTER_API_KEY missing or invalid');
    }

    if (!Array.isArray(messages) || messages.length === 0) {
      throw new Error('Messages must be a non-empty array');
    }

    const payload = {
      model: options.model || this.defaultModel,
      messages,
      temperature: options.temperature ?? 0.7,
      max_tokens: options.maxTokens ?? 300,
      top_p: options.topP ?? 1,
      frequency_penalty: options.frequencyPenalty ?? 0,
      presence_penalty: options.presencePenalty ?? 0,
      ...options
    };

    try {
      const res = await axios.post(`${OPENROUTER_BASE_URL}/chat/completions`, payload, {
        headers: this.getHeaders(),
        timeout: 10000
      });
      return res.data;
    } catch (err: any) {
      this.logger.error('LLM request failed', err?.message || err);
      if (err.response) {
        throw new Error(`LLM API error: ${err.response.status} - ${JSON.stringify(err.response.data)}`);
      }
      throw new Error(`LLM request error: ${err.message || err}`);
    }
  }

  /**
   * Ask LLM to return a structured JSON interpretation for a user query.
   */
  async understandQuery(query: string, context: any = {}) {
    if (!query || typeof query !== 'string') throw new Error('Query must be a non-empty string');

    const systemMessage = `You are an assistant that returns a single JSON object describing the user's intent.
Available actions: SEARCH, CREATE, DELETE, GET_ID, CHECK_AVAILABILITY, BOOK_SLOT, SUGGEST_AVAILABILITY, SUGGEST_BOOKING.
For availability and booking actions, include date and time in a standardized format.
Return only valid JSON. Examples:
{"action":"CHECK_AVAILABILITY","availabilityData":{"date":"2025-10-04","time":"14:00"}}
{"action":"BOOK_SLOT","bookingData":{"date":"2025-10-04","time":"14:00"}}
{"action":"CREATE","productData":{"name":"X","price":"9.99","description":"..."}}
Context: ${JSON.stringify(context)}`;

    const messages = [
      { role: 'system', content: systemMessage },
      { role: 'user', content: `User Query: ${query}` }
    ];

    const response = await this.chatCompletion(messages, { temperature: 0.3, maxTokens: 500 });
    // Guard and normalize response shape coming from axios
    const content = (response && typeof response === 'object' && (response as any).choices && Array.isArray((response as any).choices) && (response as any).choices[0]?.message?.content)
      ? String((response as any).choices[0].message.content).trim()
      : null;

    if (!content) throw new Error('Empty response from LLM');

    // Try to parse JSON directly; otherwise try to extract JSON substrings
    try {
      return JSON.parse(content as string);
    } catch (e) {
      // Extract balanced JSON object(s)
      const validJsons: string[] = [];
      let depth = 0;
      let start = -1;
      for (let i = 0; i < content.length; i++) {
        if (content[i] === '{') {
          if (depth === 0) start = i;
          depth++;
        } else if (content[i] === '}') {
          depth--;
          if (depth === 0 && start !== -1) {
            const candidate = content.substring(start, i + 1);
            try { JSON.parse(candidate); validJsons.push(candidate); } catch { }
            start = -1;
          }
        }
      }
      if (validJsons.length > 0) {
        validJsons.sort((a, b) => b.length - a.length);
        return JSON.parse(validJsons[0]);
      }
      throw new Error('Failed to parse LLM response as JSON');
    }
  }
}
