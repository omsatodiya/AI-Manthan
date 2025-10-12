/**
 * Sangam Gemini Service
 * Handles AI reasoning and response generation using Google Gemini
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import type { 
  EmbeddingMatch, 
  SangamConfig, 
  SangamContext 
} from '@/lib/types/sangam';

export class GeminiService {
  private genAI: GoogleGenerativeAI;
  private config: SangamConfig;

  constructor(config?: Partial<SangamConfig>) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY environment variable is not set');
    }

    this.genAI = new GoogleGenerativeAI(apiKey);
    this.config = {
      maxResults: 10,
      similarityThreshold: 0.5,
      maxContextLength: 8000,
      systemPrompt: this.getDefaultSystemPrompt(),
      ...config
    };
  }

  /**
   * Generate a response using RAG (Retrieval-Augmented Generation)
   */
  async generateResponse(context: SangamContext): Promise<string> {
    try {
      const prompt = this.buildPrompt(context);
      const model = this.genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      if (!text || text.trim().length === 0) {
        throw new Error('Empty response from Gemini');
      }

      return text.trim();
    } catch (error) {
      console.error('Error generating Gemini response:', error);
      throw new Error(`Failed to generate response: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Build the prompt for Gemini based on context
   */
  private buildPrompt(context: SangamContext): string {
    const { question, relevantMessages, systemPrompt, maxContextLength } = context;

    // Build context from relevant messages
    const contextText = this.buildContextText(relevantMessages, maxContextLength);

    return `${systemPrompt}

CONTEXT FROM PREVIOUS CONVERSATIONS:
${contextText}

USER QUESTION: ${question}

Please provide a helpful, accurate response based on the context above. If the context doesn't contain enough information to answer the question, please say so clearly.`;
  }

  /**
   * Build context text from relevant messages
   */
  private buildContextText(messages: EmbeddingMatch[], maxLength: number): string {
    if (messages.length === 0) {
      return 'No relevant context found.';
    }

    let contextText = '';
    let currentLength = 0;

    for (const message of messages) {
      const messageText = `[${new Date(message.createdAt).toLocaleDateString()}] ${message.content}`;
      
      if (currentLength + messageText.length > maxLength) {
        break;
      }

      contextText += messageText + '\n\n';
      currentLength += messageText.length;
    }

    return contextText.trim() || 'No relevant context found.';
  }

  /**
   * Get the default system prompt for Sangam
   */
  private getDefaultSystemPrompt(): string {
    return `You are Sangam, an AI assistant for business communities. Your role is to help users recall and understand their team's conversations and decisions.

CORE RESPONSIBILITIES:
- Summarize conversations and extract key decisions
- Answer questions about past discussions
- Identify important documents, deadlines, and action items
- Provide context about team activities and progress

COMMUNICATION STYLE:
- Be concise but comprehensive
- Use a professional yet friendly tone
- Focus on actionable insights
- Acknowledge when information is incomplete
- Use markdown formatting for better readability

RESPONSE GUIDELINES:
- Base your answers strictly on the provided context
- If context is insufficient, clearly state what information is missing
- Highlight important dates, decisions, and action items
- Maintain confidentiality and professionalism
- Avoid speculation beyond the provided context
- Format your responses using markdown for better structure:
  * Use **bold** for emphasis on important information
  * Use *italics* for dates, names, or specific terms
  * Use bullet points (-) for lists
  * Use numbered lists (1.) for sequential items
  * Use \`code blocks\` for technical terms or file names
  * Use > blockquotes for important quotes or decisions
  * Use ## headers for major sections when appropriate

Remember: You are helping teams stay organized and informed about their collaborative work.`;
  }

  /**
   * Generate a summary of recent conversations
   */
  async generateSummary(
    messages: EmbeddingMatch[], 
    timeRange?: string
  ): Promise<string> {
    const context: SangamContext = {
      question: timeRange 
        ? `Please provide a summary of conversations from ${timeRange}`
        : 'Please provide a summary of these recent conversations',
      relevantMessages: messages,
      systemPrompt: this.getSummarySystemPrompt(),
      maxContextLength: this.config.maxContextLength
    };

    return await this.generateResponse(context);
  }

  /**
   * Get system prompt for summarization tasks
   */
  private getSummarySystemPrompt(): string {
    return `You are Sangam, creating a summary of team conversations. 

Focus on:
- Key decisions made
- Important deadlines and dates
- Action items and responsibilities
- Documents or resources shared
- Major topics discussed
- Progress updates

Structure your summary with clear headings and bullet points. Be comprehensive but concise.`;
  }

  /**
   * Answer a specific question about conversations
   */
  async answerQuestion(
    question: string, 
    messages: EmbeddingMatch[]
  ): Promise<string> {
    const context: SangamContext = {
      question,
      relevantMessages: messages,
      systemPrompt: this.getDefaultSystemPrompt(),
      maxContextLength: this.config.maxContextLength
    };

    return await this.generateResponse(context);
  }

  /**
   * Extract key information from conversations
   */
  async extractKeyInfo(
    messages: EmbeddingMatch[], 
    infoType: 'decisions' | 'deadlines' | 'documents' | 'action-items'
  ): Promise<string> {
    const questionMap = {
      'decisions': 'What key decisions were made in these conversations?',
      'deadlines': 'What deadlines, dates, or time-sensitive items are mentioned?',
      'documents': 'What documents, files, or resources were shared or discussed?',
      'action-items': 'What action items or tasks were assigned or discussed?'
    };

    const context: SangamContext = {
      question: questionMap[infoType],
      relevantMessages: messages,
      systemPrompt: this.getDefaultSystemPrompt(),
      maxContextLength: this.config.maxContextLength
    };

    return await this.generateResponse(context);
  }

  /**
   * Validate Gemini API configuration
   */
  async validateConfiguration(): Promise<{ valid: boolean; error?: string }> {
    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return { valid: false, error: 'GEMINI_API_KEY environment variable is not set' };
      }

      // Test API with a simple request
      const model = this.genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
      const result = await model.generateContent('Hello, this is a test.');
      await result.response;

      return { valid: true };
    } catch (error) {
      return { 
        valid: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /**
   * Get model information
   */
  getModelInfo(): { model: string; maxTokens: number } {
    return {
      model: 'gemini-2.5-flash',
      maxTokens: 1000000
    };
  }
}

// Export singleton instance
export const geminiService = new GeminiService();
