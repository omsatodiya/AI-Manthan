/**
 * Sangam Embeddings Module
 * Handles OpenAI embedding generation and batch processing
 */

import type { 
  UnembeddedMessage, 
  EmbeddingBatch, 
  EmbeddingConfig,
  OpenAIImbeddingResponse 
} from '@/lib/types/sangam';
import { sangamSupabase } from './supabase';
import { documentExtractor } from './document-extractor';

type ProcessedSegment = {
  messageId: string;
  contentType: 'message' | 'document' | 'mixed';
  chunkIndex: number;
  chunkTotal: number;
};

export class EmbeddingService {
  private config: EmbeddingConfig;

  constructor(config?: Partial<EmbeddingConfig>) {
    this.config = {
      model: 'text-embedding-3-small',
      batchSize: 100,
      maxRetries: 3,
      retryDelay: 1000,
      ...config
    };
  }

  /**
   * Generate embeddings for a batch of messages
   */
  async generateEmbeddings(messages: UnembeddedMessage[]): Promise<{ embeddings: number[][], processedContents: string[], chunkInfo: Array<{chunkIndex: number, chunkTotal: number}>, segments: ProcessedSegment[] }> {
    if (messages.length === 0) {
      return { embeddings: [], processedContents: [], chunkInfo: [], segments: [] };
    }

    const allTexts: string[] = [];
    const allChunkInfo: Array<{chunkIndex: number, chunkTotal: number}> = [];
    const segments: ProcessedSegment[] = [];

    for (const msg of messages) {
      const content = this.normalizeText(msg.content);
      
      if (msg.attachment) {
        try {
          const extractedContent = await documentExtractor.extractContent(msg.attachment);
          if (extractedContent) {
            const chunks = this.chunkDocument(extractedContent.text);
            
            chunks.forEach((chunk, index) => {
              const chunkContent = `Document: ${msg.attachment?.fileName || 'Unknown'}\nType: ${extractedContent.metadata.fileType}\nChunk ${index + 1}/${chunks.length}\nContent: ${chunk}`;
              allTexts.push(chunkContent);
              allChunkInfo.push({ chunkIndex: index, chunkTotal: chunks.length });
              segments.push({
                messageId: msg.id,
                contentType: 'document',
                chunkIndex: index,
                chunkTotal: chunks.length
              });
            });
            
            if (content) {
              const messageContent = `Message: ${content}\n\nDocument: ${msg.attachment?.fileName || 'Unknown'} (${msg.attachment?.fileType || 'Unknown'})`;
              allTexts.push(messageContent);
              allChunkInfo.push({ chunkIndex: chunks.length, chunkTotal: chunks.length + 1 });
              segments.push({
                messageId: msg.id,
                contentType: 'mixed',
                chunkIndex: chunks.length,
                chunkTotal: chunks.length + 1
              });
            }
          } else {
            const fallbackContent = content 
              ? `${content}\n\nDocument: ${msg.attachment?.fileName || 'Unknown'} (${msg.attachment?.fileType || 'Unknown'})`
              : `Document: ${msg.attachment?.fileName || 'Unknown'} (${msg.attachment?.fileType || 'Unknown'})`;
            allTexts.push(fallbackContent);
            allChunkInfo.push({ chunkIndex: 0, chunkTotal: 1 });
            segments.push({
              messageId: msg.id,
              contentType: content ? 'mixed' : 'document',
              chunkIndex: 0,
              chunkTotal: 1
            });
          }
        } catch (error) {
          console.error(`Error processing attachment ${msg.attachment?.fileName || 'Unknown'}:`, error);
          const fallbackContent = content 
            ? `${content}\n\nDocument: ${msg.attachment?.fileName || 'Unknown'} (${msg.attachment?.fileType || 'Unknown'}) - Processing failed`
            : `Document: ${msg.attachment?.fileName || 'Unknown'} (${msg.attachment?.fileType || 'Unknown'}) - Processing failed`;
          allTexts.push(fallbackContent);
          allChunkInfo.push({ chunkIndex: 0, chunkTotal: 1 });
          segments.push({
            messageId: msg.id,
            contentType: content ? 'mixed' : 'document',
            chunkIndex: 0,
            chunkTotal: 1
          });
        }
      } else {
        allTexts.push(content);
        allChunkInfo.push({ chunkIndex: 0, chunkTotal: 1 });
        segments.push({
          messageId: msg.id,
          contentType: 'message',
          chunkIndex: 0,
          chunkTotal: 1
        });
      }
    }
    
    try {
      const response = await this.callOpenAIAPI(allTexts);
      return {
        embeddings: response.data.map(item => item.embedding),
        processedContents: allTexts,
        chunkInfo: allChunkInfo,
        segments
      };
    } catch (error) {
      console.error('Error generating embeddings:', error);
      throw new Error(`Failed to generate embeddings: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Chunk large documents into smaller pieces for better embedding
   */
  private chunkDocument(text: string): string[] {
    const maxChunkSize = 4000; // Characters per chunk
    const overlap = 200; // Overlap between chunks
    
    if (text.length <= maxChunkSize) {
      return [text];
    }
    
    const chunks: string[] = [];
    let start = 0;
    
    while (start < text.length) {
      let end = start + maxChunkSize;
      
      // Try to break at a sentence or paragraph boundary
      if (end < text.length) {
        const lastPeriod = text.lastIndexOf('.', end);
        const lastNewline = text.lastIndexOf('\n', end);
        const lastSpace = text.lastIndexOf(' ', end);
        
        // Prefer sentence breaks, then paragraph breaks, then word breaks
        if (lastPeriod > start + maxChunkSize * 0.7) {
          end = lastPeriod + 1;
        } else if (lastNewline > start + maxChunkSize * 0.7) {
          end = lastNewline + 1;
        } else if (lastSpace > start + maxChunkSize * 0.7) {
          end = lastSpace + 1;
        }
      }
      
      const chunk = text.slice(start, end).trim();
      if (chunk.length > 0) {
        chunks.push(chunk);
      }
      
      // Move start position with overlap
      start = end - overlap;
      if (start >= text.length) break;
    }
    
    return chunks;
  }

  /**
   * Process unembedded messages for a tenant
   */
  async processUnembeddedMessages(
    tenantId: string, 
    batchSize?: number
  ): Promise<{ processedCount: number; error?: string }> {
    try {
      const messages = await sangamSupabase.getUnembeddedMessages(
        tenantId, 
        batchSize || this.config.batchSize
      );

      if (messages.length === 0) {
        return { processedCount: 0 };
      }


      // Generate embeddings in batches to avoid API limits
      const batches = this.createBatches(messages, 50); // OpenAI allows up to 2048 inputs per request
      let totalProcessed = 0;
      const batchErrors: string[] = [];

      for (const batch of batches) {
        try {
          const { embeddings, processedContents, segments } = await this.generateEmbeddings(batch.messages);
          const messageMap = new Map(batch.messages.map((message) => [message.id, message]));
          const embeddingData = processedContents
            .map((content, index) => {
              const segment = segments[index];
              const sourceMessage = segment ? messageMap.get(segment.messageId) : null;
              if (!segment || !sourceMessage || !embeddings[index]) {
                return null;
              }
              return {
                tenantId,
                chatId: sourceMessage.id,
                content,
                embedding: embeddings[index],
                hasAttachment: !!sourceMessage.attachment,
                attachmentFileName: sourceMessage.attachment?.fileName,
                attachmentFileType: sourceMessage.attachment?.fileType,
                contentType: segment.contentType,
                chunkIndex: segment.chunkIndex,
                chunkTotal: segment.chunkTotal
              };
            })
            .filter((item): item is NonNullable<typeof item> => item !== null);

          await sangamSupabase.insertEmbeddings(embeddingData);
          totalProcessed += batch.messages.length;

        } catch (error) {
          console.error(`Error processing batch:`, error);
          const errorMessage =
            error instanceof Error ? error.message : "Unknown batch error";
          if (!batchErrors.includes(errorMessage)) {
            batchErrors.push(errorMessage);
          }
          // Continue with next batch instead of failing completely
        }
      }

      if (totalProcessed === 0 && batchErrors.length > 0) {
        return { processedCount: 0, error: batchErrors[0] };
      }
      return { processedCount: totalProcessed };
    } catch (error) {
      console.error('Error processing unembedded messages:', error);
      return { 
        processedCount: 0, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /**
   * Generate embedding for a single text query
   */
  async generateQueryEmbedding(query: string): Promise<number[]> {
    try {
      const normalizedQuery = this.normalizeText(query);
      const response = await this.callOpenAIAPI([normalizedQuery]);
      const embedding = response.data[0].embedding;
      return embedding;
    } catch (error) {
      console.error('Error generating query embedding:', error);
      throw new Error(`Failed to generate query embedding: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Call OpenAI Embeddings API with retry logic
   */
  private async callOpenAIAPI(texts: string[]): Promise<OpenAIImbeddingResponse> {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY environment variable is not set');
    }

    for (let attempt = 1; attempt <= this.config.maxRetries; attempt++) {
      try {
        const response = await fetch('https://api.openai.com/v1/embeddings', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: this.config.model,
            input: texts,
            encoding_format: 'float'
          }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          const errorMessage = errorData.error?.message || 'Unknown error';
          if (response.status === 401) {
            throw new Error(`Invalid OPENAI_API_KEY: ${errorMessage}`);
          }
          throw new Error(`OpenAI API error: ${response.status} ${response.statusText} - ${errorMessage}`);
        }

        const data: OpenAIImbeddingResponse = await response.json();
        return data;
      } catch (error) {
        console.error(`OpenAI API attempt ${attempt} failed:`, error);
        const message =
          error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();
        if (message.includes("invalid openai_api_key")) {
          throw error;
        }
        
        if (attempt === this.config.maxRetries) {
          throw error;
        }

        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, this.config.retryDelay * attempt));
      }
    }

    throw new Error('Max retries exceeded');
  }

  /**
   * Normalize text for embedding generation
   */
  private normalizeText(text: string): string {
    return text
      .trim()
      .replace(/\s+/g, ' ') // Replace multiple whitespace with single space
      .substring(0, 15000); // Increased limit for longer documents (OpenAI limit is 8192 tokens, ~15000 chars is safe)
  }

  /**
   * Create batches of messages for processing
   */
  private createBatches(messages: UnembeddedMessage[], batchSize: number): EmbeddingBatch[] {
    const batches: EmbeddingBatch[] = [];
    
    for (let i = 0; i < messages.length; i += batchSize) {
      batches.push({
        messages: messages.slice(i, i + batchSize),
        embeddings: []
      });
    }
    
    return batches;
  }

  /**
   * Get embedding statistics for a tenant
   */
  async getEmbeddingStats(tenantId: string) {
    return await sangamSupabase.getEmbeddingStats(tenantId);
  }

  async processMessageOnUpload(
    tenantId: string,
    messageId: string
  ): Promise<{ processedCount: number; error?: string }> {
    try {
      const message = await sangamSupabase.getMessageForEmbedding(tenantId, messageId);
      if (!message) {
        return { processedCount: 0, error: 'Message not found for embedding' };
      }
      const { embeddings, processedContents, segments } = await this.generateEmbeddings([message]);
      const embeddingData = processedContents
        .map((content, index) => {
          const segment = segments[index];
          if (!segment || !embeddings[index]) {
            return null;
          }
          return {
            tenantId,
            chatId: message.id,
            content,
            embedding: embeddings[index],
            hasAttachment: !!message.attachment,
            attachmentFileName: message.attachment?.fileName,
            attachmentFileType: message.attachment?.fileType,
            contentType: segment.contentType,
            chunkIndex: segment.chunkIndex,
            chunkTotal: segment.chunkTotal
          };
        })
        .filter((item): item is NonNullable<typeof item> => item !== null);

      if (embeddingData.length === 0) {
        return { processedCount: 0 };
      }

      await sangamSupabase.deleteEmbedding(message.id);
      await sangamSupabase.insertEmbeddings(embeddingData);
      return { processedCount: 1 };
    } catch (error) {
      return {
        processedCount: 0,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Validate OpenAI API key and model availability
   */
  async validateConfiguration(): Promise<{ valid: boolean; error?: string }> {
    try {
      const apiKey = process.env.OPENAI_API_KEY;
      if (!apiKey) {
        return { valid: false, error: 'OPENAI_API_KEY environment variable is not set' };
      }

      // Test API with a simple request
      await this.generateQueryEmbedding('test');
      return { valid: true };
    } catch (error) {
      return { 
        valid: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }
}

// Export singleton instance
export const embeddingService = new EmbeddingService();
