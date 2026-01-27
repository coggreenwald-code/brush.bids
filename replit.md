# BrushBids

## Overview

BrushBids is a student art auction platform that connects emerging student artists with collectors. The platform features AI-powered curation for artwork submissions, real-time bidding, and charitable giving integration. Artists submit their work for AI review, approved pieces enter the auction gallery, and a portion of sales goes to selected charities.

Key features:
- Artist dashboard with submission management and earnings tracking
- AI curation system that scores and provides feedback on artwork submissions
- Real-time auction gallery with bidding functionality
- Charity selection for artists (15% of sales go to chosen charity)
- Admin panel for manual curation override
- Replit Auth integration for user authentication

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript, using Vite as the build tool
- **Routing**: Wouter for client-side routing (lightweight alternative to React Router)
- **State Management**: TanStack Query (React Query) for server state and caching
- **Styling**: Tailwind CSS with shadcn/ui component library (New York style)
- **Animations**: Framer Motion for gallery transitions and UI interactions
- **Charts**: Recharts for dashboard visualizations
- **Forms**: React Hook Form with Zod validation

### Backend Architecture
- **Runtime**: Node.js with Express
- **Language**: TypeScript with ES modules
- **API Design**: RESTful endpoints defined in `shared/routes.ts` with Zod schemas for type-safe request/response validation
- **Authentication**: Replit Auth with OpenID Connect, session-based with PostgreSQL session store

### Data Storage
- **Database**: PostgreSQL with Drizzle ORM
- **Schema Location**: `shared/schema.ts` for shared types, `shared/models/` for domain-specific models
- **Migrations**: Drizzle Kit with `db:push` command for schema synchronization

### Core Data Models
- **Users**: Role-based (artist, buyer, admin) with Replit Auth integration
- **Artworks**: Status-based workflow (pending → approved/rejected), includes AI scoring
- **Bids**: Linked to artworks and bidders with timestamp tracking
- **Charities**: Reference table for artist charity selection
- **Conversations/Messages**: Chat functionality with AI integration

### AI Integration
- OpenAI API (via Replit AI Integrations) for:
  - Artwork curation scoring and feedback
  - Image generation capabilities
  - Voice chat and text-to-speech
  - Chat completions

### Project Structure
```
client/           # React frontend
  src/
    components/   # Reusable UI components
    pages/        # Route-based page components
    hooks/        # Custom React hooks (auth, artworks, bids)
    lib/          # Utilities and query client
server/           # Express backend
  replit_integrations/  # Pre-built AI and auth modules
shared/           # Shared types, schemas, and route definitions
  models/         # Domain-specific database models
  schema.ts       # Main Drizzle schema
  routes.ts       # API route definitions with Zod schemas
```

## External Dependencies

### Database
- **PostgreSQL**: Primary database, connection via `DATABASE_URL` environment variable
- **connect-pg-simple**: Session storage in PostgreSQL

### Authentication
- **Replit Auth**: OpenID Connect integration via `openid-client` and Passport.js
- **Required env vars**: `ISSUER_URL`, `REPL_ID`, `SESSION_SECRET`

### AI Services
- **OpenAI API**: Via Replit AI Integrations
- **Required env vars**: `AI_INTEGRATIONS_OPENAI_API_KEY`, `AI_INTEGRATIONS_OPENAI_BASE_URL`
- **Capabilities**: Chat completions, image generation, speech-to-text, text-to-speech

### Frontend Libraries
- **shadcn/ui**: Component library built on Radix UI primitives
- **Framer Motion**: Animation library
- **Recharts**: Dashboard charts
- **Lucide React**: Icon library

### Build Tools
- **Vite**: Frontend bundler with HMR
- **esbuild**: Server bundler for production
- **tsx**: TypeScript execution for development