# TaskFlow

Trello-style Kanban board: register, log in, create boards with columns and cards, drag cards across columns, changes persist in Postgres.

## Stack

- Next.js 14 (App Router) + TypeScript + Tailwind
- PostgreSQL + Prisma
- NextAuth.js (credentials, JWT sessions)
- `@dnd-kit/core` + `@dnd-kit/sortable` for drag and drop

## Local setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Make sure Postgres is running and create a database:

   ```bash
   createdb taskflow
   ```

3. Copy `.env.example` to `.env` and fill in:

   ```bash
   cp .env.example .env
   # generate NEXTAUTH_SECRET with: openssl rand -base64 32
   ```

4. Run the initial migration:

   ```bash
   npx prisma migrate dev
   ```

5. Start the dev server:

   ```bash
   npm run dev
   ```

   App runs at http://localhost:3000 — register a user, then create a board.

## Project layout

```
app/
  (auth)/login, (auth)/register   credentials forms
  boards/                         list of boards
  boards/[id]/                    Kanban view
  api/                            REST routes (auth, register, boards, columns, cards)
components/
  BoardCanvas.tsx                 dnd-kit context, optimistic state, all CRUD callbacks
  ColumnCard.tsx                  sortable column with sortable card list inside
  CardItem.tsx                    sortable card
  CardDetailModal.tsx             edit title/description, delete card
lib/
  prisma.ts                       Prisma client singleton
  auth.ts                         NextAuth credentials config
  session.ts                      getCurrentUserId() helper
  orderUtils.ts                   midpoint() for fractional ordering
middleware.ts                     protects /boards/* via withAuth
prisma/schema.prisma              User / Board / Column / Card
```

## Ordering strategy

Columns and cards each carry a `Float order`. New items are inserted at the midpoint of neighbors:

- between `a` and `b` → `(a + b) / 2`
- before first → `firstOrder / 2`
- after last → `lastOrder + 1`

When the gap shrinks below `0.001`, `lib/orderUtils.ts` exposes `rebalancedOrders(count)` to renumber as `1, 2, 3...` (not auto-triggered yet).

## Deploying to Vercel

1. Push this repo to GitHub.
2. Provision Postgres (Neon, Supabase, or Vercel Postgres).
3. In Vercel: import the repo, set env vars:
   - `DATABASE_URL` — connection string from your Postgres host (use the pooled URL for the app; the direct URL is needed for migrations)
   - `NEXTAUTH_SECRET` — `openssl rand -base64 32`
   - `NEXTAUTH_URL` — `https://your-app.vercel.app`
4. Run migrations against the prod DB once: `DATABASE_URL=... npx prisma migrate deploy`. (Or change Vercel's build command to `prisma migrate deploy && next build`.)
5. Deploy.
