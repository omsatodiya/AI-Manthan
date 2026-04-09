import OpenAI from 'openai';
import type { 
  EmbeddingMatch, 
  SangamConfig, 
  SangamContext 
} from '@/lib/types/sangam';

export class GeminiService {
  private client: OpenAI;
  private config: SangamConfig;
  private model: string;

  constructor(config?: Partial<SangamConfig>) {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      throw new Error('GROQ_API_KEY environment variable is not set');
    }

    this.client = new OpenAI({
      apiKey,
      baseURL: 'https://api.groq.com/openai/v1',
    });
    this.model = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';
    this.config = {
      maxResults: 10,
      similarityThreshold: 0.5,
      maxContextLength: 8000,
      systemPrompt: this.getDefaultSystemPrompt(),
      ...config
    };
  }

  async generateResponse(context: SangamContext): Promise<string> {
    const prompt = this.buildPrompt(context);
    try {
      for (let attempt = 1; attempt <= 3; attempt++) {
        try {
          const completion = await this.client.chat.completions.create({
            model: this.model,
            temperature: 0.2,
            messages: [
              { role: 'system', content: context.systemPrompt },
              { role: 'user', content: prompt },
            ],
          });
          const text = completion.choices[0]?.message?.content?.trim();
          if (text) {
            return text;
          }
          throw new Error('Empty response from Groq');
        } catch (error) {
          if (attempt === 3) {
            throw error;
          }
          const status = (error as { status?: number })?.status;
          if (status && status !== 429 && status !== 500 && status !== 503) {
            throw error;
          }
          await new Promise((resolve) => setTimeout(resolve, 400 * attempt));
        }
      }
      throw new Error('Failed to generate response');
    } catch (error) {
      console.error('Error generating Groq response:', error);
      throw new Error(`Failed to generate response: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private buildPrompt(context: SangamContext): string {
    const { question, relevantMessages, systemPrompt, maxContextLength } = context;
    const contextText = this.buildContextText(relevantMessages, maxContextLength);

    return `${systemPrompt}

CONTEXT FROM PREVIOUS CONVERSATIONS:
${contextText}

USER QUESTION: ${question}

Please provide a helpful, accurate response based on the context above. If the context doesn't contain enough information to answer the question, please say so clearly.`;
  }

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

  async validateConfiguration(): Promise<{ valid: boolean; error?: string }> {
    try {
      const apiKey = process.env.GROQ_API_KEY;
      if (!apiKey) {
        return { valid: false, error: 'GROQ_API_KEY environment variable is not set' };
      }

      await this.client.chat.completions.create({
        model: this.model,
        messages: [{ role: 'user', content: 'Hello, this is a test.' }],
      });

      return { valid: true };
    } catch (error) {
      return { 
        valid: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  getModelInfo(): { model: string; maxTokens: number } {
    return {
      model: this.model,
      maxTokens: 131072
    };
  }
}

// Export singleton instance
export const geminiService = new GeminiService();
