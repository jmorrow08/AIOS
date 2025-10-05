import { supabase } from '@/lib/supabaseClient';
import { sendLLMMessage, createLLMConfig } from './llm';
import { getAgentByRole } from './api';
import { Client } from '@notionhq/client';
// Note: Google APIs are Node.js only, so we'll use a different approach for Google Drive
// import { google } from 'googleapis';

export interface SearchResult {
  id: string;
  title: string;
  content: string;
  source: 'notion' | 'google-drive' | 'internal';
  url?: string;
  lastModified?: string;
  relevanceScore?: number;
}

export interface RAGSearchResponse {
  success: boolean;
  results: SearchResult[];
  summary?: string;
  error?: string;
}

/**
 * Search across multiple knowledge sources using RAG
 */
export const performRAGSearch = async (
  query: string,
  agentRole: string = 'rag',
): Promise<RAGSearchResponse> => {
  try {
    // Get RAG agent configuration
    const agentResponse = await getAgentByRole(agentRole);
    if (agentResponse.error || !agentResponse.data) {
      return {
        success: false,
        results: [],
        error: `RAG agent not found: ${agentResponse.error}`,
      };
    }

    // Search all sources in parallel
    const [notionResults, driveResults, internalResults] = await Promise.allSettled([
      searchNotion(query),
      searchGoogleDrive(query),
      searchInternalDocs(query),
    ]);

    // Combine results
    const allResults: SearchResult[] = [];

    if (notionResults.status === 'fulfilled') {
      allResults.push(...notionResults.value);
    }

    if (driveResults.status === 'fulfilled') {
      allResults.push(...driveResults.value);
    }

    if (internalResults.status === 'fulfilled') {
      allResults.push(...internalResults.value);
    }

    // If no results found, return early
    if (allResults.length === 0) {
      return {
        success: true,
        results: [],
        summary: 'No relevant documents found for your query.',
      };
    }

    // Use LLM to generate a summary if we have an agent configured
    const agent = agentResponse.data;
    let summary = '';

    if (agent.llm_provider) {
      const llmConfig = createLLMConfig(agent.llm_provider, agent.api_key_ref, agent.llm_model);
      if (llmConfig) {
        const contextPrompt = buildContextPrompt(query, allResults);
        const llmResponse = await sendLLMMessage(llmConfig, contextPrompt, query);

        if (llmResponse.content && !llmResponse.error) {
          summary = llmResponse.content;
        }
      }
    }

    // Sort results by relevance (basic implementation)
    const sortedResults = allResults.sort(
      (a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0),
    );

    return {
      success: true,
      results: sortedResults,
      summary,
    };
  } catch (error) {
    console.error('Error in RAG search:', error);
    return {
      success: false,
      results: [],
      error: error instanceof Error ? error.message : 'Unknown error in RAG search',
    };
  }
};

/**
 * Search Notion pages
 */
const searchNotion = async (query: string): Promise<SearchResult[]> => {
  try {
    const notionApiKey = import.meta.env.VITE_NOTION_API_KEY;
    const notionDatabaseId = import.meta.env.VITE_NOTION_DATABASE_ID;

    if (!notionApiKey || !notionDatabaseId) {
      console.warn('Notion API credentials not configured');
      return [];
    }

    const notion = new Client({ auth: notionApiKey });

    // Search the database
    const response = await notion.databases.query({
      database_id: notionDatabaseId,
      filter: query
        ? {
            or: [
              {
                property: 'Name',
                title: {
                  contains: query,
                },
              },
              {
                property: 'Content',
                rich_text: {
                  contains: query,
                },
              },
            ],
          }
        : undefined,
      sorts: [
        {
          timestamp: 'last_edited_time',
          direction: 'descending',
        },
      ],
    });

    const results: SearchResult[] = response.results.map((page: any) => {
      const title = page.properties.Name?.title?.[0]?.plain_text || 'Untitled';
      const content = page.properties.Content?.rich_text?.[0]?.plain_text || '';

      return {
        id: page.id,
        title,
        content,
        source: 'notion' as const,
        url: page.url,
        lastModified: page.last_edited_time,
        relevanceScore: calculateRelevance(query, `${title} ${content}`),
      };
    });

    return results;
  } catch (error) {
    console.error('Error searching Notion:', error);
    return [];
  }
};

/**
 * Search Google Drive files
 */
const searchGoogleDrive = async (query: string): Promise<SearchResult[]> => {
  try {
    const googleApiKey = import.meta.env.VITE_GOOGLE_API_KEY;
    const accessToken = import.meta.env.VITE_GOOGLE_ACCESS_TOKEN;

    if (!googleApiKey) {
      console.warn('Google API key not configured');
      return [];
    }

    if (!accessToken) {
      console.warn('Google access token not configured');
      return [];
    }

    // Use Google Drive REST API directly (works in browser)
    const searchQuery = query
      ? `name contains '${encodeURIComponent(query)}' or fullText contains '${encodeURIComponent(
          query,
        )}'`
      : '';

    const url =
      `https://www.googleapis.com/drive/v3/files?` +
      `q=${searchQuery}&` +
      `fields=files(id,name,webViewLink,modifiedTime,mimeType)&` +
      `orderBy=modifiedTime desc&` +
      `pageSize=20&` +
      `key=${googleApiKey}`;

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Google Drive API error: ${response.status}`);
    }

    const data = await response.json();

    const results: SearchResult[] = (data.files || []).map((file: any) => ({
      id: file.id,
      title: file.name,
      content: `File type: ${file.mimeType}`,
      source: 'google-drive' as const,
      url: file.webViewLink,
      lastModified: file.modifiedTime,
      relevanceScore: calculateRelevance(query, file.name),
    }));

    return results;
  } catch (error) {
    console.error('Error searching Google Drive:', error);
    return [];
  }
};

/**
 * Search internal Supabase Storage documents
 */
const searchInternalDocs = async (query: string): Promise<SearchResult[]> => {
  try {
    // List files from Supabase Storage
    const { data: files, error } = await supabase.storage.from('documents').list('', {
      limit: 100,
      sortBy: { column: 'created_at', order: 'desc' },
    });

    if (error) {
      console.error('Error fetching internal docs:', error);
      return [];
    }

    const results: SearchResult[] = [];

    // Process each file
    for (const file of files || []) {
      // Skip folders
      if (file.id === null) continue;

      const fileName = file.name;
      const fileExtension = fileName.split('.').pop()?.toLowerCase() || '';

      // Only process text-based files for content search
      const textFileExtensions = ['txt', 'md', 'pdf', 'doc', 'docx'];
      let content = fileName;

      // Try to extract text content for supported file types
      if (textFileExtensions.includes(fileExtension)) {
        try {
          // Get file content (this would work for text files)
          const { data: fileContent } = await supabase.storage.from('documents').download(fileName);

          if (fileContent) {
            // For demo purposes, we'll just use filename. In production,
            // you'd want to use a proper text extraction library
            content = `${fileName} (Content extraction would go here)`;
          }
        } catch (downloadError) {
          console.warn(`Could not download content for ${fileName}:`, downloadError);
        }
      }

      // Filter based on query if provided, otherwise include all files
      const shouldInclude =
        !query ||
        fileName.toLowerCase().includes(query.toLowerCase()) ||
        content.toLowerCase().includes(query.toLowerCase());

      if (shouldInclude) {
        results.push({
          id: file.id || fileName,
          title: fileName,
          content: content,
          source: 'internal' as const,
          url: supabase.storage.from('documents').getPublicUrl(fileName).data.publicUrl,
          lastModified: file.created_at,
          relevanceScore: calculateRelevance(query || '', `${fileName} ${content}`),
        });
      }
    }

    return results;
  } catch (error) {
    console.error('Error searching internal docs:', error);
    return [];
  }
};

/**
 * Build context prompt for LLM
 */
const buildContextPrompt = (query: string, results: SearchResult[]): string => {
  const context = results
    .slice(0, 5) // Limit to top 5 results for context
    .map((result) => `[${result.source.toUpperCase()}] ${result.title}: ${result.content}`)
    .join('\n\n');

  return `You are a knowledge assistant. Use the following context from various sources to answer the user's query.

Context:
${context}

Please provide a helpful response based on the available context. If the context doesn't contain enough information, let the user know.`;
};

/**
 * Calculate basic relevance score
 */
const calculateRelevance = (query: string, content: string): number => {
  const queryWords = query.toLowerCase().split(' ');
  const contentWords = content.toLowerCase();

  let score = 0;
  for (const word of queryWords) {
    if (contentWords.includes(word)) {
      score += 1;
    }
  }

  return score / queryWords.length;
};

/**
 * Get list of documents from each source (for display purposes)
 */
export const getSourceDocuments = async (
  source: 'notion' | 'google-drive' | 'internal',
): Promise<SearchResult[]> => {
  switch (source) {
    case 'notion':
      return searchNotion('');
    case 'google-drive':
      return searchGoogleDrive('');
    case 'internal':
      return searchInternalDocs('');
    default:
      return [];
  }
};
