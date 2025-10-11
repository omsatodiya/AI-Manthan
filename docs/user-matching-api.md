# User Matching API

## Overview
The user matching API endpoint `/api/users/match` finds users with similar profiles using vector similarity search on user embeddings.

## API Endpoint
```
GET /api/users/match
```

## Query Parameters
- `threshold` (optional): Similarity threshold (0.0 to 1.0), default: 0.7
- `count` (optional): Maximum number of matches to return, default: 5
- `tenantId` (optional): Filter matches within a specific tenant

## Response Format
```json
{
  "success": true,
  "data": [
    {
      "userId": "user-id-1",
      "similarity": 0.85,
      "user": {
        "id": "user-id-1",
        "name": "John Doe",
        "email": "john@example.com"
      }
    }
  ],
  "meta": {
    "threshold": 0.7,
    "count": 1,
    "requestedCount": 5
  }
}
```

## Database Setup Required

You need to create a PostgreSQL function in your Supabase database to perform vector similarity search:

```sql
-- Create the match_users function
CREATE OR REPLACE FUNCTION match_users(
  query_embedding vector(1536), -- OpenAI text-embedding-3-small dimensions
  match_user_id uuid,
  match_threshold float DEFAULT 0.7,
  match_count int DEFAULT 5
)
RETURNS TABLE (
  user_id uuid,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ui.user_id,
    1 - (ui.embedding <=> query_embedding) as similarity
  FROM user_info ui
  WHERE 
    ui.user_id != match_user_id
    AND ui.embedding IS NOT NULL
    AND 1 - (ui.embedding <=> query_embedding) > match_threshold
  ORDER BY ui.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;
```

## Required Database Extensions

Make sure you have the `vector` extension enabled in your Supabase database:

```sql
-- Enable the vector extension
CREATE EXTENSION IF NOT EXISTS vector;
```

## Usage Examples

### Basic matching
```bash
GET /api/users/match
```

### Custom threshold and count
```bash
GET /api/users/match?threshold=0.8&count=10
```

### Tenant-specific matching
```bash
GET /api/users/match?tenantId=your-tenant-id&threshold=0.6&count=3
```

## Error Responses

### 401 Unauthorized
```json
{
  "error": "Unauthorized"
}
```

### 404 Not Found
```json
{
  "error": "Could not find user profile or embedding."
}
```

### 500 Internal Server Error
```json
{
  "error": "Internal server error"
}
```

## Implementation Details

1. **Authentication**: Uses your existing `getCurrentUserAction()` for authentication
2. **Database Abstraction**: Uses your `getDb()` abstraction layer
3. **Vector Search**: Leverages PostgreSQL's vector similarity operators (`<=>`)
4. **Comprehensive Logging**: Includes detailed debugging logs for troubleshooting
5. **Error Handling**: Graceful error handling with fallbacks
6. **Type Safety**: Fully typed with TypeScript interfaces

## Dependencies

- OpenAI API for embedding generation (text-embedding-3-small model)
- Supabase with vector extension
- PostgreSQL with pgvector extension
