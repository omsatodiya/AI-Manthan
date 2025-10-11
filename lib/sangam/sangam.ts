/**
 * Sangam AI Service
 * Main orchestrator for AI summarization and question answering
 */

import type {
  SangamQueryRequest,
  SangamQueryResponse,
  EmbeddingMatch,
  SangamConfig,
  ChatEmbedding,
} from "@/lib/types/sangam";
import { sangamSupabase } from "./supabase";
import { embeddingService } from "./embeddings";
import { geminiService } from "./gemini";

export class SangamService {
  private config: SangamConfig;

  constructor(config?: Partial<SangamConfig>) {
    this.config = {
      maxResults: 15,
      similarityThreshold: 0.3,
      maxContextLength: 8000,
      systemPrompt: "",
      ...config,
    };
  }

  /**
   * Process a user query and return an AI-generated response
   */
  async processQuery(
    request: SangamQueryRequest
  ): Promise<SangamQueryResponse> {
    const startTime = Date.now();

    try {
      const { tenantId, question, maxResults, similarityThreshold } = request;

      if (!tenantId || !question.trim()) {
        return {
          success: false,
          error: "Tenant ID and question are required",
        };
      }

      const queryEmbedding = await embeddingService.generateQueryEmbedding(
        question
      );
      const relevantMessages = await sangamSupabase.matchMessages(
        queryEmbedding,
        tenantId,
        maxResults || this.config.maxResults,
        similarityThreshold || 0.3
      );

      console.log(`Found ${relevantMessages.length} relevant messages`);

      if (relevantMessages.length === 0) {
        return {
          success: true,
          answer:
            "I don't have enough relevant context to answer your question. There may not be enough conversations in your community yet, or the question might be about topics that haven't been discussed recently.",
          sources: [],
          processingTime: Date.now() - startTime,
        };
      }

      const answer = await geminiService.answerQuestion(
        question,
        relevantMessages
      );

      const processingTime = Date.now() - startTime;

      return {
        success: true,
        answer,
        sources: [],
        processingTime,
      };
    } catch (error) {
      console.error("Error processing Sangam query:", error);
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
        processingTime: Date.now() - startTime,
      };
    }
  }

  /**
   * Generate a summary of recent conversations for a tenant
   */
  async generateSummary(
    tenantId: string,
    timeRange?: string,
    maxResults: number = 20
  ): Promise<SangamQueryResponse> {
    const startTime = Date.now();

    try {
      if (!tenantId) {
        return {
          success: false,
          error: "Tenant ID is required",
        };
      }

      const recentMessages = await this.getRecentMessages(tenantId, maxResults);

      if (recentMessages.length === 0) {
        return {
          success: true,
          answer: "No recent conversations found to summarize.",
          sources: [],
          processingTime: Date.now() - startTime,
        };
      }

      const summary = await geminiService.generateSummary(
        recentMessages,
        timeRange
      );

      return {
        success: true,
        answer: summary,
        sources: [],
        processingTime: Date.now() - startTime,
      };
    } catch (error) {
      console.error("Error generating summary:", error);
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
        processingTime: Date.now() - startTime,
      };
    }
  }

  /**
   * Search specifically for documents
   */
  async searchDocuments(
    tenantId: string,
    query: string,
    maxResults: number = 10
  ): Promise<SangamQueryResponse> {
    const startTime = Date.now();

    try {
      if (!tenantId || !query.trim()) {
        return {
          success: false,
          error: "Tenant ID and query are required",
        };
      }

      const queryEmbedding = await embeddingService.generateQueryEmbedding(
        query
      );

      const relevantMessages = await sangamSupabase.matchMessages(
        queryEmbedding,
        tenantId,
        maxResults,
        0.3,
        ["document", "mixed"]
      );

      if (relevantMessages.length === 0) {
        return {
          success: true,
          answer: "No relevant documents found for your query.",
          sources: [],
          processingTime: Date.now() - startTime,
        };
      }

      const answer = await geminiService.answerQuestion(
        `Find and summarize documents related to: ${query}`,
        relevantMessages
      );

      return {
        success: true,
        answer,
        sources: [],
        processingTime: Date.now() - startTime,
      };
    } catch (error) {
      console.error("Error searching documents:", error);
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
        processingTime: Date.now() - startTime,
      };
    }
  }

  /**
   * Extract specific information from conversations
   */
  async extractInformation(
    tenantId: string,
    infoType: "decisions" | "deadlines" | "documents" | "action-items",
    maxResults: number = 15
  ): Promise<SangamQueryResponse> {
    const startTime = Date.now();

    try {
      if (!tenantId) {
        return {
          success: false,
          error: "Tenant ID is required",
        };
      }

      const relevantMessages = await this.getRelevantMessagesForInfoType(
        tenantId,
        infoType,
        maxResults
      );

      if (relevantMessages.length === 0) {
        return {
          success: true,
          answer: `No relevant information found for ${infoType.replace(
            "-",
            " "
          )}.`,
          sources: [],
          processingTime: Date.now() - startTime,
        };
      }

      const extractedInfo = await geminiService.extractKeyInfo(
        relevantMessages,
        infoType
      );

      return {
        success: true,
        answer: extractedInfo,
        sources: [],
        processingTime: Date.now() - startTime,
      };
    } catch (error) {
      console.error("Error extracting information:", error);
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
        processingTime: Date.now() - startTime,
      };
    }
  }

  /**
   * Get recent messages for a tenant (simplified approach)
   */
  private async getRecentMessages(
    tenantId: string,
    maxResults: number
  ): Promise<EmbeddingMatch[]> {
    const allEmbeddings = await sangamSupabase.getAllEmbeddings(
      tenantId,
      maxResults * 2
    );

    return allEmbeddings
      .map((embedding) => ({
        id: embedding.id,
        chatId: embedding.chatId,
        content: embedding.content,
        similarity: 1.0,
        createdAt: embedding.createdAt,
      }))
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
      .slice(0, maxResults);
  }

  /**
   * Get relevant messages for specific information types
   */
  private async getRelevantMessagesForInfoType(
    tenantId: string,
    infoType: string,
    maxResults: number
  ): Promise<EmbeddingMatch[]> {
    const searchQueries = this.getSearchQueriesForInfoType(infoType);

    let allMatches: EmbeddingMatch[] = [];

    for (const query of searchQueries) {
      try {
        const queryEmbedding = await embeddingService.generateQueryEmbedding(
          query
        );
        const matches = await sangamSupabase.matchMessages(
          queryEmbedding,
          tenantId,
          Math.ceil(maxResults / searchQueries.length),
          0.3
        );
        allMatches.push(...matches);
      } catch (error) {
        console.error(`Error searching for "${query}":`, error);
      }
    }

    const uniqueMatches = allMatches.filter(
      (match, index, self) =>
        index === self.findIndex((m) => m.chatId === match.chatId)
    );

    return uniqueMatches
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, maxResults);
  }

  /**
   * Get search queries for different information types
   */
  private getSearchQueriesForInfoType(infoType: string): string[] {
    const queryMap: Record<string, string[]> = {
      decisions: [
        "decision made",
        "we decided",
        "agreed to",
        "concluded that",
        "final decision",
        "voted on",
        "approved",
      ],
      deadlines: [
        "deadline",
        "due date",
        "by when",
        "schedule",
        "timeline",
        "meeting time",
        "event date",
        "deadline is",
      ],
      documents: [
        "document shared",
        "file uploaded",
        "attachment",
        "PDF",
        "spreadsheet",
        "presentation",
        "report",
        "link to",
      ],
      "action-items": [
        "action item",
        "todo",
        "task assigned",
        "need to do",
        "follow up",
        "next steps",
        "responsibility",
        "will handle",
      ],
    };

    return queryMap[infoType] || [];
  }

  /**
   * Get embedding statistics for a tenant
   */
  async getEmbeddingStats(tenantId: string) {
    return await embeddingService.getEmbeddingStats(tenantId);
  }

  /**
   * Process unembedded messages for a tenant
   */
  async processUnembeddedMessages(tenantId: string, batchSize?: number) {
    return await embeddingService.processUnembeddedMessages(
      tenantId,
      batchSize
    );
  }

  /**
   * Validate all service configurations
   */
  async validateConfiguration(): Promise<{
    valid: boolean;
    errors: string[];
    services: {
      supabase: boolean;
      embeddings: boolean;
      gemini: boolean;
    };
  }> {
    const errors: string[] = [];
    const services = {
      supabase: true,
      embeddings: false,
      gemini: false,
    };

    try {
      await sangamSupabase.getEmbeddingStats("test-tenant-id");
    } catch (error) {
      if (error instanceof Error && !error.message.includes("tenant")) {
        services.supabase = false;
        errors.push("Supabase connection failed");
      }
    }

    const embeddingValidation = await embeddingService.validateConfiguration();
    services.embeddings = embeddingValidation.valid;
    if (!embeddingValidation.valid && embeddingValidation.error) {
      errors.push(`Embeddings: ${embeddingValidation.error}`);
    }

    const geminiValidation = await geminiService.validateConfiguration();
    services.gemini = geminiValidation.valid;
    if (!geminiValidation.valid && geminiValidation.error) {
      errors.push(`Gemini: ${geminiValidation.error}`);
    }

    return {
      valid: services.supabase && services.embeddings && services.gemini,
      errors,
      services,
    };
  }
}

export const sangamService = new SangamService();
