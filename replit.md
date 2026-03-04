# BrushBids

## Overview

BrushBids is a student art auction platform that connects emerging student artists with collectors. The platform features expert curation (supported by AI tools) for artwork submissions, real-time bidding, and charitable giving integration. Artists submit their work for curator review, approved pieces enter the auction gallery, and a portion of sales goes to selected charities.

Key features:
- Artist dashboard with submission management and earnings tracking
- Expert curation system with two review options: instant AI-assisted feedback or human curator review
- Image upload from camera roll or direct artwork scanning via device camera
- Real-time auction gallery with bidding functionality
- Charity selection for artists (10% of sales go to chosen charity)
- Artist promotion tool (0-20% boost to increase listing visibility)
- Admin curation tab in Dashboard (approve/reject, write/edit curator feedback, trigger AI review, manage past feedback, delete artworks)
- Dedicated feedback update endpoint (PATCH /api/artworks/:id/feedback) for editing feedback without changing status
- Replit Auth integration for user authentication
- Role-based accounts: Artist, Collector, or Both
- Welcome onboarding modal for new users to select their role and collect name
- Role switching available anytime from Dashboard settings
- Dark Artie.com-inspired design with multi-color accents (violet, pink, blue, emerald) on deep navy background
- Anti-sniping auction system with configurable duration and 2-minute extension rule
- Artist portfolio section with 2-week sell pipeline (integrated as Dashboard tab)
- QR code generation for approved artworks (for art shows)
- 20-second delayed signup popup for new homepage visitors
- Artwork dimensions (Length x Width in inches) required during submission
- Mobile-optimized carousel with centered artist name and title below artwork
- Profile picture system: upload custom photo or choose initial-based avatar in 8 colors (violet, pink, blue, emerald, orange, red, sky, lime)

### Anti-Sniping Auction System
- Artworks have a configurable auction duration (1, 3, 5, 7, 14, or 30 days)
- Auction timer starts when artwork is approved by admin
- `endTime` field in database tracks exact auction end
- If a bid is placed within the last 2 minutes, the auction automatically extends by 2 minutes
- Bids are rejected after auction ends (server-side validation)
- Live countdown timer on artwork detail page with urgent styling when < 5 minutes remain
- Gallery cards show "Xd Xh left" or "Ended" time indicators
- Auction end state disables bidding UI and shows "Auction Has Ended" notice

### Revenue Split
- Base: 75% artist, 15% platform, 10% charity
- With boost: Boost percentage deducted from artist's share, added to platform's share
- Example: 10% boost = 65% artist, 25% platform, 10% charity

### Promotion Feature
- Artists can boost approved artworks by paying 0-20% of final sale price
- Boosted listings appear first in gallery regardless of sort option
- Boost fee only charged when artwork sells (no upfront cost)
- Visual "Boosted" badge on promoted listings

## User Preferences

Preferred communication style: Simple, everyday language.

## Design System (Artie.com-inspired redesign)

### Color Palette (Multi-color)
- **Background**: #0a0a0f (deep navy/charcoal) - hsl(240 10% 6%)
- **Card Background**: bg-white/[0.02] with border-white/5
- **Primary — Violet**: #A78BFA — CTAs, section labels, active indicators, primary buttons
- **Accent — Pink**: #F472B6 — Secondary highlights, hover effects, badges
- **Info — Blue**: #60A5FA — Collector elements, info accents, secondary data
- **Success — Emerald**: #34D399 — Money/earnings, charity, success states
- **Text Primary**: White (#f2f2f2)
- **Text Secondary**: white/60, white/50, white/40 opacity levels
- **Glass effects**: backdrop-blur-xl with bg-white/5 or bg-[#0a0a0f]/80

### Typography
- **Body Font**: Inter (sans-serif) - Clean geometric, used for headings and body
- **Display Font**: Playfair Display (serif) - Used sparingly for artistic display moments (carousel titles, testimonials)
- **Section Labels**: text-xs font-medium text-[#A78BFA] uppercase tracking-[0.3em]
- **Gradient text**: `.gradient-text` — purple→pink→blue multi-color gradient

### Section Design (Artie.com-style)
- **Outlined sections**: `.section-outlined` — thin white/8 border, rounded-2xl, relative overflow-hidden
- **Gradient border sections**: `.section-gradient-border` — purple→blue→pink gradient border via mask
- **Watermark text**: `.watermark-text` — Giant faint stroke-only text behind section content (e.g., "Process", "Impact", "Voices")
- **Rich backgrounds**: Each section has unique visual depth:
  - `.bg-mesh-purple`: Multi-layered purple radial gradients
  - `.bg-mesh-blue`: Multi-layered blue radial gradients
  - `.bg-mesh-mixed`: Combined purple+blue+pink+emerald gradients
  - `.bg-dots` / `.bg-dots-sparse`: Subtle dot pattern overlays
  - `.bg-grid-fine`: Fine grid line pattern
  - `.bg-noise`: CSS noise texture overlay
- **Decorative shapes**: Floating gradient orbs at section edges
  - `.floating-orb` / `.floating-orb-sm` with blur filter
  - `.gradient-orb-purple`, `.gradient-orb-blue`, `.gradient-orb-pink`, `.gradient-orb-emerald`
  - `.geometric-lines` — Abstract circle outlines at section edges
- **3D shape images**: Artie.com-style pre-rendered 3D geometric objects placed at section edges
  - AI-generated PNG images with transparent backgrounds: torus rings (teal, purple, blue), spheres (teal, blue), rounded cube (pink), thin ring (purple), gem (green)
  - Imported via `@assets/3d-*.png` and rendered as `<img>` elements with absolute positioning
  - Shapes placed in intentional groups (2-3 per section) that interact with each other and structural elements
  - Threading lines (`.threading-line`) — thin vertical lines that torus shapes slide up and down through
  - `.perspective-section` on parent sections enables 3D perspective transforms
  - Animation classes for real 3D movement:
    - `.animate-spin-slide` / `.animate-spin-slide-alt` — torus shapes spinning while sliding up/down a threading line (staggered)
    - `.animate-spin-float` / `.animate-spin-float-reverse` — continuous Y-axis 3D rotation with gentle float
    - `.animate-tilt-float` — X-axis rotation for flat ring shapes (rocking/tilting)
    - `.animate-rock-orbit` — small orbital path with gentle rocking for accent shapes
    - `.animate-shape-rock` — gentle Z-axis rocking oscillation
    - `.animate-shape-pulse` — subtle scale pulsing with slight rotation
  - Shapes hidden on mobile (`hidden md:block`) for clean mobile experience
- **Section tints**: `.section-tint-purple`, `.section-tint-blue`, `.section-tint-mixed`

### Design Elements
- **Lenis smooth scroll**: Premium slow scroll feel via Lenis library, initialized in App.tsx
- **Cards**: Dark glass cards (bg-white/[0.02] border-white/5), hover:border-white/10
- **Buttons**: Pill-shaped (rounded-full), white CTA (bg-white text-[#0a0a0f]), outline (border-white/20 text-white)
- **Navbar**: Glass-morphic (glass-nav), scroll-aware (hides on scroll down, shows on scroll up)
- **Footer**: 3 link columns + large outlined SVG BrushBids wordmark (stroke-only, no fill) + bg-mesh-purple
- **Animations**: Framer Motion fade-ins, CSS transitions, hover elevation, floating orbs (animate-float, animate-float-slow, animate-float-reverse, animate-orb-drift)
- **Dividers**: Gradient divider lines (divider-line utility — purple-tinted)
- **Glow effects**: `.glow-purple`, `.glow-blue`, `.glow-pink` (replaced `.glow-gold`)
- **Hero sections**: Full-width with overlay gradients, animated gradient backgrounds (hero-gradient — purple/blue/pink)

### Component Patterns
- Page headers include violet uppercase section labels above bold titles
- Full-width sections: width: 100vw, marginLeft: calc(-50vw + 50%)
- Testimonial slider with progress bullet indicators
- Stats counters with Intersection Observer count-up animations
- Sections wrapped in outlined containers with watermark text and floating orbs

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
- **Artworks**: Status-based workflow (pending → approved/rejected), includes AI scoring, dimensions field
- **Bids**: Linked to artworks and bidders with timestamp tracking
- **Charities**: Reference table for artist charity selection
- **PortfolioItems**: Artist portfolio pieces with 2-week sell pipeline (listedForSale, listedAt tracking)
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
- **Lenis**: Smooth scroll library for premium scroll feel
- **Recharts**: Dashboard charts
- **Lucide React**: Icon library

### Build Tools
- **Vite**: Frontend bundler with HMR
- **esbuild**: Server bundler for production
- **tsx**: TypeScript execution for development