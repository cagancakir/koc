# TaskFlow

Trello-style Kanban board: register, log in, create boards with columns and cards, drag cards across columns, changes persist in Postgres.

## Technical Report / Submission Highlights

This project implements a flawless, highly performant core drag-and-drop experience. Below are the key architectural and technical decisions made to ensure scalability, performance, and best-in-class UX:

### 1. Drag-and-Drop Library Selection (`@dnd-kit`) & Mobile Usability
Instead of using native HTML5 drag-and-drop (limited formatting) or `react-beautiful-dnd` (no longer maintained), I opted for **`@dnd-kit/core`** and **`@dnd-kit/sortable`**. 
* **Why?** It is modern, modular, natively supports accessible keyboard inputs, and its lightweight `PointerSensor` seamlessly handles both mouse clicks and touch events on mobile devices (e.g., dragging without conflicting with vertical native scrolling).

### 2. The Ordering Algorithm: Persisting Order Robustly
A critical challenge in Kanban boards is persisting item order natively after a page refresh. Instead of assigning integer indices (1, 2, 3...) which requires an aggressive `O(N)` database update query, I implemented a **Fractional Ordering (Midpoint)** strategy.
* **How it works:** Both columns and cards have a `Float` type `order` column. When a card is dropped between card A and card B, the system simply assigns the new card an order of `(A.order + B.order) / 2`.
* **The Result:** Moving a card only requires updating a **single row** in the database. This guarantees `O(1)` time complexity and fluid performance even if a column has 10,000 cards. Note: This same logic applies to columns; **columns are also fully draggable and re-orderable**.

### 3. Optimistic UI Updates for Fluid Performance
Kanban boards must feel instantly responsive, especially under heavy card loads. To achieve this, I utilized **Optimistic State Management**. When a user drops a card into a new column, the React state immediately updates the UI without waiting for the server response. The API `PATCH` request happens asynchronously in the background.

### 4. Feature Prioritization (48-Hour Scope)
Given the tight 48-hour time constraint, I applied strict scoping to ensure a production-ready core rather than delivering half-finished peripheral features:
* **Excluded:** Board sharing/multiplayer, Activity history logs, and granular card metadata (tags, due dates, assignees) were purposely left out.
* **Included:** I focused 100% on the core mechanics: flawless drag-and-drop UX, visual drop cues, complex data relational integrity (User → Board → Column → Card), bulletproof cache validation, and a seamless cloud deployment on Vercel/Supabase.

### 4. Architecture & Cache Management
The application is built on **Next.js 14 (App Router)** with **Prisma ORM** and **Supabase (PostgreSQL)**.
* **Router Cache Safety**: Modern Next.js aggressively caches client-side navigations (Router Cache). To prevent the "stale board list" bug when navigating back from a Kanban canvas, I explicitly trigger `router.refresh()` upon board creation/deletion. This ensures the user data is always synced with the database while preserving the blazing-fast SPA navigational feel.

---

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
