# ConnectIQ - AI-Powered Business Community Platform

ConnectIQ is a next-generation business community platform that combines **Multi-Tenant Workspace Isolation**, **Real-Time Collaboration**, and **Hybrid RAG AI** to help organizations communicate more effectively and preserve their institutional knowledge.

## 🚀 The Problem We Solved
Most business communication platforms suffer from "Platform Noise" and "Institutional Amnesia." Information gets lost in chat history, and organizations struggle to manage multiple separate groups securely.
**ConnectIQ solves this by:**
- Providing **Isolated Community Hubs** for every organization.
- Implementing **Sangam AI**, which "remembers" every chat and file shared.
- Creating a **Popularity-based Leaderboard** to incentivize high-quality contributions.

## 🛠️ Tech Stack
| Category | Technology | Usage |
| :--- | :--- | :--- |
| **Framework** | Next.js 15.5.2 | Core application architecture and routing. |
| **Styling** | Tailwind CSS 4 | Responsive, premium UI design. |
| **Database** | Supabase (PostgreSQL) | Primary data storage and pgvector support. |
| **Real-time** | Supabase Realtime | Instant chat and reaction synchronization. |
| **AI (LLM)** | Gemini 2.5 Flash | Document generation and community Q&A. |
| **AI (Embeddings)**| OpenAI text-embedding-3 | Semantic search for Hybrid RAG. |
| **Auth** | Supabase Auth | Secure, multi-tenant aware authentication. |

## 📁 Project Structure

```text
├── app/
│   ├── (global)/              # Public & Admin routes (Auth, Admin Dashboard, Global Lobby)
│   │   ├── (auth)/            # Authentication pages (Login, Signup, Reset Password)
│   │   ├── admin/             # Platform-wide administration tools
│   │   ├── apply-community/   # Community creation application workflow
│   │   ├── lobby/             # Main entry point for choosing communities
│   │   └── user/              # Global user settings and profile info
│   ├── [tenant]/              # Isolated Community Workspace routes
│   │   ├── announcements/     # Community-specific news and updates
│   │   ├── chat/              # Real-time workspace collaboration
│   │   ├── community/         # Workspace dashboard and overview
│   │   ├── leaderboard/       # Engagement rankings and gamification
│   │   └── profile/           # Context-aware user profiles
│   ├── actions/               # Server Actions (Mutations for Auth, Profile, etc.)
│   └── api/                   # Backend API routes (Sangam AI, Real-time Webhooks)
├── components/
│   ├── admin/                 # Admin-specific UI components
│   │   ├── templates/         # Document template management UI
│   │   └── users/             # User management tables
│   ├── community/             # Real-time chat & Sangam AI interface
│   ├── leaderboard/           # Ranking cards and filters
│   ├── layout/                # Global and Tenant-specific navigation
│   └── ui/                    # Base Design System (shadcn/ui)
├── constants/                 # Static content and configuration tokens
├── contexts/                  # React Contexts (Tenant state, Global Auth)
├── docs/                      # Detailed Technical Documentation
├── hooks/                     # Custom React Hooks for UI and Logic
├── lib/
│   ├── sangam/                # AI Core (Embeddings, RAG logic, Gemini integration)
│   ├── services/              # Business logic (Chat Service, Leaderboard Engine)
│   ├── types/                 # TypeScript interfaces and global schemas
│   ├── functions/             # Utility functions for Tenant and User management
│   └── utils/                 # General helper utilities
├── public/                    # Static assets (Images, SVG icons)
├── scripts/                   # Database migration and setup SQL scripts
├── middleware.ts              # Multi-tenant resolution & security middleware
└── tailwind.config.ts         # Global styling and design tokens
```

## 🏗️ Architecture
The platform is built on a **Modular Service Architecture**.
- **The Core**: Next.js App Router for high-performance server-side rendering.
- **The Engine**: Supabase for real-time data flow and secure multi-tenancy via RLS.
- **The Brain**: Sangam AI (Hybrid RAG) for semantic search and intelligent automation.

For a detailed breakdown, see [Architecture Docs](docs/architecture.md).

## 🌟 Key Features
- **Isolated Community Hubs**: Multi-tenant infrastructure with slug-based routing.
- **Real-time Engine**: Live chat, instant reactions, and optimistic UI updates.
- **Sangam AI Assistant**: Hybrid RAG system that understands your community context.
- **Popularity Leaderboard**: Gamification system that ranks users by engagement.
- **Admin Dashboard**: Full control over users, templates, and announcements.

See the [Features Guide](docs/features.md) for implementation details.

## 🛠️ Local Setup & Multi-Tenancy
ConnectIQ supports **Subdomain-based Multi-Tenancy** on localhost for a production-like experience.

### 1. Clone & Install
```bash
git clone <repo-url>
pnpm install
```

### 2. Environment Configuration
Copy `.env.example` to `.env.local` and fill in your Supabase, OpenAI, and Gemini keys.

### 3. Database Setup
Execute the SQL scripts located in the [Database Docs](docs/database.md) in your Supabase SQL Editor.

### 4. Testing Subdomains on Localhost
To test the full subdomain experience (e.g., `genius.localhost:3000`):
1. **Edit Hosts File**: Open your hosts file (Windows: `C:\Windows\System32\drivers\etc\hosts`) as Administrator.
2. **Add Mappings**: Add the following lines:
   ```text
   127.0.0.1 genius.localhost
   127.0.0.1 alpha.localhost
   ```
3. **Run Platform**: `pnpm dev`.
4. **Access Community**: Open your browser to `http://genius.localhost:3000`.
5. **Notice the Isolation**: Every subdomain represents a completely isolated community context.

> [!NOTE]
> **Vercel Deployment Note**
> In a production Vercel environment, you must configure **Wildcard Domains** (`*.yourdomain.com`) in your project settings and ensure your DNS provider supports wildcard CNAME records. For the demo, path-based fallback (`domain.com/genius`) is also supported.

---
Built with ❤️ for AI Manthan Hackathon.