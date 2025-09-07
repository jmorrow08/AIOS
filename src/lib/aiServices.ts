import { createLLMConfig, sendLLMMessage } from '@/agents/llm';
import { Document, AIDraftRequest, QnAResponse } from '@/lib/types';
import { LLMProvider } from '@/agents/api';

/**
 * Generate a document draft using AI
 */
export const generateDocumentDraft = async (
  request: AIDraftRequest,
  provider: LLMProvider = 'openai',
): Promise<string> => {
  const config = await createLLMConfig(provider);
  if (!config) {
    throw new Error('AI service not configured. Please check your API keys.');
  }

  // Create category-specific prompts
  const getCategoryPrompt = (category: string) => {
    switch (category.toLowerCase()) {
      case 'sops':
        return `Create a detailed Standard Operating Procedure (SOP) document. Structure it with:
        - Purpose/Objective
        - Scope
        - Responsibilities
        - Procedure steps (numbered)
        - Safety considerations (if applicable)
        - References
        Make it professional, clear, and actionable.`;
      case 'templates':
        return `Create a professional template document. Include:
        - Clear sections with placeholders
        - Usage instructions
        - Variable placeholders (use {{variable}} format)
        - Best practices for filling out the template
        Make it reusable and well-structured.`;
      case 'knowledge':
        return `Create a comprehensive knowledge base article. Structure it with:
        - Overview/Introduction
        - Key concepts and definitions
        - Detailed explanations
        - Best practices
        - Examples (where applicable)
        - Additional resources
        Make it informative and easy to understand.`;
      case 'summaries':
        return `Create a concise summary document. Include:
        - Key points and takeaways
        - Main conclusions
        - Action items (if applicable)
        - Reference to original source
        Keep it focused and actionable.`;
      default:
        return `Create a well-structured document. Include relevant sections, clear headings, and comprehensive content that would be valuable for the given topic.`;
    }
  };

  const systemPrompt = `You are a professional document writer. ${getCategoryPrompt(
    request.category,
  )}

Generate a high-quality, well-structured document based on the user's request. Keep the content professional, clear, and practical. Use markdown formatting for better readability.

Limit the response to approximately 800-1200 words to control costs while providing comprehensive content.`;

  const userPrompt = `Please create a document with the following details:
Title: ${request.title}
Category: ${request.category}
Description/Purpose: ${request.description}

Generate the full document content following the appropriate structure for this category.`;

  try {
    const response = await sendLLMMessage(config, systemPrompt, userPrompt);

    if (response.error) {
      throw new Error(response.error);
    }

    return response.content;
  } catch (error) {
    console.error('AI draft generation error:', error);
    throw new Error('Failed to generate AI draft. Please try again.');
  }
};

/**
 * Generate a summary of a document using AI
 */
export const generateDocumentSummary = async (
  document: Document,
  provider: LLMProvider = 'openai',
): Promise<string> => {
  const config = await createLLMConfig(provider);
  if (!config) {
    throw new Error('AI service not configured. Please check your API keys.');
  }

  const systemPrompt = `You are an expert at creating concise, actionable summaries. Your task is to summarize the given document while preserving the most important information.

Create a summary that includes:
- Main purpose/objective of the document
- Key points and findings
- Important conclusions or recommendations
- Any action items or next steps mentioned

Keep the summary between 150-300 words. Focus on the most valuable information that someone would need to understand the document quickly.`;

  const userPrompt = `Please summarize the following document:

Title: ${document.title}
Category: ${document.category}
${document.description ? `Description: ${document.description}` : ''}

Content:
${document.content}

Provide a clear, concise summary that captures the essence of this document.`;

  try {
    const response = await sendLLMMessage(config, systemPrompt, userPrompt);

    if (response.error) {
      throw new Error(response.error);
    }

    return response.content;
  } catch (error) {
    console.error('AI summary generation error:', error);
    throw new Error('Failed to generate summary. Please try again.');
  }
};

/**
 * Answer a question using the knowledge base with AI
 */
export const answerQuestionWithKnowledge = async (
  question: string,
  documents: Document[],
  provider: LLMProvider = 'openai',
): Promise<QnAResponse> => {
  const config = await createLLMConfig(provider);
  if (!config) {
    throw new Error('AI service not configured. Please check your API keys.');
  }

  // Find relevant documents (simple keyword matching for now)
  const findRelevantDocuments = (query: string, docs: Document[], maxResults: number = 3) => {
    const queryWords = query
      .toLowerCase()
      .split(/\s+/)
      .filter((word) => word.length > 2);

    const scoredDocs = docs.map((doc) => {
      const title = doc.title.toLowerCase();
      const content = doc.content.toLowerCase();
      const description = doc.description?.toLowerCase() || '';

      let score = 0;

      queryWords.forEach((word) => {
        // Title matches have higher weight
        if (title.includes(word)) score += 10;
        // Content matches
        if (content.includes(word)) score += 5;
        // Description matches
        if (description.includes(word)) score += 3;
      });

      return { doc, score };
    });

    return scoredDocs
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, maxResults)
      .map((item) => item.doc);
  };

  const relevantDocs = findRelevantDocuments(question, documents);

  if (relevantDocs.length === 0) {
    return {
      answer:
        "I couldn't find any relevant documents in your knowledge base to answer this question. Try rephrasing your question or adding more documents to your knowledge base.",
      sources: [],
    };
  }

  // Prepare context from relevant documents
  const context = relevantDocs
    .map((doc) => {
      const excerpt =
        doc.content.length > 500 ? doc.content.substring(0, 500).trim() + '...' : doc.content;

      return `[Document: ${doc.title}]\nCategory: ${doc.category}\n${excerpt}`;
    })
    .join('\n\n---\n\n');

  const systemPrompt = `You are a helpful knowledge base assistant. Answer the user's question based on the provided documents.

Guidelines:
- Be accurate and base your answer only on the provided context
- If the context doesn't contain enough information to fully answer, say so
- Provide specific references to the source documents when possible
- Keep answers clear and well-structured
- If relevant, suggest which documents the user should read for more details`;

  const userPrompt = `Knowledge Base Context:
${context}

User Question: ${question}

Please provide a helpful answer based on the knowledge base context above.`;

  try {
    const response = await sendLLMMessage(config, systemPrompt, userPrompt);

    if (response.error) {
      throw new Error(response.error);
    }

    // Prepare sources for response
    const sources = relevantDocs.map((doc) => ({
      id: doc.id,
      title: doc.title,
      excerpt:
        doc.content.length > 100 ? doc.content.substring(0, 100).trim() + '...' : doc.content,
    }));

    return {
      answer: response.content,
      sources,
    };
  } catch (error) {
    console.error('AI question answering error:', error);
    throw new Error('Failed to answer question. Please try again.');
  }
};

/**
 * Create a new summary document from an existing document
 */
export const createSummaryDocument = (
  originalDoc: Document,
  summaryContent: string,
): Partial<Document> => {
  return {
    title: `${originalDoc.title} - Summary`,
    category: 'Summaries',
    content: summaryContent,
    description: `Summary of: ${originalDoc.title}`,
  };
};
