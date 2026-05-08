/**
 * Sangam Supabase Client
 * Handles database operations for embeddings and vector search
 */

import {
  createClient,
  type SupabaseClient,
} from "@supabase/supabase-js";

import type {
  ChatEmbedding,
  EmbeddingMatch,
  UnembeddedMessage,
  EmbeddingStats,
} from "@/lib/types/sangam";

// ======================================================
// Database Row Types
// ======================================================

interface ChatMessageRow {
  id: string;
  tenant_id: string;

  content: string | null;

  created_at: string;
  updated_at?: string;

  attachment_id: string | null;
  attachment_name: string | null;
  attachment_type: string | null;
  attachment_size: number | null;
  attachment_url: string | null;
}

interface ChatEmbeddingRow {
  id: string;

  tenant_id: string;
  chat_id: string;

  content: string;

  embedding: number[];

  has_attachment: boolean;

  attachment_file_name: string | null;
  attachment_file_type: string | null;

  content_type: "message" | "document" | "mixed";

  chunk_index: number;
  chunk_total: number;

  created_at: string;
  updated_at: string;
}

// interface MatchMessageRow {
//   id: string;

//   chatId: string;

//   content: string;

//   similarity: number;

//   createdAt: string;

//   hasAttachment?: boolean;

//   attachmentFileName?: string | null;

//   attachmentFileType?: string | null;

//   contentType?: "message" | "document" | "mixed" | null;

//   chunkIndex?: number;

//   chunkTotal?: number;
// }

interface ExistingEmbeddingRow {
  chat_id: string;
}

// ======================================================
// Supabase Client
// ======================================================

let _supabase: SupabaseClient | null = null;

function getSupabase(): SupabaseClient {
  if (_supabase) {
    return _supabase;
  }

  const url =
    process.env.SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL;

  const key =
    process.env.SUPABASE_SERVICE_KEY ||
    process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error(
      "Missing Supabase configuration for Sangam."
    );
  }

  _supabase = createClient(url, key);

  return _supabase;
}

// ======================================================
// Error Helpers
// ======================================================

function getErrorCode(
  error: unknown
): string | undefined {
  if (
    error &&
    typeof error === "object" &&
    "code" in error
  ) {
    return String(
      (error as { code?: string }).code
    );
  }

  return undefined;
}

function getErrorMessage(
  error: unknown
): string {
  if (
    error &&
    typeof error === "object" &&
    "message" in error
  ) {
    return String(
      (error as { message?: string }).message
    );
  }

  return "Unknown error";
}

function isMissingEmbeddingsTableError(
  error: unknown
): boolean {
  const code = getErrorCode(error);

  const message = getErrorMessage(error)
    .toLowerCase();

  return (
    code === "PGRST205" &&
    message.includes(
      "could not find the table 'public.chat_embeddings'"
    )
  );
}

function isMissingTypedMatchFunctionError(
  error: unknown
): boolean {
  const code = getErrorCode(error);

  const message = getErrorMessage(error)
    .toLowerCase();

  return (
    code === "PGRST202" &&
    message.includes(
      "match_messages_with_types"
    )
  );
}

// ======================================================
// Sangam Supabase Client
// ======================================================

export class SangamSupabaseClient {
  // ======================================================
  // Get Single Message For Embedding
  // ======================================================

  async getMessageForEmbedding(
    tenantId: string,
    messageId: string
  ): Promise<UnembeddedMessage | null> {
    const { data, error } = await getSupabase()
      .from("chat_messages")
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
      .eq("tenant_id", tenantId)
      .eq("id", messageId)
      .single<ChatMessageRow>();

    if (error) {
      if (error.code === "PGRST116") {
        return null;
      }

      throw new Error(
        `Failed to fetch message: ${error.message}`
      );
    }

    if (!data) {
      return null;
    }

    return {
      id: data.id,

      content: data.content || "",

      createdAt: data.created_at,

      attachment:
        data.attachment_id ||
          data.attachment_url ||
          data.attachment_name
          ? {
            id:
              data.attachment_id ||
              data.id,

            fileName:
              data.attachment_name ||
              "Attachment",

            fileType:
              data.attachment_type ||
              "application/octet-stream",

            fileSize:
              data.attachment_size || 0,

            fileUrl:
              data.attachment_url || "",
          }
          : null,
    };
  }

  // ======================================================
  // Get Unembedded Messages
  // ======================================================

  async getUnembeddedMessages(
    tenantId: string,
    batchSize: number = 100
  ): Promise<UnembeddedMessage[]> {
    try {
      const {
        data: existingEmbeddings,
        error: embeddingError,
      } = await getSupabase()
        .from("chat_embeddings")
        .select("chat_id")
        .eq("tenant_id", tenantId)
        .returns<ExistingEmbeddingRow[]>();

      if (embeddingError) {
        throw new Error(
          embeddingError.message
        );
      }

      const existingChatIds =
        existingEmbeddings?.map(
          (embedding) => embedding.chat_id
        ) || [];

      let query = getSupabase()
        .from("chat_messages")
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
        .eq("tenant_id", tenantId)
        .or(
          "content.not.is.null,attachment_id.not.is.null"
        )
        .order("created_at", {
          ascending: true,
        })
        .limit(batchSize);

      if (existingChatIds.length > 0) {
        query = query.not(
          "id",
          "in",
          `(${existingChatIds.join(",")})`
        );
      }

      const { data, error } =
        await query.returns<
          ChatMessageRow[]
        >();

      if (error) {
        throw new Error(error.message);
      }

      return (data || []).map(
        (
          row: ChatMessageRow
        ): UnembeddedMessage => ({
          id: row.id,

          content: row.content || "",

          createdAt: row.created_at,

          attachment: row.attachment_id
            ? {
              id: row.attachment_id,

              fileName:
                row.attachment_name || "",

              fileType:
                row.attachment_type || "",

              fileSize:
                row.attachment_size || 0,

              fileUrl:
                row.attachment_url || "",
            }
            : null,
        })
      );
    } catch (error) {
      console.error(
        "Error in getUnembeddedMessages:",
        error
      );

      throw error;
    }
  }

  // ======================================================
  // Insert Embeddings
  // ======================================================

  async insertEmbeddings(
    embeddings: Omit<
      ChatEmbedding,
      "id" | "createdAt" | "updatedAt"
    >[]
  ): Promise<void> {
    try {
      if (embeddings.length === 0) {
        return;
      }

      const insertData = embeddings.map(
        (embedding) => ({
          tenant_id: embedding.tenantId,

          chat_id: embedding.chatId,

          content: embedding.content,

          embedding: embedding.embedding,

          has_attachment:
            embedding.hasAttachment || false,

          attachment_file_name:
            embedding.attachmentFileName ||
            null,

          attachment_file_type:
            embedding.attachmentFileType ||
            null,

          content_type:
            embedding.contentType ||
            "message",

          chunk_index:
            embedding.chunkIndex || 0,

          chunk_total:
            embedding.chunkTotal || 1,
        })
      );

      const { error } =
        await getSupabase()
          .from("chat_embeddings")
          .insert(insertData);

      if (error) {
        throw new Error(error.message);
      }
    } catch (error) {
      console.error(
        "Error inserting embeddings:",
        error
      );

      throw error;
    }
  }

  // ======================================================
  // Match Messages
  // ======================================================

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
        queryEmbedding.length === 0
      ) {
        throw new Error(
          "Invalid query embedding"
        );
      }

      if (!contentTypes) {
        const { data, error } =
          await getSupabase().rpc(
            "match_messages",
            {
              query_embedding:
                queryEmbedding,

              match_tenant_id:
                tenantId,

              match_count:
                matchCount,

              similarity_threshold:
                similarityThreshold,
            }
          );

        if (error) {
          throw new Error(error.message);
        }

        return (
          (data as EmbeddingMatch[]) ||
          []
        );
      }

      const { data, error } =
        await getSupabase().rpc(
          "match_messages_with_types",
          {
            query_embedding:
              queryEmbedding,

            match_tenant_id:
              tenantId,

            match_count:
              matchCount,

            similarity_threshold:
              similarityThreshold,

            content_types:
              contentTypes,
          }
        );

      if (error) {
        if (
          isMissingTypedMatchFunctionError(
            error
          )
        ) {
          const {
            data: fallbackData,
            error: fallbackError,
          } = await getSupabase().rpc(
            "match_messages",
            {
              query_embedding:
                queryEmbedding,

              match_tenant_id:
                tenantId,

              match_count:
                Math.max(
                  matchCount * 3,
                  20
                ),

              similarity_threshold:
                similarityThreshold,
            }
          );

          if (fallbackError) {
            throw new Error(
              fallbackError.message
            );
          }

          const allowedTypes =
            new Set(contentTypes);

          return (
            (
              fallbackData as EmbeddingMatch[]
            ) || []
          )
            .filter(
              (item) =>
                !!item.contentType &&
                allowedTypes.has(
                  item.contentType
                )
            )
            .slice(0, matchCount);
        }

        throw new Error(error.message);
      }

      return (
        (data as EmbeddingMatch[]) ||
        []
      );
    } catch (error) {
      console.error(
        "Error in matchMessages:",
        error
      );

      throw error;
    }
  }

  // ======================================================
  // Embedding Stats
  // ======================================================

  async getEmbeddingStats(
    tenantId: string
  ): Promise<EmbeddingStats> {
    try {
      const defaultStats: EmbeddingStats =
      {
        totalMessages: 0,
        embeddedMessages: 0,
        unembeddedMessages: 0,
        lastEmbeddingCreated: null,
      };

      const [
        totalRes,
        embeddedRes,
        lastRes,
      ] = await Promise.all([
        getSupabase()
          .from("chat_messages")
          .select("id", {
            count: "exact",
            head: true,
          })
          .eq("tenant_id", tenantId),

        getSupabase()
          .from("chat_embeddings")
          .select("chat_id")
          .eq("tenant_id", tenantId),

        getSupabase()
          .from("chat_embeddings")
          .select("created_at")
          .eq("tenant_id", tenantId)
          .order("created_at", {
            ascending: false,
          })
          .limit(1)
          .maybeSingle(),
      ]);

      if (
        totalRes.error ||
        embeddedRes.error
      ) {
        return defaultStats;
      }

      const totalMessages =
        totalRes.count ?? 0;

      const embeddedChatIds =
        new Set(
          (
            embeddedRes.data as ExistingEmbeddingRow[]
          ).map(
            (row) => row.chat_id
          )
        );

      const embeddedMessages =
        embeddedChatIds.size;

      const unembeddedMessages =
        Math.max(
          0,
          totalMessages -
          embeddedMessages
        );

      const lastEmbeddingCreated =
        (
          lastRes.data as {
            created_at?: string;
          } | null
        )?.created_at ?? null;

      return {
        totalMessages,

        embeddedMessages,

        unembeddedMessages,

        lastEmbeddingCreated,
      };
    } catch (error) {
      console.error(
        "Error in getEmbeddingStats:",
        error
      );

      return {
        totalMessages: 0,
        embeddedMessages: 0,
        unembeddedMessages: 0,
        lastEmbeddingCreated: null,
      };
    }
  }

  // ======================================================
  // Check Embedding Exists
  // ======================================================

  async hasEmbedding(
    chatId: string
  ): Promise<boolean> {
    try {
      const { data, error } =
        await getSupabase()
          .from("chat_embeddings")
          .select("id")
          .eq("chat_id", chatId)
          .maybeSingle();

      if (
        error &&
        error.code !== "PGRST116"
      ) {
        throw new Error(error.message);
      }

      return !!data;
    } catch (error) {
      console.error(
        "Error in hasEmbedding:",
        error
      );

      throw error;
    }
  }

  // ======================================================
  // Delete Embedding
  // ======================================================

  async deleteEmbedding(
    chatId: string
  ): Promise<void> {
    try {
      const { error } =
        await getSupabase()
          .from("chat_embeddings")
          .delete()
          .eq("chat_id", chatId);

      if (error) {
        throw new Error(error.message);
      }
    } catch (error) {
      console.error(
        "Error deleting embedding:",
        error
      );

      throw error;
    }
  }

  // ======================================================
  // Get All Embeddings
  // ======================================================

  async getAllEmbeddings(
    tenantId: string,
    limit: number = 1000
  ): Promise<ChatEmbedding[]> {
    try {
      const { data, error } =
        await getSupabase()
          .from("chat_embeddings")
          .select("*")
          .eq("tenant_id", tenantId)
          .order("created_at", {
            ascending: false,
          })
          .limit(limit)
          .returns<
            ChatEmbeddingRow[]
          >();

      if (error) {
        if (
          isMissingEmbeddingsTableError(
            error
          )
        ) {
          const {
            data: fallbackMessages,
            error: fallbackError,
          } = await getSupabase()
            .from("chat_messages")
            .select(`
              id,
              tenant_id,
              content,
              created_at,
              updated_at
            `)
            .eq(
              "tenant_id",
              tenantId
            )
            .or(
              "content.not.is.null,attachment_id.not.is.null"
            )
            .order("created_at", {
              ascending: false,
            })
            .limit(limit)
            .returns<
              ChatMessageRow[]
            >();

          if (fallbackError) {
            throw new Error(
              fallbackError.message
            );
          }

          return (
            fallbackMessages || []
          ).map(
            (
              row: ChatMessageRow
            ): ChatEmbedding => ({
              id: row.id,

              tenantId:
                row.tenant_id,

              chatId: row.id,

              content:
                row.content || "",

              embedding: [],

              hasAttachment: false,

              attachmentFileName:
                undefined,

              attachmentFileType:
                undefined,

              contentType:
                "message",

              chunkIndex: 0,

              chunkTotal: 1,

              createdAt:
                row.created_at,

              updatedAt:
                row.updated_at ||
                row.created_at,
            })
          );
        }

        throw new Error(error.message);
      }

      return (
        data || []
      ).map(
        (
          row: ChatEmbeddingRow
        ): ChatEmbedding => ({
          id: row.id,

          tenantId:
            row.tenant_id,

          chatId: row.chat_id,

          content: row.content,

          embedding:
            row.embedding,

          hasAttachment:
            row.has_attachment,

          attachmentFileName:
            row.attachment_file_name,

          attachmentFileType:
            row.attachment_file_type,

          contentType:
            row.content_type,

          chunkIndex:
            row.chunk_index,

          chunkTotal:
            row.chunk_total,

          createdAt:
            row.created_at,

          updatedAt:
            row.updated_at,
        })
      );
    } catch (error) {
      console.error(
        "Error in getAllEmbeddings:",
        error
      );

      throw error;
    }
  }
}

// ======================================================
// Singleton Export
// ======================================================

export const sangamSupabase =
  new SangamSupabaseClient();