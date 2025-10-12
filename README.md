# ConnectIQ - AI-Powered Business Community Platform

A comprehensive Next.js application that provides AI-powered document generation, real-time community chat, and intelligent business networking features.

## 🚀 Features

### Core Features
- **AI-Powered Document Generation**: Create professional business documents using customizable HTML templates
- **Sangam AI Assistant**: Intelligent Q&A system with document understanding and markdown responses
- **Real-time Community Chat**: Live messaging with file attachments, reactions, and tenant isolation
- **Template Management**: Admin interface for creating and managing document templates
- **User Matching System**: AI-powered business networking and user connections
- **Multi-tenant Architecture**: Secure tenant isolation with Row Level Security (RLS)
- **Authentication System**: JWT-based auth with email verification and password reset

### Technical Features
- **Document Processing**: Support for PDF, Word, Excel, and text files with OCR capabilities
- **Vector Embeddings**: OpenAI-powered semantic search for intelligent content retrieval
- **Real-time Updates**: Supabase subscriptions for live data synchronization
- **Responsive Design**: Mobile-first UI with Tailwind CSS and shadcn/ui components
- **Type Safety**: Full TypeScript implementation with strict type checking

## 📁 Project Structure

```
businessmen/
├── app/                                    # Next.js App Router
│   ├── (auth)/                            # Authentication routes
│   │   ├── forgot-password/
│   │   ├── login/
│   │   ├── reset-password/
│   │   └── signup/
│   ├── actions/                           # Server actions
│   │   ├── admin.ts                       # Admin operations
│   │   ├── auth.ts                        # Authentication actions
│   │   ├── templates.ts                   # Template CRUD operations
│   │   ├── user-info.ts                   # User information actions
│   │   └── user.ts                        # User management
│   ├── admin/                             # Admin dashboard
│   │   ├── announcements/                 # Announcement management
│   │   ├── templates/                     # Template management
│   │   ├── users/                         # User management
│   │   └── page.tsx                       # Admin dashboard
│   ├── api/                               # API routes
│   │   ├── auth/                          # Authentication endpoints
│   │   ├── generate-document/             # AI document generation
│   │   ├── sangam/                        # Sangam AI endpoints
│   │   └── users/                         # User management APIs
│   ├── announcements/                     # Announcement system
│   ├── chat/                              # Chat interface
│   ├── community/                         # Community chat
│   ├── connections/                       # User connections
│   ├── events/                            # Event management
│   ├── templates/                         # Template editor
│   ├── user/                              # User profile
│   ├── globals.css                        # Global styles
│   ├── layout.tsx                         # Root layout
│   └── page.tsx                           # Homepage
├── components/                            # React components
│   ├── admin/                             # Admin components
│   │   ├── templates/                     # Template management UI
│   │   └── users/                         # User management UI
│   ├── community/                         # Community chat components
│   │   ├── chat-message.tsx               # Message display
│   │   ├── realtime-chat.tsx              # Real-time chat
│   │   ├── sangam-chat.tsx                # AI assistant interface
│   │   └── file-attachment.tsx            # File handling
│   ├── custom/                            # Custom components
│   │   └── data-table.tsx                 # Reusable data table
│   ├── home/                              # Homepage components
│   │   ├── hero.tsx                       # Hero section
│   │   ├── features.tsx                   # Features showcase
│   │   └── testimonials.tsx               # User testimonials
│   ├── layout/                            # Layout components
│   │   ├── navbar.tsx                     # Navigation bar
│   │   └── footer.tsx                     # Footer
│   ├── ui/                                # shadcn/ui components
│   │   ├── button.tsx                     # Button component
│   │   ├── card.tsx                       # Card component
│   │   ├── dialog.tsx                     # Modal dialogs
│   │   └── ...                            # Other UI components
│   └── user/                              # User-related components
├── constants/                             # Application constants
│   ├── home/                              # Homepage content
│   ├── layout/                            # Layout constants
│   └── templates/                         # Template definitions
├── contexts/                              # React contexts
│   └── tenant-context.tsx                 # Tenant management
├── docs/                                  # Documentation
│   ├── admin-panel.md                     # Admin system docs
│   ├── authentication-system.md           # Auth system docs
│   ├── sangam-ai-system.md                # AI system docs
│   ├── template-system.md                 # Template system docs
│   └── tenant-system.md                   # Tenant system docs
├── hooks/                                 # Custom React hooks
│   ├── use-realtime-chat.tsx              # Chat functionality
│   ├── use-tenant-data.ts                 # Tenant data management
│   └── use-mobile.ts                      # Mobile detection
├── lib/                                   # Utility libraries
│   ├── database/                          # Database utilities
│   │   ├── clients.ts                     # Supabase clients
│   │   └── templates.ts                   # Template database ops
│   ├── functions/                         # Utility functions
│   │   ├── tenant.ts                      # Tenant utilities
│   │   └── user.ts                        # User utilities
│   ├── sangam/                            # AI system
│   │   ├── document-extractor.ts          # Document processing
│   │   ├── embeddings.ts                  # Vector embeddings
│   │   ├── gemini.ts                      # AI service
│   │   ├── sangam.ts                      # Main AI orchestrator
│   │   └── supabase.ts                    # AI database ops
│   ├── services/                          # External services
│   │   └── chat-service.ts                # Chat service
│   ├── types/                             # TypeScript types
│   │   ├── api.ts                         # API types
│   │   ├── database.ts                    # Database types
│   │   ├── sangam.ts                      # AI types
│   │   └── user.ts                        # User types
│   └── utils.ts                           # General utilities
├── public/                                # Static assets
│   └── images/                            # Image assets
├── components.json                        # shadcn/ui config
├── eslint.config.mjs                      # ESLint configuration
├── middleware.ts                          # Next.js middleware
├── next.config.ts                         # Next.js configuration
├── package.json                           # Dependencies
├── postcss.config.mjs                     # PostCSS configuration
├── tailwind.config.ts                     # Tailwind CSS config
└── tsconfig.json                          # TypeScript config
```

## 🛠️ Tech Stack

### Frontend
- **Next.js 15.5.2** - React framework with App Router
- **React 19.1.0** - UI library
- **TypeScript 5** - Type safety
- **Tailwind CSS 4** - Styling
- **shadcn/ui** - Component library
- **Framer Motion** - Animations
- **React Hook Form** - Form management
- **Zod** - Schema validation

### Backend & Database
- **Supabase** - Backend-as-a-Service
- **PostgreSQL** - Database with vector extensions
- **Row Level Security (RLS)** - Data isolation
- **JWT** - Authentication

### AI & Document Processing
- **Google Gemini 2.5 Flash** - AI language model
- **OpenAI Embeddings** - Vector embeddings
- **PDF Parse** - PDF text extraction
- **Mammoth** - Word document processing
- **XLSX** - Excel file processing
- **Tesseract.js** - OCR capabilities

### Development Tools
- **ESLint** - Code linting
- **Prettier** - Code formatting
- **pnpm** - Package manager

## 🚀 Local Setup

# Deployed Site: manthan-nine-liard.vercel.app

### Prerequisites
- **Node.js** 18+ 
- **pnpm** (recommended) or npm
- **Supabase account** and project
- **Google Gemini API key**
- **OpenAI API key**

### 1. Clone the Repository
```bash
git clone <repository-url>
cd businessmen
```

### 2. Install Dependencies
```bash
pnpm install
```

### 3. Environment Variables
Create a `.env.local` file in the root directory:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_KEY=your_supabase_service_role_key

# AI Services
GEMINI_API_KEY=your_google_gemini_api_key
OPENAI_API_KEY=your_openai_api_key

# Email Configuration (Optional)
SMTP_HOST=your_smtp_host
SMTP_PORT=587
SMTP_USER=your_smtp_username
SMTP_PASS=your_smtp_password
FROM_EMAIL=your_from_email

# Application Configuration
NEXT_PUBLIC_TENANT=your_default_tenant_id
```

### 4. Database Setup

#### Create Supabase Tables
Run the following SQL commands in your Supabase SQL editor:

```sql
-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS vector;

-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  tenant_id UUID REFERENCES tenants(id),
  role VARCHAR(50) DEFAULT 'user',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tenants table
CREATE TABLE tenants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Chat messages table
CREATE TABLE chat_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  content TEXT NOT NULL,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  attachment_id UUID,
  attachment_name VARCHAR(255),
  attachment_size INTEGER,
  attachment_type VARCHAR(100),
  attachment_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Templates table
CREATE TABLE templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  html_content TEXT NOT NULL,
  fields JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Chat embeddings table for AI
CREATE TABLE chat_embeddings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  chat_id UUID REFERENCES chat_messages(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  embedding VECTOR(1536),
  has_attachment BOOLEAN DEFAULT FALSE,
  attachment_file_name VARCHAR(255),
  attachment_file_type VARCHAR(100),
  content_type VARCHAR(50) DEFAULT 'message',
  chunk_index INTEGER DEFAULT 0,
  chunk_total INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_embeddings ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can only access their own data" ON users
  FOR ALL USING (id = auth.uid());

CREATE POLICY "Users can only access messages from their tenant" ON chat_messages
  FOR ALL USING (tenant_id = (SELECT tenant_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can only access templates from their tenant" ON templates
  FOR ALL USING (tenant_id = (SELECT tenant_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can only access embeddings from their tenant" ON chat_embeddings
  FOR ALL USING (tenant_id = (SELECT tenant_id FROM users WHERE id = auth.uid()));

-- Create vector similarity search function
CREATE OR REPLACE FUNCTION match_messages(
  query_embedding VECTOR(1536),
  match_tenant_id UUID,
  match_count INTEGER DEFAULT 10,
  similarity_threshold DOUBLE PRECISION DEFAULT 0.5
)
RETURNS TABLE (
  id UUID,
  chat_id UUID,
  content TEXT,
  similarity DOUBLE PRECISION,
  created_at TIMESTAMP WITH TIME ZONE,
  has_attachment BOOLEAN,
  attachment_file_name VARCHAR(255),
  attachment_file_type VARCHAR(100),
  content_type VARCHAR(50),
  chunk_index INTEGER,
  chunk_total INTEGER
)
LANGUAGE SQL
AS $$
  SELECT 
    ce.id,
    ce.chat_id,
    ce.content,
    1 - (ce.embedding <=> query_embedding) AS similarity,
    ce.created_at,
    ce.has_attachment,
    ce.attachment_file_name,
    ce.attachment_file_type,
    ce.content_type,
    ce.chunk_index,
    ce.chunk_total
  FROM chat_embeddings ce
  WHERE ce.tenant_id = match_tenant_id
    AND 1 - (ce.embedding <=> query_embedding) > similarity_threshold
  ORDER BY ce.embedding <=> query_embedding
  LIMIT match_count;
$$;

-- Create indexes for performance
CREATE INDEX idx_chat_messages_tenant_id ON chat_messages(tenant_id);
CREATE INDEX idx_chat_messages_created_at ON chat_messages(created_at);
CREATE INDEX idx_templates_tenant_id ON templates(tenant_id);
CREATE INDEX idx_chat_embeddings_tenant_id ON chat_embeddings(tenant_id);
CREATE INDEX idx_chat_embeddings_embedding ON chat_embeddings USING ivfflat (embedding vector_cosine_ops);
```

#### Insert Sample Data
```sql
-- Insert sample tenant
INSERT INTO tenants (id, name, slug) VALUES 
('59645fec-896d-4b7c-afed-1d8d1ca0644c', 'ConnectIQ', 'cev');

-- Insert sample user (replace with your email)
INSERT INTO users (email, full_name, password_hash, tenant_id, role) VALUES 
('admin@example.com', 'Admin User', '$2a$10$hashedpassword', '59645fec-896d-4b7c-afed-1d8d1ca0644c', 'admin');
```

### 5. Run the Development Server
```bash
pnpm dev
```

The application will be available at `http://localhost:3000`

## 📚 Key Features Documentation

### AI Document Generation
- **Template System**: Create HTML templates with variable substitution
- **AI Integration**: Google Gemini generates content based on template fields
- **PDF Export**: Download generated documents as PDFs
- **Admin Management**: Full CRUD operations for templates

### Sangam AI Assistant
- **Document Understanding**: Processes uploaded files and chat messages
- **Vector Search**: Semantic search using OpenAI embeddings
- **Markdown Responses**: Formatted AI responses with proper styling
- **Tenant Isolation**: Secure data access per tenant

### Real-time Chat
- **Live Messaging**: Real-time updates using Supabase subscriptions
- **File Attachments**: Support for PDF, Word, Excel, and image files
- **Message Reactions**: Emoji reactions and user interactions
- **Message Editing**: Edit and delete messages with proper permissions

### Multi-tenant Architecture
- **Tenant Isolation**: Row Level Security ensures data separation
- **JWT Authentication**: Secure token-based authentication
- **Role-based Access**: Admin and user roles with different permissions

## 🔧 Development

### Available Scripts
```bash
pnpm dev          # Start development server
pnpm build        # Build for production
pnpm start        # Start production server
pnpm lint         # Run ESLint
```

### Code Structure
- **App Router**: Uses Next.js 13+ App Router for file-based routing
- **Server Actions**: Server-side functions for data mutations
- **API Routes**: RESTful endpoints for external integrations
- **Type Safety**: Full TypeScript implementation with strict types

### Styling
- **Tailwind CSS**: Utility-first CSS framework
- **shadcn/ui**: Pre-built accessible components
- **Responsive Design**: Mobile-first approach
- **Dark Mode**: Built-in dark/light theme support