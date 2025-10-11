/**
 * TypeScript types for Sangam AI Summarizer
 * Defines interfaces for embeddings, queries, and responses
 */

export interface ChatEmbedding {
  id: string;
  tenantId: string;
  chatId: string;
  content: string;
  embedding: number[];
  createdAt: string;
  updatedAt: string;
  hasAttachment?: boolean;
  attachmentFileName?: string;
  attachmentFileType?: string;
  contentType?: 'message' | 'document' | 'mixed';
  chunkIndex?: number;
  chunkTotal?: number;
}

export interface EmbeddingMatch {
  id: string;
  chatId: string;
  content: string;
  similarity: number;
  createdAt: string;
  hasAttachment?: boolean;
  attachmentFileName?: string;
  attachmentFileType?: string;
  contentType?: string;
  chunkIndex?: number;
  chunkTotal?: number;
}

export interface UnembeddedMessage {
  id: string;
  content: string;
  createdAt: string;
  attachment?: {
    id: string;
    fileName: string;
    fileType: string;
    fileSize: number;
    fileUrl: string;
  } | null;
}

export interface EmbeddingStats {
  totalMessages: number;
  embeddedMessages: number;
  unembeddedMessages: number;
  lastEmbeddingCreated: string | null;
}

export interface EmbeddingRequest {
  tenantId: string;
  batchSize?: number;
}

export interface EmbeddingResponse {
  success: boolean;
  message: string;
  processedCount?: number;
  error?: string;
}

export interface SangamQueryRequest {
  tenantId: string;
  question: string;
  maxResults?: number;
  similarityThreshold?: number;
}

export interface SangamQueryResponse {
  success: boolean;
  answer?: string;
  sources?: EmbeddingMatch[];
  error?: string;
  processingTime?: number;
}

export interface EmbeddingConfig {
  model: string;
  batchSize: number;
  maxRetries: number;
  retryDelay: number;
}

export interface SangamConfig {
  maxResults: number;
  similarityThreshold: number;
  maxContextLength: number;
  systemPrompt: string;
}

export interface OpenAIImbeddingResponse {
  data: Array<{
    embedding: number[];
    index: number;
  }>;
  model: string;
  usage: {
    prompt_tokens: number;
    total_tokens: number;
  };
}

export interface GeminiResponse {
  candidates: Array<{
    content: {
      parts: Array<{
        text: string;
      }>;
    };
    finishReason: string;
  }>;
  usageMetadata: {
    promptTokenCount: number;
    candidatesTokenCount: number;
    totalTokenCount: number;
  };
}

export interface EmbeddingBatch {
  messages: UnembeddedMessage[];
  embeddings: number[][];
}

export interface SangamContext {
  question: string;
  relevantMessages: EmbeddingMatch[];
  systemPrompt: string;
  maxContextLength: number;
}
