/**
 * Sangam AI Library - Main Export
 * Centralized exports for all Sangam functionality
 */

// Core services
export { sangamService } from './sangam';
export { embeddingService } from './embeddings';
export { geminiService } from './gemini';
export { sangamSupabase } from './supabase';

// Types
export type {
  ChatEmbedding,
  EmbeddingMatch,
  UnembeddedMessage,
  EmbeddingStats,
  EmbeddingRequest,
  EmbeddingResponse,
  SangamQueryRequest,
  SangamQueryResponse,
  EmbeddingConfig,
  SangamConfig,
  OpenAIImbeddingResponse,
  GeminiResponse,
  EmbeddingBatch,
  SangamContext
} from '@/lib/types/sangam';

// Classes for advanced usage
export { SangamService } from './sangam';
export { EmbeddingService } from './embeddings';
export { GeminiService } from './gemini';
export { SangamSupabaseClient } from './supabase';
