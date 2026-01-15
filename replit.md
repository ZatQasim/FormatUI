# FormAT - AI Assistant Platform

## Overview

FormAT is a full-stack AI-powered productivity platform combining a Discord bot with a web dashboard. The application provides real-time translation, AI chat assistance, content generation, task management, web search with AI summarization, and gamified learning features (quizzes, habits, focus sessions). The platform uses a freemium model with Stripe integration for Pro subscriptions.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript, bundled via Vite
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack React Query for server state and caching
- **Styling**: Tailwind CSS v4 with custom dark theme, CSS variables for theming
- **UI Components**: Radix UI primitives wrapped in shadcn/ui component library
- **Animations**: Framer Motion for page transitions and micro-interactions
- **Directory**: `formatui-env/src/` contains all frontend code
  - Pages in `pages/` (Home, AI, Generator, Tasks, Security, Pro, etc.)
  - Reusable components in `components/ui/` (shadcn components)
  - Layout shell in `components/layout/Shell.tsx`

### Backend Architecture
- **Runtime**: Node.js with Express, TypeScript compiled via tsx/esbuild
- **Entry Point**: `mdr-system/index.ts` initializes Express and HTTP server
- **API Routes**: `mdr-system/routes.ts` registers all REST endpoints
- **Static Serving**: Production serves built frontend from `posted assets/public/`
- **Development**: Vite dev server with HMR middleware integration

### Discord Bot
- **Library**: discord.js v14 with slash commands
- **Location**: `mdr-system/bot/` directory
- **Features**:
  - Self-training AI with pattern matching and knowledge base (`self-training-ai.ts`)
  - Web search engine using DuckDuckGo scraping (`search-engine.ts`)
  - Translation engine with MyMemory API fallback (`translation-engine.ts`)
  - Content generator with template-based synthesis (`generator-engine.ts`)
  - Task management commands (`task-manager.ts`)
  - Quiz system with multiple topics and XP rewards

### Data Layer
- **Database**: PostgreSQL with Drizzle ORM
- **Schema**: `schema-endpoint/schema.ts` defines all tables
- **Tables**: users, tasks, habits, focusSessions, reflections, notes, resources, skills, reminders, polls, userStats, quizScores, aiKnowledge, aiTrainingData, searchHistory, questionHistory, securityReports
- **Storage Interface**: `mdr-system/storage.ts` exports typed CRUD operations
- **Migrations**: Drizzle Kit with config at `drizzle.config.ts`

### Authentication
- Simple tag-based auth (Format Tag: Name#1234 pattern)
- User credentials stored in PostgreSQL users table
- Pro status tracked per user for feature gating
- No session/JWT - localStorage stores user tag on frontend

### Build System
- **Config Files**: Located in `json/` directory (tsconfig.json, runner.json for shadcn)
- **Vite Config**: `vitepoint.sources/vite.config.ts` with path aliases
- **Production Build**: `build module/build.ts` uses esbuild for server, Vite for client
- **Output**: `posted assets/` directory contains production bundles

## External Dependencies

### Third-Party Services
- **Stripe**: Payment processing for Pro subscriptions (checkout sessions, webhooks)
- **OpenAI API**: AI features and translation (optional, with fallback patterns)
- **Discord API**: Bot functionality via discord.js
- **DuckDuckGo**: Web search scraping (no API key required)
- **MyMemory API**: Free translation service fallback

### Database
- **PostgreSQL**: Primary data store, connection via `DATABASE_URL` environment variable
- **Drizzle ORM**: Type-safe queries and schema management

### Key NPM Packages
- Frontend: react, wouter, @tanstack/react-query, framer-motion, tailwindcss, radix-ui components
- Backend: express, discord.js, drizzle-orm, pg, stripe, axios, cheerio
- Build: vite, esbuild, tsx, typescript

### Environment Variables Required
- `DATABASE_URL` - PostgreSQL connection string
- `DISCORD_BOT_TOKEN` - Discord bot authentication
- `STRIPE_SECRET_KEY` - Stripe API key
- `STRIPE_WEBHOOK_SECRET` - Stripe webhook verification
- `OPENAI_API_KEY` - Optional, for enhanced AI features
- `WEBHOOK_URL` - Optional, for API monitoring logs