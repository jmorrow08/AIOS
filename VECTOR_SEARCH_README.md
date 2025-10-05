# Vector Search Setup Guide

This guide explains how to set up and use the AI-powered vector search functionality in the Knowledge Library.

## Overview

The Knowledge Library supports two search modes:

1. **Vector Search (AI-Powered)**: Uses OpenAI embeddings and pgvector for semantic search
2. **API Search**: Direct integration with external APIs (Notion, Google Drive, Supabase Storage)

## Prerequisites

### For Vector Search

- PostgreSQL with pgvector extension
- OpenAI API key
- Supabase project

### For API Search

- Notion API credentials
- Google Drive API credentials
- Supabase Storage setup

## Setup Instructions

### 1. Database Setup

Run the vector search migration:

```bash
# If using Supabase CLI
supabase db push

# Or run the SQL directly in your PostgreSQL database
psql -f supabase/migrations/20250108_setup_vector_search.sql
```

This will:

- Enable the pgvector extension
- Create the `knowledge_vectors` table
- Set up vector similarity search functions
- Configure Row Level Security (RLS) policies

### 2. Environment Variables

Add these to your `.env` file:

```env
# OpenAI (Required for vector search)
VITE_OPENAI_API_KEY=your_openai_api_key_here

# Notion API (Optional - for API search)
VITE_NOTION_API_KEY=your_notion_api_key
VITE_NOTION_DATABASE_ID=your_notion_database_id

# Google Drive API (Optional - for API search)
VITE_GOOGLE_API_KEY=your_google_api_key
VITE_GOOGLE_CLIENT_ID=your_google_client_id
VITE_GOOGLE_CLIENT_SECRET=your_google_client_secret
VITE_GOOGLE_ACCESS_TOKEN=your_google_access_token

# Supabase (Already configured)
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. Data Ingestion

To populate the vector database, you'll need to ingest documents from your sources:

```typescript
import { addDocumentToIndex, batchAddDocumentsToIndex, chunkText } from '@/utils/rag';

// Example: Add a single document
const result = await addDocumentToIndex('Your document content here...', {
  title: 'Document Title',
  source: 'notion', // or "google-drive" or "internal"
  url: 'https://example.com/document',
  document_id: 'unique-doc-id',
});

// Example: Add multiple documents
const documents = [
  {
    content: 'First document content...',
    metadata: {
      title: 'Doc 1',
      source: 'notion',
      url: 'https://notion.so/page1',
      document_id: 'notion-1',
    },
  },
  {
    content: 'Second document content...',
    metadata: {
      title: 'Doc 2',
      source: 'google-drive',
      url: 'https://drive.google.com/file2',
      document_id: 'drive-2',
    },
  },
];

const batchResult = await batchAddDocumentsToIndex(documents);
```

### 4. Text Chunking

For large documents, use the built-in text chunking utility:

```typescript
import { chunkText } from '@/utils/rag';

const longText = 'Your very long document content...';
const chunks = chunkText(longText, 1000, 200); // 1000 char chunks with 200 char overlap

// Add each chunk to the vector index
for (let i = 0; i < chunks.length; i++) {
  await addDocumentToIndex(chunks[i], {
    title: `Document Title - Part ${i + 1}`,
    source: 'internal',
    document_id: `doc-id-${i}`,
    chunkIndex: i,
    totalChunks: chunks.length,
  });
}
```

## Usage

### Basic Search

```typescript
import { queryKnowledge } from '@/utils/rag';

// Search for relevant documents
const result = await queryKnowledge('How do I configure the database?');

// Returns top 3 most similar results
if (result.success) {
  console.log('Found results:', result.results);
  console.log('Query embedding:', result.query_embedding);
} else {
  console.error('Search failed:', result.error);
}
```

### Search with Agent Context

```typescript
const result = await queryKnowledge('API authentication', 'rag-agent-id');
```

## Database Schema

### knowledge_vectors Table

| Column       | Type         | Description                                  |
| ------------ | ------------ | -------------------------------------------- |
| id           | UUID         | Primary key                                  |
| content      | TEXT         | Document content/chunk                       |
| embedding    | vector(1536) | OpenAI text-embedding-3-small vector         |
| title        | TEXT         | Document title                               |
| source       | TEXT         | Source: 'notion', 'google-drive', 'internal' |
| url          | TEXT         | Optional URL to original document            |
| document_id  | TEXT         | Unique identifier for the source document    |
| chunk_index  | INTEGER      | Chunk index (for chunked documents)          |
| total_chunks | INTEGER      | Total number of chunks                       |
| created_at   | TIMESTAMP    | Creation timestamp                           |
| updated_at   | TIMESTAMP    | Last update timestamp                        |

### Indexes

- Vector index: `knowledge_vectors_embedding_idx` (IVFFlat)
- Source index: `knowledge_vectors_source_idx`
- Document ID index: `knowledge_vectors_document_id_idx`

## API Reference

### queryKnowledge(query: string, agentId?: string)

Main search function that:

1. Generates OpenAI embedding for the query
2. Searches the vector database using cosine similarity
3. Returns top 3 results

**Parameters:**

- `query`: Search query string
- `agentId`: Optional agent identifier for logging

**Returns:**

```typescript
{
  success: boolean;
  results: VectorSearchResult[];
  query_embedding?: number[];
  error?: string;
}
```

### addDocumentToIndex(content, metadata, chunkIndex?, totalChunks?)

Adds a document to the vector index.

**Parameters:**

- `content`: Document content to embed and store
- `metadata`: Document metadata
- `chunkIndex`: Optional chunk index for chunked documents
- `totalChunks`: Optional total number of chunks

### batchAddDocumentsToIndex(documents)

Batch adds multiple documents to the vector index.

### chunkText(text, chunkSize?, overlap?)

Splits text into chunks for better embedding.

**Parameters:**

- `text`: Text to chunk
- `chunkSize`: Maximum characters per chunk (default: 1000)
- `overlap`: Characters to overlap between chunks (default: 200)

## Performance Tips

1. **Chunk Size**: Smaller chunks (500-1000 chars) generally perform better
2. **Overlap**: 10-20% overlap helps maintain context
3. **Similarity Threshold**: Adjust in the search function (default: 0.7)
4. **Index Maintenance**: Rebuild vector indexes periodically for large datasets

## Troubleshooting

### Common Issues

1. **"pgvector extension not found"**

   - Ensure pgvector is installed in your PostgreSQL instance
   - Check database permissions

2. **"OpenAI API key not configured"**

   - Add `VITE_OPENAI_API_KEY` to your environment variables
   - Verify the API key is valid

3. **Low search quality**

   - Check that documents are properly chunked
   - Ensure embeddings are generated correctly
   - Adjust similarity threshold

4. **Slow search performance**
   - Rebuild vector indexes: `REINDEX INDEX knowledge_vectors_embedding_idx;`
   - Consider using HNSW indexing for large datasets

## Security Considerations

- Store API keys securely (use environment variables)
- Implement rate limiting for OpenAI API calls
- Use Row Level Security (RLS) policies
- Regularly rotate API keys
- Monitor API usage and costs
