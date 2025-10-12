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

export class SangamSupabaseClient {
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

        
        // Debug: Check if there are any embeddings in the database
        const { data: allEmbeddings, error: checkError } = await supabase
          .from('chat_embeddings')
          .select('id, content, has_attachment, embedding')
          .eq('tenant_id', tenantId)
          .limit(5);
        
        if (checkError) {
          console.error('Error checking embeddings:', checkError);
        } else {
        }
        
        // Test the database function directly with a simple query
        if (allEmbeddings && allEmbeddings.length > 0) {
          const testEmbedding = allEmbeddings[0].embedding;
          
          if (testEmbedding && Array.isArray(testEmbedding)) {
            const { error: testError } = await supabase.rpc('match_messages', {
              query_embedding: testEmbedding,
              match_tenant_id: tenantId,
              match_count: 1,
              similarity_threshold: 0.1 // Very low threshold for testing
            });
            
            if (testError) {
              console.error('🔍 Database function test error:', testError);
            } else {
            }
          } else {
            console.error('🔍 Test embedding is not a valid array!');
          }
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
      const { data, error } = await supabase.rpc('get_embedding_stats', {
        target_tenant_id: tenantId
      });

      if (error) {
        console.error('Error fetching embedding stats:', error);
        throw new Error(`Failed to fetch embedding stats: ${error.message}`);
      }

      const stats = data?.[0];
      if (!stats) {
        return {
          totalMessages: 0,
          embeddedMessages: 0,
          unembeddedMessages: 0,
          lastEmbeddingCreated: null
        };
      }

      return {
        totalMessages: stats.total_messages || 0,
        embeddedMessages: stats.embedded_messages || 0,
        unembeddedMessages: stats.unembedded_messages || 0,
        lastEmbeddingCreated: stats.last_embedding_created || null
      };
    } catch (error) {
      console.error('Error in getEmbeddingStats:', error);
      throw error;
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
