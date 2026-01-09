# FormatUI AI Assistant Platform

## Overview
FormatUI is an advanced Discord bot and web application providing real-time translation, AI-powered assistance, content generation, and intelligent task management with mobile-first design.

## Current State
- **Discord Bot**: LIVE and operational as `FormatUI#7546`
- **Web Dashboard**: Available at port 5000 (mobile-optimized)
- **Database**: PostgreSQL for persistent data storage
- **Translation**: Real-time API-powered translation across 10+ languages

## Key Features
- **Real-time Translation**: API-powered translation with support for 10+ languages
- **AI Assistant**: Multi-language support with pattern learning
- **Task Management**: Kanban board with priority levels
- **Habit Tracking**: Streak tracking and progress visualization
- **Focus Sessions**: Pomodoro-style productivity tracking
- **Quiz System**: Multi-topic learning with XP rewards
- **Virtual Pet**: Pet growth system tied to user activity
- **Leaderboard**: Community rankings and achievements
- **Discord Integration**: Full slash command support
- **Mobile Optimized**: Responsive design for all device sizes

## Architecture

### Discord Bot (`server/bot/`)
- **index.ts**: Main bot with 25+ slash commands
- **self-training-ai.ts**: Self-learning AI with knowledge base
- **search-engine.ts**: Web search with AI summarization

### Web Interface (`client/src/`)
- **pages/Home.tsx**: Search and dashboard
- **pages/AI.tsx**: Chat interface
- **pages/Generator.tsx**: Content generation
- **pages/Tasks.tsx**: Task management

## Tech Stack
- **Frontend**: React, TypeScript, Vite, TailwindCSS, Framer Motion
- **Backend**: Express, Node.js, Discord.js
- **Database**: PostgreSQL with Drizzle ORM
- **Translation**: OpenAI API with fallback patterns
- **Mobile**: Responsive Tailwind with mobile-first approach

## Environment Variables
- `DISCORD_BOT_TOKEN` - Discord bot authentication
- `DATABASE_URL` - PostgreSQL connection
- `OPENAI_API_KEY` - Translation and AI features

## User Preferences
- Modern dark theme with gradient accents
- Space Grotesk for headings, Inter for UI
- Glassmorphism design with mobile responsiveness
- Zero-friction authentication (Discord OAuth)

## Recent Changes (January 2026)
- Rebranded to FormatUI
- Integrated real-time translation API
- Added Discord OAuth authentication
- Mobile-optimized all interfaces
- Enhanced leaderboard with real data
- Improved quiz tracking system
