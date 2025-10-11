# Sangam AI System - Complete Implementation Guide

## 🧠 Overview

Sangam is an AI-powered conversation summarization and question-answering system for business communities. It uses vector embeddings and Google Gemini to help users recall and reason over large volumes of chat data.

## 🏗️ Architecture

### Core Components

1. **Database Layer** - Supabase with vector extensions
2. **Embedding Layer** - OpenAI text-embedding-3-small
3. **AI Reasoning Layer** - Google Gemini 2.0 Flash
4. **API Layer** - Next.js API routes
5. **Frontend Layer** - React components (optional)

### Data Flow

```
Chat Messages → Embeddings → Vector Search → AI Reasoning → Response
```

## 📊 Database Schema

### Tables

#### `chat_embeddings`
```sql
CREATE TABLE chat_embeddings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  chat_id UUID NOT NULL,
  content TEXT NOT NULL,
  embedding VECTOR(1536) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### Key Functions

- `match_messages()` - Performs cosine similarity search
- `get_unembedded_messages()` - Retrieves messages without embeddings
- `get_embedding_stats()` - Returns embedding statistics

## 🔧 Configuration

### Environment Variables

```env
# Required
OPENAI_API_KEY=your_openai_api_key
GEMINI_API_KEY=your_gemini_api_key
SUPABASE_SERVICE_KEY=your_supabase_service_key
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url

# Optional (with defaults)
SANGAM_EMBEDDING_MODEL=text-embedding-3-small
SANGAM_MAX_RESULTS=10
SANGAM_SIMILARITY_THRESHOLD=0.5
```

### Service Configuration

```typescript
// Embedding Service
const embeddingConfig = {
  model: 'text-embedding-3-small',
  batchSize: 100,
  maxRetries: 3,
  retryDelay: 1000
};

// Sangam Service
const sangamConfig = {
  maxResults: 10,
  similarityThreshold: 0.5,
  maxContextLength: 8000
};
```

## 🚀 API Endpoints

### POST `/api/sangam/embed`

Process unembedded messages and generate embeddings.

**Request:**
```json
{
  "tenantId": "uuid",
  "batchSize": 100
}
```

**Response:**
```json
{
  "success": true,
  "message": "Successfully processed 50 messages",
  "processedCount": 50
}
```

### GET `/api/sangam/embed?tenantId=uuid`

Get embedding statistics for a tenant.

**Response:**
```json
{
  "success": true,
  "stats": {
    "totalMessages": 1000,
    "embeddedMessages": 950,
    "unembeddedMessages": 50,
    "lastEmbeddingCreated": "2024-01-15T10:30:00Z"
  }
}
```

### POST `/api/sangam/ask`

Ask a question about team conversations.

**Request:**
```json
{
  "tenantId": "uuid",
  "question": "What was decided in the last meeting?",
  "maxResults": 10,
  "similarityThreshold": 0.5
}
```

**Response:**
```json
{
  "success": true,
  "answer": "In the last meeting, the team decided to...",
  "sources": [
    {
      "id": "uuid",
      "chatId": "uuid",
      "content": "We agreed to implement the new feature",
      "similarity": 0.85,
      "createdAt": "2024-01-15T10:30:00Z"
    }
  ],
  "processingTime": 1250
}
```

### PUT `/api/sangam/ask`

Generate summaries or extract specific information.

**Request (Summary):**
```json
{
  "tenantId": "uuid",
  "timeRange": "this week",
  "maxResults": 20
}
```

**Request (Extract Info):**
```json
{
  "tenantId": "uuid",
  "infoType": "decisions",
  "maxResults": 15
}
```

## 📚 Library Usage

### Basic Usage

```typescript
import { sangamService } from '@/lib/sangam';

// Ask a question
const response = await sangamService.processQuery({
  tenantId: 'your-tenant-id',
  question: 'What documents were shared this week?'
});

// Generate summary
const summary = await sangamService.generateSummary(
  'your-tenant-id',
  'this month'
);

// Extract decisions
const decisions = await sangamService.extractInformation(
  'your-tenant-id',
  'decisions'
);
```

### Advanced Usage

```typescript
import { 
  embeddingService, 
  geminiService, 
  sangamSupabase 
} from '@/lib/sangam';

// Process embeddings manually
const result = await embeddingService.processUnembeddedMessages(
  'tenant-id',
  100
);

// Get embedding statistics
const stats = await sangamSupabase.getEmbeddingStats('tenant-id');

// Validate configuration
const validation = await sangamService.validateConfiguration();
```

## 🎨 Frontend Integration

### Using the SangamChat Component

```typescript
import { SangamChat } from '@/components/sangam/SangamChat';

export default function CommunityPage() {
  return (
    <div>
      <h1>Community Chat</h1>
      <SangamChat />
    </div>
  );
}
```

### Custom Integration

```typescript
const handleAskSangam = async (question: string) => {
  const response = await fetch('/api/sangam/ask', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      tenantId: currentTenantId,
      question
    })
  });
  
  const data = await response.json();
  return data;
};
```

## 🔄 Workflow Examples

### 1. Initial Setup

```bash
# 1. Run database migration
psql -f sangam-migration.sql

# 2. Set environment variables
export OPENAI_API_KEY="your-key"
export GEMINI_API_KEY="your-key"

# 3. Process existing messages
curl -X POST /api/sangam/embed \
  -H "Content-Type: application/json" \
  -d '{"tenantId": "your-tenant-id"}'
```

### 2. Regular Usage

```typescript
// Process new messages (run periodically)
await fetch('/api/sangam/embed', {
  method: 'POST',
  body: JSON.stringify({ tenantId: 'your-tenant-id' })
});

// Ask questions
const response = await fetch('/api/sangam/ask', {
  method: 'POST',
  body: JSON.stringify({
    tenantId: 'your-tenant-id',
    question: 'What was discussed about the project timeline?'
  })
});
```

### 3. Scheduled Processing

```typescript
// Set up a cron job or scheduled function
setInterval(async () => {
  await sangamService.processUnembeddedMessages('tenant-id');
}, 30 * 60 * 1000); // Every 30 minutes
```

## 🛡️ Security & Privacy

### Tenant Isolation

- All operations are scoped by `tenant_id`
- Row Level Security (RLS) policies enforce isolation
- Users can only access their tenant's data

### Data Protection

- Messages are processed locally before API calls
- Embeddings are stored securely in Supabase
- No chat content is logged or stored externally

### Authentication

- All API routes require valid JWT authentication
- Tenant access is validated on every request
- Service keys are used only for database operations

## 📈 Performance & Scalability

### Optimization Strategies

1. **Batch Processing** - Process embeddings in batches of 100
2. **Vector Indexing** - IVFFLAT index for fast similarity search
3. **Caching** - Consider Redis for frequently accessed data
4. **Rate Limiting** - Implement API rate limiting for production

### Monitoring

```typescript
// Monitor embedding processing
const stats = await sangamService.getEmbeddingStats(tenantId);
console.log(`Embedded: ${stats.embeddedMessages}/${stats.totalMessages}`);

// Monitor API performance
const response = await sangamService.processQuery(request);
console.log(`Processing time: ${response.processingTime}ms`);
```

## 🐛 Troubleshooting

### Common Issues

1. **No embeddings found**
   - Check if messages exist in the database
   - Verify OpenAI API key is valid
   - Check embedding processing logs

2. **Poor similarity results**
   - Adjust `similarityThreshold` parameter
   - Increase `maxResults` for more context
   - Check if embeddings are up to date

3. **API errors**
   - Validate environment variables
   - Check tenant ID format (should be UUID)
   - Verify user authentication

### Debug Mode

```typescript
// Enable detailed logging
const response = await sangamService.processQuery({
  tenantId: 'your-tenant-id',
  question: 'test question',
  maxResults: 5,
  similarityThreshold: 0.3
});

console.log('Sources found:', response.sources?.length);
console.log('Processing time:', response.processingTime);
```

## 🔮 Future Enhancements

### Planned Features

1. **File Content Extraction** - Process PDFs, DOCs, etc.
2. **Scheduled Summaries** - Automatic weekly/monthly summaries
3. **Analytics Dashboard** - Conversation insights and trends
4. **Multi-language Support** - Support for non-English conversations
5. **Custom Prompts** - Tenant-specific AI behavior

### Integration Opportunities

1. **Slack Integration** - Connect with Slack workspaces
2. **Email Integration** - Process email threads
3. **Calendar Integration** - Link with meeting notes
4. **Document Management** - Integrate with file storage systems

## 📋 Maintenance

### Regular Tasks

1. **Monitor embedding stats** - Ensure new messages are processed
2. **Update AI models** - Keep up with latest model versions
3. **Optimize queries** - Monitor and optimize database performance
4. **Backup embeddings** - Regular backups of vector data

### Health Checks

```typescript
// Validate all services
const health = await sangamService.validateConfiguration();
if (!health.valid) {
  console.error('Sangam health check failed:', health.errors);
}
```

This completes the comprehensive Sangam AI system implementation. The system is designed to be modular, scalable, and secure while providing powerful AI capabilities for business communities.
