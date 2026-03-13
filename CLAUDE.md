# CLAUDE.md

## Project Overview

Pull-Up is an agentic scheduling assistant for business travelers. It detects upcoming trips from calendar events (flights, hotels), guides users through a conversational planning flow, prioritizes contacts, runs multi-wave outreach campaigns, monitors responses, negotiates meeting times, recommends venues, and places confirmed meetings on the user's calendar.

Currently in **Phase 1** — specification is complete (PRD, data schema, backlog), engineering implementation has not started.

## Tech Stack

- **Frontend:** Next.js (App Router) on Vercel
- **Auth:** Firebase Auth + Google OAuth
- **Database:** Supabase (PostgreSQL 15+ with RLS, Realtime, Edge Functions, pg_cron)
- **File Storage:** Supabase Storage
- **AI/LLM:** Anthropic Claude API (message drafting, tone matching, response classification, contact prioritization)
- **External APIs:** Google Maps (Places + Directions), Gmail MCP, Google Calendar MCP
- **CRM:** HubSpot (native) + any CRM via MCP (user-provided schema mapping)
- **Communication channels:** Slack MCP, Twilio MCP (SMS)

## Project Structure

```
docs/
  pullup-prd.md                    # Product Requirements Document (v1.1) — full feature spec
  pullup-data-schema.md            # Database schema (v1.1) — 36 tables, enums, RLS, triggers, indexes
  pullup-backlog.md                # Implementation backlog (v1.0) — 15 epics, 149 issues, ~30-34 weeks

design-files/
  DESIGN_SYSTEM.md                 # Complete design specification (colors, typography, spacing, components, animation)
  src/
    app/components/
      WelcomeScreen.tsx            # Welcome/landing screen with hero, value props, CTAs
      HomeView.tsx                 # Dashboard with stats grid, upcoming trips, calendar CTA
      ChatView.tsx                 # Trip planning chat interface with contact suggestions
      ui/                          # 46 Radix UI-based component library (Button, Card, Dialog, Form, etc.)
      figma/ImageWithFallback.tsx  # Figma asset rendering with fallback
    app/routes.tsx                 # Routes: / (welcome), /home (dashboard), /chat/:tripId? (planning)
    styles/
      theme.css                    # CSS variables, gradients, shadows, keyframe animations
      tailwind.css                 # Tailwind integration
      index.css                    # Style imports aggregator
```

Implementation starts with Epic 0 (scaffolding).

## Key Architecture Decisions

- **Serverless:** Vercel functions + Supabase Edge Functions (no long-running servers)
- **Security:** Row-level security on all tables keyed to Firebase UID; OAuth tokens in Supabase Vault
- **Three-tier instruction hierarchy:** system defaults → user-level config → trip-level overrides
- **Supervised agentic loop:** agent proposes, user approves (not autonomous-by-default)
- **Outreach waterfall:** staged waves with 50% static acceptance rate assumption (learning deferred to Phase 2)
- **Multi-calendar:** up to 5 Google Calendars with priority rank and contact type mapping
- **Safe-by-default:** comfort/safety settings on by default, fully user-configurable

## Implementation Order (Epics)

0. Scaffolding (Next.js, Supabase, Firebase, env)
1. Database schema & migrations
2. Auth & user accounts
3. Onboarding flow
4. Dashboard UI
5. Trip detection
6. Planning conversations
7. Outreach engine
8. Response monitoring & scheduling agent
9. Outreach waterfall orchestration
10. Venue recommendations
11. Calendar sync
12. Notifications
13. CRM sync
14. Settings management
15. Testing & hardening

## Design System & Frontend Requirements

**All frontend development must reference the design system.** The source of truth is `design-files/DESIGN_SYSTEM.md` and the reference implementations in `design-files/src/`.

- **Colors:** Coral primary (#FF6B4A) for CTAs and interactive elements. Three signature gradients: Ambient (mint→peach), Warm (coral→orange), Cool (blue→purple). Full neutral palette defined in theme.css.
- **Typography:** System UI font stack (no custom fonts). Scale from 56px Display to 12px labels. Bold (700) for H1-H2, semibold (600) for buttons and H3-H4.
- **Spacing:** 8px base grid system (spacing-1 through spacing-12).
- **Components:** Use the Radix UI component library in `design-files/src/app/components/ui/`. 46 components including Button, Card, Dialog, Form, Tabs, Select, Badge, Avatar, etc.
- **Icons:** Lucide React icon library.
- **Animation:** 150-300ms transitions. Three keyframe animations: fadeIn, slideUp, scalePop. Staggered list animations via CSS animation-delay.
- **Shadows:** 5 elevation levels plus coral glow effect.
- **Responsive:** Mobile-first with breakpoints at 640px and 1024px. Safe area padding on mobile (20px sides, 48px top, 24px bottom).
- **Accessibility:** WCAG AA compliance. 2px coral focus rings. Minimum 44px touch targets.
- **Reference screens:** WelcomeScreen.tsx, HomeView.tsx, and ChatView.tsx are the designed screens — match their patterns, spacing, and component usage when building new screens.

## Development Guidelines

- When creating database migrations, follow the schema in `docs/pullup-data-schema.md` exactly (table names, column types, enums, RLS policies, indexes, triggers)
- All tables require RLS policies scoped to the authenticated user's Firebase UID
- Use Supabase client libraries for database access; never bypass RLS
- Edge Functions handle background jobs: trip detection, follow-ups, response monitoring, calendar sync, CRM sync, cutoff enforcement
- OAuth tokens and API keys must be stored encrypted in Supabase Vault, never in plaintext columns
- The PRD (`docs/pullup-prd.md`) is the source of truth for feature behavior and business rules
- The backlog (`docs/pullup-backlog.md`) defines issue breakdown and acceptance criteria per epic
