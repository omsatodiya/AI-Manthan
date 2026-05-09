import OpenAI from 'openai';
import type { 
  EmbeddingMatch, 
  SangamConfig, 
  SangamContext 
} from '@/lib/types/sangam';

export class GeminiService {
  private client: OpenAI | null = null;
  private config: SangamConfig;
  private model: string;

  constructor(config?: Partial<SangamConfig>) {
    const apiKey = process.env.GROQ_API_KEY;
    this.model = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';
    
    if (apiKey) {
      this.client = new OpenAI({
        apiKey,
        baseURL: 'https://api.groq.com/openai/v1',
      });
    }

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
    
    if (!this.client) {
      throw new Error('GROQ_API_KEY is not configured. AI responses are unavailable.');
    }

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

RESPONSE GUIDELINES & HALLUCINATION GUARDRAILS:
1. **Source Fidelity**: Base your answers STRICTLY on the provided context. If the context doesn't contain enough information, say so clearly.
2. **Missing Document Content**: If the context mentions a document (e.g., "[Source: Document.pdf]") but the *Content* field is empty or only contains metadata, do NOT speculate about what might be inside the document. Instead, state: "I see that '[filename]' was shared, but its full content is not available in my current context to answer your specific question."
3. **Date Accuracy**: If a date in the context is listed as "invalid" or seems clearly wrong, do not use it. Refer to the relative timing (e.g., "recently" or "in a previous message") instead.
4. **No Speculation**: Never invent decisions, dates, or action items not explicitly stated in the context.
5. **Formatting**: Use markdown for better structure:
6. **Citations**: Whenever you use information from the context, you MUST cite the source using brackets, e.g., "The deadline is June 5th [Source: project_plan.pdf]". If multiple sources agree, cite them all.

Remember: You are helping teams stay organized and informed about their collaborative work. Integrity of information and traceability (via citations) are your highest priorities.`;
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
      if (!apiKey || !this.client) {
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

  /**
   * Refine noisy or fragmented text using Groq
   */
  async refineExtractedText(text: string, fileName: string): Promise<string> {
    if (!this.client || !text.trim()) return text;

    try {
      const completion = await this.client.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        temperature: 0.1,
        messages: [
          {
            role: 'system',
            content: `You are a document processing assistant. Your task is to take noisy, fragmented, or poorly formatted text extracted from a PDF/document named "${fileName}" and reconstruct it into a coherent, well-structured version. 
            
            RULES:
            - Preserve all factual information and numbers exactly.
            - Fix broken words and merge fragmented lines.
            - Re-structure lists, FAQs, and tables into readable markdown.
            - Remove repetitive headers/footers if they are obvious noise.
            - If the text is already coherent, return it as is.
            - Do NOT add external information.
            - Output ONLY the refined text.`
          },
          { role: 'user', content: text.substring(0, 8000) } // Limit to first 8k chars for refinement
        ],
      });

      return completion.choices[0]?.message?.content?.trim() || text;
    } catch (error) {
      console.error('Error refining text with Groq:', error);
      return text;
    }
  }

  /**
   * Extract text from image using Groq Vision
   */
  async extractTextFromImage(base64Image: string, mimeType: string): Promise<string> {
    if (!this.client) return '';

    try {
      const completion = await this.client.chat.completions.create({
        model: 'llama-3.2-11b-vision-preview',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Please perform high-accuracy OCR on this image. Extract all text exactly as it appears, preserving the structure of lists, tables, and paragraphs. Output ONLY the extracted text in markdown format.'
              },
              {
                type: 'image_url',
                image_url: {
                  url: `data:${mimeType};base64,${base64Image}`
                }
              }
            ]
          }
        ],
        max_tokens: 1024
      });

      return completion.choices[0]?.message?.content?.trim() || '';
    } catch (error) {
      console.error('Error extracting text from image with Groq Vision:', error);
      return 'Image content could not be extracted via OCR.';
    }
  }
  /**
   * Expand a user query into multiple search variations using Groq
   */
  async expandQuery(query: string): Promise<string[]> {
    if (!this.client || query.length < 10) return [query];

    try {
      const completion = await this.client.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        temperature: 0.3,
        messages: [
          {
            role: 'system',
            content: `You are a search expert. Your task is to expand a user's question into 3 concise search queries that will help find the most relevant information in a vector database. 
            
            Guidelines:
            - Create variations that use synonyms.
            - If the question mentions specific entities or documents, include them.
            - Keep each variation under 10 words.
            - Output ONLY a comma-separated list of the 3 queries.`
          },
          { role: 'user', content: `Expand this query: "${query}"` }
        ],
      });

      const expanded = completion.choices[0]?.message?.content?.trim() || query;
      const variations = expanded.split(',').map(s => s.trim()).filter(s => s.length > 0);
      
      // Ensure the original query is always included
      return Array.from(new Set([query, ...variations])).slice(0, 4);
    } catch (error) {
      console.error('Error expanding query with Groq:', error);
      return [query];
    }
  }
}

// Export singleton instance
export const geminiService = new GeminiService();
