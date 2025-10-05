import OpenAI from 'openai';
import { supabase } from '@/lib/supabaseClient';
import {
  costCalculators,
  checkBudgetBeforeAction,
  logApiUsageAndUpdateBudget,
} from '@/api/apiUsage';

export interface RAGOptions {
  agentId?: string;
  agentName?: string;
  skipBudgetCheck?: boolean;
  skipUsageLogging?: boolean;
}

export interface VectorSearchResult {
  id: string;
  content: string;
  metadata: {
    title: string;
    source: 'notion' | 'google-drive' | 'internal';
    url?: string;
    chunk_index?: number;
    total_chunks?: number;
  };
  similarity: number;
}

export interface QueryKnowledgeResponse {
  success: boolean;
  results: VectorSearchResult[];
  query_embedding?: number[];
  error?: string;
}

/**
 * Query knowledge base using vector similarity search with budget checking and usage logging
 */
export const queryKnowledge = async (
  query: string,
  agentId?: string,
  options: RAGOptions = {},
): Promise<QueryKnowledgeResponse> => {
  try {
    // Estimate embedding cost for budget check
    const estimatedTokens = Math.ceil(query.length / 4); // Rough estimate
    const costCalc = costCalculators.openai.embeddings(estimatedTokens);

    // Check budget before proceeding
    if (!options.skipBudgetCheck) {
      const budgetCheck = await checkBudgetBeforeAction(
        'OpenAI',
        costCalc.cost,
        options.agentId || agentId,
      );
      if (budgetCheck.error) {
        return {
          success: false,
          results: [],
          error: `Budget check failed: ${budgetCheck.error}`,
        };
      }
      if (!budgetCheck.data?.can_proceed) {
        return {
          success: false,
          results: [],
          error: `Budget exceeded. Current spend: $${budgetCheck.data?.current_spend?.toFixed(
            2,
          )}, Limit: $${budgetCheck.data?.budget_limit?.toFixed(2)}`,
        };
      }
    }

    // Step 1: Generate embedding for the query
    const embeddingResponse = await generateQueryEmbedding(query, options);
    if (!embeddingResponse.success) {
      return {
        success: false,
        results: [],
        error: embeddingResponse.error || 'Failed to generate query embedding',
      };
    }

    const queryEmbedding = embeddingResponse.embedding;

    // Step 2: Search vector database for similar content
    const searchResponse = await searchVectorIndex(queryEmbedding);
    if (!searchResponse.success) {
      return {
        success: false,
        results: [],
        error: searchResponse.error || 'Failed to search vector index',
        query_embedding: queryEmbedding,
      };
    }

    // Step 3: Return top 3 results
    const topResults = searchResponse.results.slice(0, 3);

    return {
      success: true,
      results: topResults,
      query_embedding: queryEmbedding,
    };
  } catch (error) {
    console.error('Error in queryKnowledge:', error);
    return {
      success: false,
      results: [],
      error: error instanceof Error ? error.message : 'Unknown error in queryKnowledge',
    };
  }
};

/**
 * Generate embedding for query using OpenAI with usage logging
 */
const generateQueryEmbedding = async (
  query: string,
  options: RAGOptions = {},
): Promise<{
  success: boolean;
  embedding?: number[];
  error?: string;
}> => {
  try {
    const openaiApiKey = import.meta.env.VITE_OPENAI_API_KEY;
    if (!openaiApiKey) {
      return {
        success: false,
        error: 'OpenAI API key not configured',
      };
    }

    const openai = new OpenAI({
      apiKey: openaiApiKey,
      dangerouslyAllowBrowser: true, // Note: In production, use a backend proxy
    });

    const response = await openai.embeddings.create({
      model: 'text-embedding-3-small', // or text-embedding-ada-002
      input: query,
      encoding_format: 'float',
    });

    if (!response.data || response.data.length === 0) {
      return {
        success: false,
        error: 'No embedding generated',
      };
    }

    // Calculate actual token usage and log it
    const actualTokens = response.usage?.prompt_tokens || Math.ceil(query.length / 4);
    const costCalc = costCalculators.openai.embeddings(actualTokens);

    // Log usage if not skipped
    if (!options.skipUsageLogging) {
      await logApiUsageAndUpdateBudget({
        service: 'OpenAI',
        agent_id: options.agentId,
        agent: options.agentName,
        description: 'RAG embedding generation',
        cost: costCalc.cost,
        tokens_used: actualTokens,
        metadata: {
          model: 'text-embedding-3-small',
          query_length: query.length,
          operation: 'embedding_generation',
        },
      });
    }

    return {
      success: true,
      embedding: response.data[0].embedding,
    };
  } catch (error) {
    console.error('Error generating embedding:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate embedding',
    };
  }
};

/**
 * Search vector index using pgvector similarity search
 */
const searchVectorIndex = async (
  queryEmbedding: number[],
): Promise<{
  success: boolean;
  results: VectorSearchResult[];
  error?: string;
}> => {
  try {
    // Use Supabase's vector search functionality
    // This assumes you have a table with vector embeddings
    const { data, error } = await supabase.rpc('search_knowledge_vectors', {
      query_embedding: queryEmbedding,
      similarity_threshold: 0.7, // Adjust based on your needs
      max_results: 10, // Get more than 3 to allow for filtering
    });

    if (error) {
      console.error('Error searching vector index:', error);
      return {
        success: false,
        results: [],
        error: error.message,
      };
    }

    // Transform the results
    const results: VectorSearchResult[] = (data || []).map((item: any) => ({
      id: item.id,
      content: item.content,
      metadata: {
        title: item.title,
        source: item.source,
        url: item.url,
        chunk_index: item.chunk_index,
        total_chunks: item.total_chunks,
      },
      similarity: item.similarity,
    }));

    // Sort by similarity (descending)
    results.sort((a, b) => b.similarity - a.similarity);

    return {
      success: true,
      results,
    };
  } catch (error) {
    console.error('Error in vector search:', error);
    return {
      success: false,
      results: [],
      error: error instanceof Error ? error.message : 'Vector search failed',
    };
  }
};

/**
 * Add document to vector index (for ingestion pipeline) with usage logging
 */
export const addDocumentToIndex = async (
  content: string,
  metadata: {
    title: string;
    source: 'notion' | 'google-drive' | 'internal';
    url?: string;
    document_id: string;
  },
  chunkIndex?: number,
  totalChunks?: number,
  options: RAGOptions = {},
): Promise<{ success: boolean; error?: string }> => {
  try {
    // Generate embedding for the content
    const embeddingResponse = await generateQueryEmbedding(content, {
      ...options,
      skipBudgetCheck: true,
    }); // Skip budget check for ingestion
    if (!embeddingResponse.success) {
      return {
        success: false,
        error: embeddingResponse.error,
      };
    }

    // Store in Supabase with vector
    const { error } = await supabase.from('knowledge_vectors').insert({
      content,
      embedding: embeddingResponse.embedding,
      title: metadata.title,
      source: metadata.source,
      url: metadata.url,
      document_id: metadata.document_id,
      chunk_index: chunkIndex,
      total_chunks: totalChunks,
      created_at: new Date().toISOString(),
    });

    if (error) {
      console.error('Error adding document to index:', error);
      return {
        success: false,
        error: error.message,
      };
    }

    return { success: true };
  } catch (error) {
    console.error('Error adding document to vector index:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to add document to index',
    };
  }
};

/**
 * Batch add documents to vector index with usage logging
 */
export const batchAddDocumentsToIndex = async (
  documents: Array<{
    content: string;
    metadata: {
      title: string;
      source: 'notion' | 'google-drive' | 'internal';
      url?: string;
      document_id: string;
    };
    chunkIndex?: number;
    totalChunks?: number;
  }>,
  options: RAGOptions = {},
): Promise<{ success: boolean; processed: number; errors: string[] }> => {
  const errors: string[] = [];
  let processed = 0;

  for (const doc of documents) {
    try {
      const result = await addDocumentToIndex(
        doc.content,
        doc.metadata,
        doc.chunkIndex,
        doc.totalChunks,
        options,
      );

      if (result.success) {
        processed++;
      } else {
        errors.push(`Failed to add ${doc.metadata.title}: ${result.error}`);
      }
    } catch (error) {
      errors.push(`Error processing ${doc.metadata.title}: ${error}`);
    }
  }

  return {
    success: errors.length === 0,
    processed,
    errors,
  };
};

/**
 * Chunk text into smaller pieces for better embedding
 */
export const chunkText = (
  text: string,
  chunkSize: number = 1000,
  overlap: number = 200,
): string[] => {
  if (text.length <= chunkSize) {
    return [text];
  }

  const chunks: string[] = [];
  let start = 0;

  while (start < text.length) {
    let end = start + chunkSize;

    // If we're not at the end, try to find a good breaking point
    if (end < text.length) {
      // Look for sentence endings within the last 100 characters
      const lastPeriod = text.lastIndexOf('.', end);
      const lastNewline = text.lastIndexOf('\n', end);
      const lastSpace = text.lastIndexOf(' ', end);

      // Use the best breaking point found
      if (lastPeriod > end - 100) {
        end = lastPeriod + 1;
      } else if (lastNewline > end - 100) {
        end = lastNewline;
      } else if (lastSpace > end - 100) {
        end = lastSpace;
      }
    }

    chunks.push(text.slice(start, end).trim());
    start = end - overlap;

    // Prevent infinite loop
    if (start >= text.length) break;
  }

  return chunks.filter((chunk) => chunk.length > 0);
};
