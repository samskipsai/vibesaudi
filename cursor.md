# Cloudflare VibeSDK - Project Overview

## 🎯 Project Description

**Cloudflare VibeSDK** is an AI-powered webapp generator that creates full-stack React/TypeScript applications from natural language prompts. Users describe what they want to build, and the system generates, previews, and deploys complete applications.

**Live Demo**: [build.cloudflare.dev](https://build.cloudflare.dev)

## 🏗️ Architecture

### Frontend (`src/`)
- **Framework**: React 19 + Vite + TypeScript
- **Routing**: React Router v7
- **Styling**: Tailwind CSS v4 + shadcn/ui components
- **Code Editor**: Monaco Editor
- **Real-time**: WebSocket connections for live updates
- **State Management**: React Context (Auth, Theme, Apps Data)

### Backend (`worker/`)
- **Runtime**: Cloudflare Workers
- **Framework**: Hono (lightweight web framework)
- **Stateful Services**: Durable Objects for AI agents
- **Database**: D1 (SQLite) with Drizzle ORM
- **Storage**: R2 (object storage), KV (key-value)
- **Sandbox**: Cloudflare Containers for isolated app previews
- **AI Gateway**: Cloudflare AI Gateway (multi-provider routing)

## 🔄 Core Workflow

1. **User Input** → User submits prompt via chat interface
2. **Agent Initialization** → `CodeGeneratorAgent` Durable Object created
3. **Blueprint Generation** → Project structure and template selection
4. **Phase-wise Generation**:
   - Phase Generation → Plan next development phase
   - Phase Implementation → Generate files using SCOF streaming format
   - Code Review → Detect issues via static analysis
   - Auto-fixing → FastCodeFixer/RealtimeCodeFixer operations
5. **Live Preview** → Deploy to sandbox container for real-time testing
6. **Iteration** → User provides feedback via WebSocket
7. **Deployment** → Deploy to Workers for Platforms (dispatch namespace)

## 📁 Key Directories

```
worker/
├── agents/              # AI agent system
│   ├── core/           # Agent base classes and state management
│   ├── operations/     # AI operations (PhaseGen, CodeReview, etc.)
│   ├── services/       # FileManager, StateManager, CodingAgent
│   └── output-formats/ # SCOF, diff formats for code streaming
├── api/                # REST API routes and controllers
│   ├── routes/         # Route setup functions
│   └── controllers/    # Request handlers
├── database/           # Drizzle schema and services
├── services/           # Core services
│   ├── sandbox/        # Container management
│   ├── deployer/       # Workers deployment
│   ├── code-fixer/     # Code fixing utilities
│   └── rate-limit/     # Rate limiting
├── middleware/         # Auth, security middleware
└── config/             # Configuration management

src/
├── routes/             # React Router pages
│   └── chat/           # Main chat/generation interface
├── components/         # React components
├── hooks/              # Custom React hooks
├── contexts/           # React Context providers
└── lib/                # Frontend utilities
```

## 🤖 Agent System

### Core Agent
- **`SimpleCodeGeneratorAgent`** (`worker/agents/core/simpleGeneratorAgent.ts`)
  - Deterministic state machine orchestrator
  - Manages phase-wise code generation
  - Handles WebSocket communication
  - Coordinates all AI operations

### AI Operations
Located in `worker/agents/operations/`:
- **PhaseGenerationOperation** → Plans next development phase
- **PhaseImplementationOperation** → Generates code files (SCOF format)
- **CodeReviewOperation** → Detects code issues
- **FastCodeFixerOperation** → Quick issue fixes
- **FileRegenerationOperation** → Surgical file repairs
- **ScreenshotAnalysisOperation** → Visual validation
- **UserConversationProcessor** → Processes user feedback

### State Management
- Agent state stored in Durable Object (persists across connections)
- State includes: blueprint, generated files, phases, errors, conversation history
- File state tracked with hashes for efficient updates

## 🗄️ Database Schema

Key tables (`worker/database/schema.ts`):
- **users** → User accounts with OAuth support
- **sessions** → JWT session management
- **apps** → Generated applications metadata
- **userSecrets** → Encrypted API keys (BYOK)
- **userModelConfigs** → Per-user AI model overrides
- **favorites**, **stars**, **appLikes**, **appComments** → Community features

## 🔐 Authentication

- **JWT-based sessions** with refresh tokens
- **OAuth providers**: Google, GitHub
- **Route protection levels**:
  - `public` → No auth required
  - `authenticated` → Requires login
  - `owner-only` → Requires resource ownership
- **Rate limiting** per user and globally

## 🌐 API Routes

Main routes (`worker/api/routes/`):
- `POST /api/agent` → Start code generation
- `GET /api/agent/:agentId/ws` → WebSocket connection
- `GET /api/agent/:agentId/connect` → Connect to existing agent
- `GET /api/agent/:agentId/preview` → Deploy preview
- `POST /api/auth/*` → Authentication endpoints
- `GET /api/apps/*` → App management
- `POST /api/secrets/*` → User secrets management
- `POST /api/model-config/*` → Model configuration
- `POST /api/github-exporter/*` → GitHub export

## 💬 WebSocket Protocol

### Frontend → Agent
- `generate_all` → Start code generation
- `user_message` → Send user feedback
- `get_conversation_state` → Request current state

### Agent → Frontend
- `generation_started` → Generation began
- `file_generated` → New file created
- `phase_update` → Phase progress update
- `preview_ready` → Preview URL available
- `error` → Error occurred
- `conversation_state` → Full state sync

## 🚀 Deployment Flow

1. **Sandbox Preview** → Temporary container for development/testing
2. **Permanent Deployment** → Workers for Platforms (dispatch namespace)
3. **GitHub Export** → Push code to user's repository
4. **Custom Domain** → Subdomain routing (`app.yourdomain.com`)

## ⚙️ Configuration

- **Global settings**: Stored in KV (`platform_configs`)
- **User overrides**: Per-user configs (`user_config:${userId}`)
- **Security settings**: Rate limits, CORS, CSRF protection
- **AI model config**: Per-operation model selection
- **Custom providers**: Support for OpenAI-compatible APIs

## 🛠️ Development Commands

```bash
# Frontend
npm run dev              # Start Vite dev server
npm run build            # Build production frontend

# Worker
npm run local            # Run Worker locally with Wrangler
npm run deploy           # Deploy to Cloudflare Workers

# Database
npm run db:generate       # Generate migrations (local)
npm run db:migrate:local # Apply migrations locally
npm run db:studio        # Open Drizzle Studio

# Testing
npm run test             # Run tests
```

## 📦 Key Dependencies

### Frontend
- `react`, `react-dom` → UI framework
- `react-router` → Routing
- `monaco-editor` → Code editor
- `partysocket` → WebSocket client
- `tailwindcss` → Styling
- `framer-motion` → Animations

### Backend
- `hono` → Web framework
- `drizzle-orm` → Database ORM
- `@cloudflare/sandbox` → Container SDK
- `agents` → Cloudflare Agents SDK
- `jose` → JWT handling
- `zod` → Schema validation

## 🎨 Code Generation Process

1. **Blueprint Phase**: Analyze requirements, select template, create project structure
2. **Phase Generation**: Plan development phases iteratively
3. **Phase Implementation**: Generate files using SCOF streaming format
4. **Code Review**: Static analysis, linting, type checking
5. **Error Fixing**: Automated fixes via FastCodeFixer/RealtimeCodeFixer
6. **Review Cycles**: Up to 5-10 review cycles for quality assurance
7. **Deployment**: Deploy to sandbox for preview, then to Workers for Platforms

## 🔍 Important Patterns

### Type Safety
- **Never use `any`** → Always define proper types
- **No dynamic imports** → All imports must be static
- **Strict TypeScript** → Full type coverage

### Code Quality
- **DRY principles** → Avoid duplication
- **Professional comments** → Explain code, not changes
- **Error handling** → Comprehensive error management
- **Logging** → Structured logging throughout

### Cloudflare Patterns
- **Durable Objects** → For stateful, long-running operations
- **D1 Database** → Use batch operations for performance
- **Environment Bindings** → Access via `env` parameter
- **Service Bindings** → For inter-worker communication

## 🚨 Important Notes

- **Authentication system** is under development (needs review/rewrite)
- **Database schema** is actively being refined
- **Tests** need replacement (current tests are AI-generated placeholders)
- **Focus on core AI generation** functionality when making changes
- **Prioritize Cloudflare-native** solutions (D1, Durable Objects, R2)

## 📚 Additional Resources

- **Architecture Diagrams**: `docs/architecture-diagrams.md`
- **Setup Guide**: `docs/setup.md`
- **CLAUDE.md**: Development guidelines and patterns
- **README.md**: Deployment and usage instructions

