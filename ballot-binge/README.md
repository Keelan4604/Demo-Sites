# Ballot Binge

A swipe-based ballot and political matching platform. Swipe through candidates and ballot measures to build your personalized voter guide — fast, fun, and non-partisan.

## Tech Stack

- **Next.js 16** (App Router, TypeScript)
- **Tailwind CSS 4** for styling
- **Prisma 5** ORM with SQLite (switchable to PostgreSQL)
- **Framer Motion** for swipe physics and animations
- **Zustand** for client-side state management

## Quick Start

### Prerequisites

- Node.js 20+
- npm

### Setup

```bash
# Clone and install
git clone <repo-url>
cd ballot-binge
npm install

# Set up environment
cp .env.example .env

# Create database and run migrations
npx prisma migrate dev

# Seed the database with initial content
npm run db:seed

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Production build |
| `npm start` | Start production server |
| `npm run db:migrate` | Run Prisma migrations |
| `npm run db:seed` | Seed database with ballot content |
| `npm run db:reset` | Reset DB and re-seed |
| `npm run db:studio` | Open Prisma Studio (DB GUI) |

## Architecture

```
ballot-binge/
├── prisma/
│   ├── schema.prisma          # Database schema
│   └── migrations/            # SQL migrations
├── scripts/
│   └── seed.ts                # Database seed script
├── src/
│   ├── app/                   # Next.js pages & API routes
│   │   ├── page.tsx           # Landing page
│   │   ├── swipe/page.tsx     # Swipe deck page
│   │   ├── results/page.tsx   # Results summary page
│   │   └── api/               # REST API endpoints
│   │       ├── items/         # GET ballot items
│   │       └── swipes/        # POST swipe choices
│   ├── components/            # React components
│   │   ├── SwipeDeck.tsx      # Card stack orchestrator
│   │   ├── SwipeCard.tsx      # Individual swipe card
│   │   ├── ActionButtons.tsx  # Yes/No/Skip buttons
│   │   ├── ProgressBar.tsx    # Swipe progress indicator
│   │   ├── DetailModal.tsx    # Expanded card detail view
│   │   └── ResultsSummary.tsx # Final results page
│   ├── lib/                   # Shared utilities (portable)
│   │   ├── types.ts           # Shared TypeScript types
│   │   ├── db.ts              # Prisma client singleton
│   │   └── matching.ts        # Scoring/matching logic
│   └── store/
│       └── swipeStore.ts      # Zustand client state
└── public/                    # Static assets
```

### Key Design Decisions

- **Business logic in `lib/`**: Types, matching logic, and data models are framework-agnostic and portable to React Native
- **API routes as boundaries**: Clean REST API makes future mobile app consumption straightforward
- **Zustand over Context**: Simpler, works outside React tree, easily portable
- **SQLite for dev, Postgres for prod**: Change one line in `prisma/schema.prisma` to switch
- **No auth in v1**: Architecture supports adding auth later (session IDs already tracked on swipes)
- **Discriminated unions for types**: `SwipeItem = { type: "candidate", data } | { type: "measure", data }` enables type-safe narrowing

### Database Schema

**Core entities:**
- `Jurisdiction` — States, counties, cities
- `Topic` — Issue categories (Housing, Healthcare, etc.)
- `Candidate` — Political candidates with stances
- `BallotMeasure` — Ballot propositions with yes/no framing
- `Swipe` — User interaction records (anonymous sessions)

## Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Import project in [Vercel](https://vercel.com)
3. Set `DATABASE_URL` environment variable to a PostgreSQL connection string
4. Update `prisma/schema.prisma` provider to `"postgresql"`
5. Deploy

For PostgreSQL hosting, [Neon](https://neon.tech) or [Supabase](https://supabase.com) offer free tiers.

### Cloudflare

1. Build with `npm run build`
2. Deploy the `.next` output via Cloudflare Pages
3. Set up a PostgreSQL database (e.g., Neon) and configure `DATABASE_URL`
4. Connect your domain through Cloudflare DNS

### Switching to PostgreSQL

1. Update `prisma/schema.prisma`:
   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }
   ```
2. Update `.env` with your PostgreSQL connection string
3. Run `npx prisma migrate dev`
4. Run `npm run db:seed`

## Future Mobile App Migration

The codebase is structured for smooth migration to React Native / Expo:

- **`src/lib/types.ts`** — Shared types, zero web dependencies
- **`src/lib/matching.ts`** — Scoring logic, zero web dependencies
- **`src/store/swipeStore.ts`** — Zustand works in React Native
- **API routes** — Already REST; mobile app consumes the same endpoints
- **Component structure** — Card/deck pattern maps directly to React Native gesture handler

Migration path:
1. Create Expo app in a monorepo alongside the web app
2. Share `lib/` types and matching logic via workspace packages
3. Rebuild UI components with React Native + Reanimated
4. Point API calls at the deployed web backend

## Seed Data

The database is seeded with realistic ballot content across California, North Carolina, and Texas:
- 8 ballot measures (housing bonds, clean energy, education, criminal justice, AI privacy, transit, immigration, pre-K)
- 6 candidates across multiple offices and parties
- 10 topic categories

Edit `scripts/seed.ts` to add or modify content.
