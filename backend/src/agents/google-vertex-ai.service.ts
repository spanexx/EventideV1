import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { VertexAI } from '@google-cloud/vertexai';

@Injectable()
export class GoogleVertexAIService {
  private readonly logger = new Logger(GoogleVertexAIService.name);
  private vertexAI: VertexAI;
  private readonly projectId: string;
  private readonly location: string;
  private readonly model: string;

  constructor(
    private readonly configService: ConfigService,
  ) {
    this.projectId = this.configService.get<string>('GOOGLE_CLOUD_PROJECT_ID') || 'eventide-474521';
    this.location = this.configService.get<string>('GOOGLE_CLOUD_LOCATION') || 'us-central1';
    this.model = this.configService.get<string>('GOOGLE_VERTEX_MODEL') || 'gemini-2.0-flash';  // Updated to use the recommended flash model for efficiency
    
    // Initialize Vertex AI client
    this.vertexAI = new VertexAI({
      project: this.projectId,
      location: this.location,
    });

    this.logger.log('Google Vertex AI Service initialized');
    this.logger.log(`Project ID: ${this.projectId}, Location: ${this.location}, Model: ${this.model}`);
  }

  /**
   * Generate content using Google Vertex AI with the Gemini model
   */
  async generateContent(
    prompt: string,
    options: {
      temperature?: number;
      maxOutputTokens?: number;
      topP?: number;
      topK?: number;
      systemInstruction?: string;
    } = {}
  ) {
    try {
      this.logger.log(`Generating content with prompt: ${prompt.substring(0, 100)}...`);
      
      const promptParts = [
        {
          text: prompt,
        },
      ];

      // Get the generative model
      const model = this.vertexAI.getGenerativeModel({
        model: this.model,
        systemInstruction: options.systemInstruction,
      });

      // Prepare generation config
      const generationConfig = {
        temperature: options.temperature ?? 0.7,
        maxOutputTokens: options.maxOutputTokens ?? 2048,
        topP: options.topP ?? 0.95,
        topK: options.topK ?? 40,
      };

      // Generate content
      const response = await model.generateContent({
        contents: [{ role: 'user', parts: promptParts }],
        generationConfig,
      });

      const result = response.response;
      this.logger.log('Content generation completed successfully');
      
      return {
        success: true,
        content: result.candidates?.[0]?.content?.parts?.[0]?.text || '',
        usage: result.usageMetadata,
      };
    } catch (error) {
      this.logger.error('Error generating content with Google Vertex AI', error);
      
      // Handle common Vertex AI errors with user-friendly messages
      if (error.message && error.message.includes('BILLING_DISABLED')) {
        throw new Error('Google Cloud billing is not enabled for this project. Please enable billing at https://console.cloud.google.com/billing/enable?project=eventide-474521');
      }
      
      throw error;
    }
  }

  /**
   * Generate content with chat history context using Google Vertex AI
   * This method accepts a history of messages to maintain conversation context
   */
  async generateChatCompletion(
    history: Array<{ role: string; content: string }>,
    message: string,
    options: {
      temperature?: number;
      maxOutputTokens?: number;
      topP?: number;
      topK?: number;
      systemInstruction?: string;
    } = {}
  ) {
    try {
      this.logger.log(`Generating chat completion with ${history.length} previous messages, current message: ${(message || '').substring(0, 100)}...`);
      
      // Format chat history for Vertex AI
      const vertexHistory = history.map(msg => ({
        role: msg.role,
        parts: [{ text: msg.content }],
      }));

      // Get the generative model
      const model = this.vertexAI.getGenerativeModel({
        model: this.model,
        systemInstruction: options.systemInstruction,
      });

      // Initialize chat with history
      const chat = model.startChat({
        history: vertexHistory,
      });

      // Prepare generation config
      const generationConfig = {
        temperature: options.temperature ?? 0.7,
        maxOutputTokens: options.maxOutputTokens ?? 2048,
        topP: options.topP ?? 0.95,
        topK: options.topK ?? 40,
      };

      // Send message and get response
      const result = await chat.sendMessage([message]);
      const response = result.response;
      const content = response.candidates?.[0]?.content?.parts?.[0]?.text || '';

      this.logger.log('Chat completion generated successfully');
      
      return {
        success: true,
        content,
        usage: response.usageMetadata,
      };
    } catch (error) {
      this.logger.error('Error generating chat completion with Google Vertex AI', error);
      
      // Handle common Vertex AI errors with user-friendly messages
      if (error.message && error.message.includes('BILLING_DISABLED')) {
        throw new Error('Google Cloud billing is not enabled for this project. Please enable billing at https://console.cloud.google.com/billing/enable?project=eventide-474521');
      }
      
      throw error;
    }
  }

  /**
   * Performs function calling with Google Vertex AI
   * This allows the AI model to call external functions based on user input
   */
  async generateFunctionCall(
    prompt: string,
    functions: Array<any>, // Using any to avoid complex typing issues
    options: {
      temperature?: number;
      systemInstruction?: string;
    } = {}
  ) {
    try {
      this.logger.log(`Generating function call with prompt: ${(prompt || '').substring(0, 100)}...`);
      
      // Define tools for function calling - simplified to avoid typing issues
      const tools: any = [{
        functionDeclarations: functions
      }];

      // Get the generative model
      const model = this.vertexAI.getGenerativeModel({
        model: this.model,
        systemInstruction: options.systemInstruction,
      });

      // Prepare generation config
      const generationConfig = {
        temperature: options.temperature ?? 0.0,  // Lower temperature for more deterministic function calling
      };

      // Generate content with tool configuration
      const response = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig,
        tools,
      });

      const result = response.response;
      this.logger.log('Function call generation completed successfully');
      
      // Check if there are function calls in the response - using safe access
      let functionCall = null;
      if (result.candidates && result.candidates[0]) {
        const candidate: any = result.candidates[0];
        // Try both potential properties for function call results
        if (candidate.functionCall) {
          functionCall = candidate.functionCall;
        } else if (candidate.functionCalls && Array.isArray(candidate.functionCalls) && candidate.functionCalls.length > 0) {
          functionCall = candidate.functionCalls[0];
        }
      }
      
      return {
        success: true,
        functionCall: functionCall || null,
        content: result.candidates?.[0]?.content?.parts?.[0]?.text || '',
        usage: result.usageMetadata,
      };
    } catch (error) {
      this.logger.error('Error generating function call with Google Vertex AI', error);
      
      // Handle common Vertex AI errors with user-friendly messages
      if (error.message && error.message.includes('BILLING_DISABLED')) {
        throw new Error('Google Cloud billing is not enabled for this project. Please enable billing at https://console.cloud.google.com/billing/enable?project=eventide-474521');
      }
      
      throw error;
    }
  }

  /**
   * Get a list of supported models in the configured location
   */
  async listModels() {
    try {
      this.logger.log('Listing available models');
      
      // This is a placeholder implementation
      // In a real implementation, you would use the Vertex AI API to list models
      return {
        success: true,
        models: [
          { name: 'gemini-2.0-flash', displayName: 'Gemini 2.0 Flash', description: 'The newest multimodal model with next-generation features and improved capabilities' },
          { name: 'gemini-2.0-flash-lite', displayName: 'Gemini 2.0 Flash-Lite', description: 'Optimized for cost efficiency and low latency' },
          { name: 'gemini-2.5-flash', displayName: 'Gemini 2.5 Flash', description: 'Well-rounded capabilities with good price-performance ratio' },
          { name: 'gemini-2.5-flash-lite', displayName: 'Gemini 2.5 Flash-Lite', description: 'The fastest model for high throughput tasks' },
          { name: 'gemini-1.5-pro', displayName: 'Gemini 1.5 Pro', description: 'For complex, multi-step tasks' },
        ],
      };
    } catch (error) {
      this.logger.error('Error listing models', error);
      throw error;
    }
  }
}