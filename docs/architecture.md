# Architecture Overview

ConnectIQ is built on a **Modern Cloud-Native Stack** designed for scalability, real-time collaboration, and AI-driven insights.

## System Architecture Diagram

```mermaid
graph TD
    Client[Next.js Client]
    Server[Next.js Server Actions / API]
    Auth[Supabase Auth]
    DB[(Supabase PostgreSQL + pgvector)]
    Storage[Supabase Storage]
    AI[OpenAI / Gemini API]
    Realtime[Supabase Realtime]

    Client <--> Server
    Client <--> Realtime
    Server <--> Auth
    Server <--> DB
    Server <--> Storage
    Server <--> AI
    DB <--> AI
```

## Key Architectural Pillars

### 1. Multi-Tenant Isolation (The "Vault" Pattern)
Every database table in ConnectIQ includes a `tenant_id` column. We enforce strict isolation using **PostgreSQL Row-Level Security (RLS)**.
- **Why it was needed**: To allow multiple independent organizations to use the same platform without data leaks.
- **Problem Solved**: Eliminated the need for separate database instances per client, reducing costs and maintenance while maintaining high security.

### 2. Hybrid RAG (Intelligent Memory)
We combine traditional database queries with vector-based semantic search.
- **Implementation**: When a message is sent, it is embedded into a 1536-dimensional vector and stored.
- **Problem Solved**: Solves the "needle in a haystack" problem where users couldn't find past decisions or files in a fast-moving chat.

### 3. Serverless Edge Logic
Using Next.js Server Actions and Middleware, we reduce the distance between the user and the logic.
- **Implementation**: Middleware handles tenant resolution and route guarding.
- **Problem Solved**: Reduced latency and simplified the mental model for state management.

## Technology Stack Justification

| Technology | Where it is used | Why we used it |
| :--- | :--- | :--- |
| **Next.js 15** | Entire Frontend/Backend | Best-in-class performance, SEO, and developer experience with App Router. |
| **Supabase** | Auth, DB, Realtime, Storage | Unified platform that handles the complexities of real-time sync and security. |
| **pgvector** | AI Search | Allows us to perform AI-powered searches directly inside our primary database. |
| **Gemini 2.5 Flash** | AI Chat / Summary | High speed and large context window for processing long community chats. |
| **OpenAI Embeddings** | Vector Search | Industry standard for reliable semantic understanding of text. |
| **Tailwind CSS 4** | Styling | Rapid UI development with a consistent design system. |
