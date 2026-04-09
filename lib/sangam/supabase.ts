/**
 * Sangam Supabase Client
 * Handles database operations for embeddings and vector search
 */

import { createClient } from '@supabase/supabase-js';
import type { 
  ChatEmbedding, 
  EmbeddingMatch, 
  UnembeddedMessage, 
  EmbeddingStats 
} from '@/lib/types/sangam';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase configuration for Sangam');
}

// Create Supabase client with service key for admin operations
const supabase = createClient(supabaseUrl, supabaseServiceKey);

function isMissingEmbeddingsTableError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  const code = String((error as { code?: string }).code || '');
  const message = String((error as { message?: string }).message || '').toLowerCase();
  return (
    code === 'PGRST205' &&
    message.includes("could not find the table 'public.chat_embeddings'")
  );
}

function isMissingTypedMatchFunctionError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  const code = String((error as { code?: string }).code || '');
  const message = String((error as { message?: string }).message || '').toLowerCase();
  return code === 'PGRST202' && message.includes('match_messages_with_types');
}

export class SangamSupabaseClient {
  async getMessageForEmbedding(
    tenantId: string,
    messageId: string
  ): Promise<UnembeddedMessage | null> {
    const { data, error } = await supabase
      .from('chat_messages')
      .select(`
        id,
        content,
        created_at,
        attachment_id,
        attachment_name,
        attachment_type,
        attachment_size,
        attachment_url
      `)
      .eq('tenant_id', tenantId)
      .eq('id', messageId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw new Error(`Failed to fetch message for embedding: ${error.message}`);
    }

    if (!data) {
      return null;
    }

    return {
      id: data.id,
      content: data.content || '',
      createdAt: data.created_at,
      attachment:
        data.attachment_id || data.attachment_url || data.attachment_name
          ? {
              id: data.attachment_id || data.attachment_url || data.id,
              fileName: data.attachment_name || 'Attachment',
              fileType: data.attachment_type || 'application/octet-stream',
              fileSize: data.attachment_size || 0,
              fileUrl: data.attachment_url || ''
            }
          : null
    };
  }

  /**
   * Get unembedded messages for a tenant
   */
  async getUnembeddedMessages(
    tenantId: string, 
    batchSize: number = 100
  ): Promise<UnembeddedMessage[]> {
    try {
      // First, get all chat_ids that already have embeddings
      const { data: existingEmbeddings, error: embeddingError } = await supabase
        .from('chat_embeddings')
        .select('chat_id')
        .eq('tenant_id', tenantId);

      if (embeddingError) {
        console.error('Error fetching existing embeddings:', embeddingError);
        throw new Error(`Failed to fetch existing embeddings: ${embeddingError.message}`);
      }

      const existingChatIds = existingEmbeddings?.map(e => e.chat_id) || [];

      // Then get unembedded messages
      let query = supabase
        .from('chat_messages')
        .select(`
          id,
          content,
          created_at,
          attachment_id,
          attachment_name,
          attachment_type,
          attachment_size,
          attachment_url
        `)
        .eq('tenant_id', tenantId)
        .or('content.not.is.null,attachment_id.not.is.null')
        .order('created_at', { ascending: true })
        .limit(batchSize);

      // Filter out messages that already have embeddings
      if (existingChatIds.length > 0) {
        query = query.not('id', 'in', `(${existingChatIds.join(',')})`);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching unembedded messages:', error);
        throw new Error(`Failed to fetch unembedded messages: ${error.message}`);
      }

      return (data || []).map(row => ({
        id: row.id,
        content: row.content || '',
        createdAt: row.created_at,
        attachment: row.attachment_id ? {
          id: row.attachment_id,
          fileName: row.attachment_name || '',
          fileType: row.attachment_type || '',
          fileSize: row.attachment_size || 0,
          fileUrl: row.attachment_url || ''
        } : null
      }));
    } catch (error) {
      console.error('Error in getUnembeddedMessages:', error);
      throw error;
    }
  }

  /**
   * Insert embeddings into the database
   */
  async insertEmbeddings(embeddings: Omit<ChatEmbedding, 'id' | 'createdAt' | 'updatedAt'>[]): Promise<void> {
    try {
      if (embeddings.length === 0) {
        return;
      }

       const insertData = embeddings.map(embedding => {
         const processedEmbedding = Array.isArray(embedding.embedding) ? embedding.embedding : JSON.parse(embedding.embedding);
         return {
           tenant_id: embedding.tenantId,
           chat_id: embedding.chatId,
           content: embedding.content,
           embedding: processedEmbedding,
           has_attachment: embedding.hasAttachment || false,
           attachment_file_name: embedding.attachmentFileName || null,
           attachment_file_type: embedding.attachmentFileType || null,
           content_type: embedding.contentType || 'message',
           chunk_index: embedding.chunkIndex || 0,
           chunk_total: embedding.chunkTotal || 1
         };
       });

      const { error } = await supabase
        .from('chat_embeddings')
        .insert(insertData);

      if (error) {
        console.error('Error inserting embeddings:', error);
        throw new Error(`Failed to insert embeddings: ${error.message}`);
      }
    } catch (error) {
      console.error('Error in insertEmbeddings:', error);
      throw error;
    }
  }

  /**
   * Perform similarity search using vector embeddings
   */
  async matchMessages(
    queryEmbedding: number[],
    tenantId: string,
    matchCount: number = 10,
    similarityThreshold: number = 0.5,
    contentTypes?: string[]
  ): Promise<EmbeddingMatch[]> {
    try {
      if (
        !Array.isArray(queryEmbedding) ||
        queryEmbedding.length === 0 ||
        queryEmbedding.some((value) => typeof value !== 'number' || Number.isNaN(value))
      ) {
        throw new Error('Invalid query embedding generated for similarity search');
      }

      // Use the original function if no content types specified
      if (!contentTypes) {
        const { data, error } = await supabase.rpc('match_messages', {
          query_embedding: queryEmbedding,
          match_tenant_id: tenantId,
          match_count: matchCount,
          similarity_threshold: similarityThreshold
        });

        if (error) {
          console.error('Error performing similarity search:', error);
          throw new Error(`Failed to perform similarity search: ${error.message}`);
        }
        
        return data || [];
      }

      // Use the enhanced function with content types
      const { data, error } = await supabase.rpc('match_messages_with_types', {
        query_embedding: queryEmbedding,
        match_tenant_id: tenantId,
        match_count: matchCount,
        similarity_threshold: similarityThreshold,
        content_types: contentTypes
      });

      if (error) {
        if (isMissingTypedMatchFunctionError(error)) {
          const { data: fallbackData, error: fallbackError } = await supabase.rpc('match_messages', {
            query_embedding: queryEmbedding,
            match_tenant_id: tenantId,
            match_count: Math.max(matchCount * 3, 20),
            similarity_threshold: similarityThreshold
          });
          if (fallbackError) {
            console.error('Error performing fallback similarity search:', fallbackError);
            throw new Error(`Failed to perform fallback similarity search: ${fallbackError.message}`);
          }
          const allowedTypes = new Set(contentTypes);
          return (fallbackData || [])
            .filter((item: EmbeddingMatch) =>
              !!item.contentType && allowedTypes.has(item.contentType)
            )
            .slice(0, matchCount);
        }
        console.error('Error performing similarity search:', error);
        throw new Error(`Failed to perform similarity search: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      console.error('Error in matchMessages:', error);
      throw error;
    }
  }

  /**
   * Get embedding statistics for a tenant
   */
  async getEmbeddingStats(tenantId: string): Promise<EmbeddingStats> {
    try {
      const defaultStats: EmbeddingStats = {
        totalMessages: 0,
        embeddedMessages: 0,
        unembeddedMessages: 0,
        lastEmbeddingCreated: null
      };

      const [totalRes, embeddedRes, lastRes] = await Promise.all([
        supabase.from('chat_messages').select('id', { count: 'exact', head: true }).eq('tenant_id', tenantId),
        supabase.from('chat_embeddings').select('chat_id').eq('tenant_id', tenantId),
        supabase.from('chat_embeddings').select('created_at').eq('tenant_id', tenantId).order('created_at', { ascending: false }).limit(1).maybeSingle()
      ]);

      if (totalRes.error || embeddedRes.error) {
        return defaultStats;
      }

      const totalMessages = totalRes.count ?? 0;
      const embeddedChatIds = new Set((embeddedRes.data || []).map((r: { chat_id: string }) => r.chat_id));
      const embeddedMessages = embeddedChatIds.size;
      const unembeddedMessages = Math.max(0, totalMessages - embeddedMessages);
      const lastEmbeddingCreated = lastRes.data?.created_at ?? null;

      return {
        totalMessages,
        embeddedMessages,
        unembeddedMessages,
        lastEmbeddingCreated
      };
    } catch (error) {
      console.error('Error in getEmbeddingStats:', error);
      return {
        totalMessages: 0,
        embeddedMessages: 0,
        unembeddedMessages: 0,
        lastEmbeddingCreated: null
      };
    }
  }

  /**
   * Check if a message already has an embedding
   */
  async hasEmbedding(chatId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('chat_embeddings')
        .select('id')
        .eq('chat_id', chatId)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
        console.error('Error checking embedding existence:', error);
        throw new Error(`Failed to check embedding existence: ${error.message}`);
      }

      return !!data;
    } catch (error) {
      console.error('Error in hasEmbedding:', error);
      throw error;
    }
  }

  /**
   * Delete embeddings for a specific chat message
   */
  async deleteEmbedding(chatId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('chat_embeddings')
        .delete()
        .eq('chat_id', chatId);

      if (error) {
        console.error('Error deleting embedding:', error);
        throw new Error(`Failed to delete embedding: ${error.message}`);
      }
    } catch (error) {
      console.error('Error in deleteEmbedding:', error);
      throw error;
    }
  }

  /**
   * Get all embeddings for a tenant (for debugging/analytics)
   */
  async getAllEmbeddings(tenantId: string, limit: number = 1000): Promise<ChatEmbedding[]> {
    try {
      const { data, error } = await supabase
        .from('chat_embeddings')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        if (isMissingEmbeddingsTableError(error)) {
          const { data: fallbackMessages, error: fallbackError } = await supabase
            .from('chat_messages')
            .select('id, tenant_id, content, created_at, updated_at')
            .eq('tenant_id', tenantId)
            .or('content.not.is.null,attachment_id.not.is.null')
            .order('created_at', { ascending: false })
            .limit(limit);

          if (fallbackError) {
            console.error('Error fetching fallback messages:', fallbackError);
            throw new Error(`Failed to fetch fallback messages: ${fallbackError.message}`);
          }

          return (fallbackMessages || []).map(row => ({
            id: row.id,
            tenantId: row.tenant_id,
            chatId: row.id,
            content: row.content || '',
            embedding: [],
            hasAttachment: false,
            attachmentFileName: undefined,
            attachmentFileType: undefined,
            contentType: 'message',
            chunkIndex: 0,
            chunkTotal: 1,
            createdAt: row.created_at,
            updatedAt: row.updated_at || row.created_at
          }));
        }
        console.error('Error fetching all embeddings:', error);
        throw new Error(`Failed to fetch embeddings: ${error.message}`);
      }

      return (data || []).map(row => ({
        id: row.id,
        tenantId: row.tenant_id,
        chatId: row.chat_id,
        content: row.content,
        embedding: row.embedding,
        hasAttachment: row.has_attachment,
        attachmentFileName: row.attachment_file_name,
        attachmentFileType: row.attachment_file_type,
        contentType: row.content_type,
        chunkIndex: row.chunk_index,
        chunkTotal: row.chunk_total,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      }));
    } catch (error) {
      console.error('Error in getAllEmbeddings:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const sangamSupabase = new SangamSupabaseClient();
