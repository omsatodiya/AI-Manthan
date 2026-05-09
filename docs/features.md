# Feature Deep-Dive

## 1. Multi-Tenant Community Infrastructure
### What problem it solves
ConnectIQ solves the problem of "platform noise." Instead of a single massive group where everything is cluttered, organizations can create private, branded "Community Hubs" that are isolated from each other.

### Implementation
- **Slug-based Routing**: Next.js dynamic segments (`app/[tenant]/...`) are used to identify the community context from the URL.
- **Tenant Middleware**: Resolves the community slug into a UUID for database queries.
- **RLS Isolation**: Supabase Row-Level Security ensures that a user in Community A cannot accidentally see messages from Community B.

### Technologies
- **Next.js 15 App Router**
- **Supabase Multi-Tenancy Patterns**

---

## 2. Real-Time Chat & Engagement
### What problem it solves
Fosters immediate collaboration within community members. Existing solutions often lack integrated gamification or "context-awareness."

### Implementation
- **Supabase Realtime**: Uses PostgreSQL replication to broadcast messages instantly to all connected clients.
- **Optimistic UI**: Messages appear instantly on the sender's screen before the server confirms the save.
- **Reaction Aggregation**: A custom service that maps reactions to message authors for the leaderboard.

### Technologies
- **Supabase Realtime (WebSockets)**
- **React Hooks (useRealtimeChat)**

---

## 3. Sangam AI (Hybrid RAG)
### What problem it solves
"Community Memory Loss." Important decisions and files often get buried in chat history. Sangam AI allows users to query their community's knowledge base using natural language.

### Implementation
- **Vector Embeddings**: Uses OpenAI's `text-embedding-3-small` to convert chat messages into numerical vectors.
- **pgvector**: Stores these vectors in PostgreSQL for similarity search.
- **Hybrid Memory**: Combines recent chat history with long-term vector-searched results to provide context-aware answers.

### Technologies
- **OpenAI API**
- **pgvector (Supabase)**

---

## 4. Live Community Leaderboard
### What problem it solves
Incentivizes high-quality contributions and engagement within the workspace.

### Implementation
- **Admin Aggregation**: Uses a service-level client to bypass RLS and calculate community-wide stats.
- **Popularity Ranking**: Users are ranked by **Reactions Received** on their messages, encouraging helpful and impactful content rather than just spam.
- **Dynamic Sorting**: Client-side sorting allows users to view top contributors by different metrics (Coins, Messages, Reactions).

### Technologies
- **TypeScript Service Patterns**
- **Tailwind CSS & Lucide Icons**
