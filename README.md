# Guidni

All-in-one travel platform for curated destinations. Covers 7 content categories — Activities, Stays, Restaurants, Passes, Transfers, Shops, and Local Guides — with full booking flows, a partner dashboard, an admin panel, and a local agent program.

---

## Tech Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 16 (App Router, Turbopack) |
| Styling | Tailwind CSS v4 (CSS-native `@theme {}`) |
| Auth | Better Auth v1 |
| ORM | Prisma v6 + PostgreSQL |
| Validation | Zod v4 |
| UI components | shadcn/ui |
| State | Zustand v5 |
| Data fetching | TanStack Query v5 |
| i18n | next-intl v4 — EN / FR / AR + RTL |
| Toasts | Sonner |
| Package manager | pnpm |

---

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm
- PostgreSQL database

### Install

```bash
pnpm install
```

### Environment variables

Copy `.env.example` to `.env` and fill in:

```env
DATABASE_URL=postgresql://...
BETTER_AUTH_SECRET=...
BETTER_AUTH_URL=http://localhost:3000
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Database

```bash
pnpm prisma migrate dev
pnpm prisma db seed
```

### Dev server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Project Structure

```
app/[locale]/
  (categories)/       activities, stays, restaurants, passes,
                      transport (transfers + rentals), shops, destinations
  (dashboards)/       admin/, partner/, agent/
  (protected)/        bookings/, checkout/, wishlist/, profile/
  (public)/           login, about, blog, become-partner, become-agent

lib/
  actions/            server actions per feature
  auth/               Better Auth server + client config
  db/                 Prisma singleton (exports `prisma`)
  utils/              cn(), booking-ref, shop/restaurant categories
  validations/        Zod schemas
  planner/            AI planner types + engine (Phase 17)

components/
  ui/                 shadcn/ui primitives
  shared/             Navbar, Footer, ImageGallery, DatePickerInput,
                      TimePickerInput, DescriptionWithToggle, RatingSummary
  [feature]/          feature-scoped components
  badges/             BadgeChip, BadgeList, GuidniReviewSection
  wishlist/           WishlistButton
  cart/               CartDrawer, CartItem

stores/               Zustand stores (destination, cart)
messages/             en.json  fr.json  ar.json
prisma/               schema.prisma, seed.ts
memory/               architecture docs (loaded on demand)
```

---

## Features

### Public platform
- **Activities** — listing with filters, detail page (gallery, anchor nav, booking card, host strip, reviews, related)
- **Stays** — same pattern + amenities, price breakdown
- **Restaurants** — hours, reservations, full menu with QR code
- **Passes** — bundled activity passes with QR booking
- **Transport** — Transfers and Rentals at `/transport/transfers/[slug]` + `/transport/rentals/[slug]`
- **Shops** — product catalog, cart, checkout, orders
- **Destinations** — destination selector persisted via cookie, guide pages

### Booking & checkout
- Unified checkout flow for activities, stays, passes, transfers, rentals
- Alphanumeric booking references + QR codes + verify page
- Cart system for shop orders

### User area
- Bookings history with QR codes
- Wishlist across all content types
- Reviews (purchase-gated where applicable)
- Profile management

### Partner dashboard
- Manage listings for all 7 categories
- View and respond to bookings / reservations / orders
- Image upload for all listing types
- Badge system — request Guidni reviews, track active badges
- QR code tab for restaurant menus

### Admin dashboard
- Full CRUD for all content types and destinations
- Badge assignment and Guidni review editor
- Shops / products / orders management
- Agent approvals and referral queue

### Local Agent program
- Public become-agent page + application form
- Admin approval flow
- Invitation system with QR codes
- Commission on bookings (Activities + Stays)
- Points wallet with tier system (Starter / Pro / Elite)
- Partner referral tracking
- Public leaderboard + pseudonym support

### Badge system
- 20+ badge types across 6 content categories
- Verified · Guest Favorite · Reviewed by Guidni · Owner-Operated · Top Rated · Eco Friendly
- Icon overlays on cards and carousels
- Public `/badges` page

### Internationalisation
- English, French, Arabic (RTL)
- All UI strings in `messages/` — no hardcoded strings

---

## Key Conventions

**Prisma client — always `prisma`, never `db`**
```ts
import { prisma } from "@/lib/db";
```

**Server actions — typed union, never throw**
```ts
"use server";
return { success: true as const, data: result };
return { success: false as const, error: "message" };
```

**Auth**
```ts
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
const session = await auth.api.getSession({ headers: await headers() });
// session?.user.role: "ADMIN" | "USER" | "PARTNER" | "AGENT"
```

**Translations — always update all 3 files**
```ts
// client
const t = useTranslations("Namespace");
// server
const t = await getTranslations({ locale, namespace: "Namespace" });
```

---

## Seed data

```bash
pnpm prisma db seed
```

Seeds realistic data for Djerba and Dubai across all content types. Safe to re-run (uses `upsert` on slug).

---

## Roles

| Role | Access |
|---|---|
| `USER` | Book, wishlist, review, profile |
| `PARTNER` | Partner dashboard for own listings |
| `AGENT` | Agent dashboard, invitations, earnings |
| `ADMIN` | Full admin dashboard |
