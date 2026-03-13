# Pull-Up — Phase 1 Product Backlog

**Version:** 1.0  
**Last Updated:** March 13, 2026  
**Source:** PRD v1.1, Data Schema v1.1

---

## Backlog Structure

This backlog is organized into **Epics** (major workstreams) containing **Issues** (individually shippable units of work). Issues are tagged with:

- **Type:** `setup`, `backend`, `frontend`, `agent`, `integration`, `design`
- **Size:** `S` (< 1 day), `M` (1–3 days), `L` (3–5 days), `XL` (5+ days)
- **Dependencies:** Other issues that must be completed first

Epics are ordered by build sequence — later epics depend on earlier ones. Within each epic, issues are ordered by recommended implementation sequence.

---

## Epic 0: Project Scaffolding & Infrastructure

*Set up the foundational stack: Vercel project, Supabase instance, Firebase project, and the CI/CD pipeline. Nothing user-facing — this is the skeleton everything else builds on.*

| # | Issue | Type | Size | Dependencies | Description |
|---|---|---|---|---|---|
| 0.1 | Initialize Next.js project with App Router on Vercel | setup | S | — | Create repo, configure Vercel project, deploy hello-world. Confirm serverless and edge function runtimes work. |
| 0.2 | Provision Supabase project | setup | S | — | Create Supabase project, enable RLS globally, configure connection pooling (Supavisor), note connection strings for Vercel env vars. |
| 0.3 | Provision Firebase project | setup | S | — | Create Firebase project, enable Authentication with Google OAuth provider. Generate service account key for server-side token verification. |
| 0.4 | Configure environment variables | setup | S | 0.1, 0.2, 0.3 | Set all secrets in Vercel: Supabase URL + service role key, Firebase service account, Anthropic API key, Google Maps API key. Server-side only — nothing exposed to client bundle. |
| 0.5 | Build Firebase ↔ Supabase auth bridge | backend | M | 0.2, 0.3, 0.4 | Implement Vercel edge middleware that verifies Firebase ID token on every `/api/*` request. Extract `uid`, set `x-firebase-uid` header for Supabase. Implement custom `auth.uid()` SQL function in Supabase that reads this header. |
| 0.6 | Create base database migration framework | setup | S | 0.2 | Set up Supabase CLI locally. Configure migration directory structure. Create initial migration with `updated_at` trigger function (reused on every table). |
| 0.7 | Create Supabase Storage buckets | setup | S | 0.2 | Create `tone-samples` and `crm-schema-docs` buckets with private access policies. |
| 0.8 | CI/CD pipeline | setup | M | 0.1 | GitHub Actions (or Vercel Git integration): lint, type-check, test on PR. Auto-deploy `main` to production. Preview deployments for branches. |

---

## Epic 1: Database Schema & Core Data Layer

*Run all migrations to create tables, enums, indexes, RLS policies, and seed data. No UI — just the data layer.*

| # | Issue | Type | Size | Dependencies | Description |
|---|---|---|---|---|---|
| 1.1 | Create all PostgreSQL enum types | backend | S | 0.6 | Migration: create all enums from schema doc §17 — `user_role_type`, `gender`, `notification_channel`, `crm_source_type`, `outreach_channel`, `outreach_thread_status`, `meeting_type`, `meeting_status`, `venue_type`, `trip_status`, `availability_restriction`, `instruction_scope`, `conversation_status`, `conversation_role`, etc. |
| 1.2 | Create `users` table + RLS | backend | S | 1.1 | Migration: `users` table per schema §2.1 with `id` as Firebase uid. RLS policy: `id = auth.uid()`. |
| 1.3 | Create `user_safety_settings` table + RLS + seed trigger | backend | S | 1.2 | Migration: table per schema §2.2. RLS via `user_id`. Create `on_new_user` trigger that seeds default safety rows on user insert. |
| 1.4 | Create `calendars` + `calendar_contact_type_mappings` tables + RLS | backend | S | 1.2 | Migration: both tables per schema §3. RLS direct on `calendars`, join-through on mappings. Enforce max 5 calendars per user via check constraint or application logic. Unique constraint on `(user_id, priority_rank)`. |
| 1.5 | Create `crm_sources` table + RLS | backend | M | 1.2 | Migration: table per schema §4. RLS via `user_id`. Vault secret ID references for HubSpot and MCP auth — no plaintext credentials in this table. |
| 1.6 | Create `contact_types` + `contact_type_example_emails` tables + RLS | backend | S | 1.2 | Migration: tables per schema §5. Unique constraint on `(user_id, slug)`. RLS via `user_id` and join-through. |
| 1.7 | Create `contacts` table + RLS | backend | M | 1.5, 1.6 | Migration: table per schema §6. Unique constraint on `(user_id, crm_source_id, crm_external_id)` where `crm_source_id IS NOT NULL`. Index on `(user_id, city)` for trip-based filtering. RLS via `user_id`. |
| 1.8 | Create `tone_profiles` table + RLS | backend | S | 1.2 | Migration: table per schema §7. One-to-one with users. RLS via `user_id`. |
| 1.9 | Create `instruction_sets` table + RLS + `get_instruction()` function | backend | M | 1.2 | Migration: table per schema §8. RLS: `user_id = auth.uid() OR scope = 'system'`. Create `get_instruction()` DB function per schema §18.7. Seed system-level instructions (lead times, cutoffs, acceptance rate, buffer minutes). |
| 1.10 | Create `venue_preferences` table + RLS | backend | S | 1.2 | Migration: table per schema §9. RLS via `user_id`. |
| 1.11 | Create `trips` + `trip_availability_windows` tables + RLS | backend | M | 1.2, 1.4 | Migration: tables per schema §10. RLS direct on `trips`, join-through on availability windows. Index on `(user_id, status)` and `(user_id, arrival_datetime)`. |
| 1.12 | Create `trip_contacts` table + RLS | backend | M | 1.7, 1.11 | Migration: table per schema §11. Unique on `(trip_id, contact_id)`. Indexes on `(trip_id, priority_score DESC)` and `(trip_id, wave_assignment)`. RLS via trip → user join. |
| 1.13 | Create `outreach_campaigns` + `outreach_waves` tables + RLS | backend | M | 1.11 | Migration: tables per schema §12.1, §12.2. One-to-one campaign per trip. RLS via trip join chain. |
| 1.14 | Create `outreach_threads` + `outreach_messages` tables + RLS | backend | M | 1.12, 1.13 | Migration: tables per schema §12.3, §12.4. Index on `gmail_thread_id` for response monitoring. Index on `next_follow_up_date` for follow-up scheduler. RLS via campaign → trip → user join chain. |
| 1.15 | Create `meetings` table + RLS | backend | M | 1.11, 1.12, 1.14 | Migration: table per schema §13. Index on `(trip_id, date, start_time)` and `(target_calendar_id, date)`. RLS via trip join. |
| 1.16 | Create `venues` + `venue_usage_history` tables + RLS | backend | M | 1.2, 1.15 | Migration: tables per schema §14. Venues are public-read (all users can see venues); writes restricted to service role. Usage history RLS via `user_id`. |
| 1.17 | Create `planning_conversations` + `planning_conversation_messages` tables + RLS | backend | M | 1.11 | Migration: tables per schema §15. Enable Supabase Realtime on `planning_conversation_messages`. RLS via trip → user join chain. |
| 1.18 | Enable Realtime on key tables | backend | S | 1.14, 1.15, 1.11 | Enable Supabase Realtime publications on `outreach_threads`, `meetings`, `trips` (in addition to `planning_conversation_messages` from 1.17). |
| 1.19 | Create database triggers for agentic events | backend | M | 1.13, 1.14, 1.15 | Migration: create triggers — `on_thread_status_change` (outreach_threads), `on_meeting_confirmed` (meetings), `on_meeting_cancelled` (meetings). These invoke Supabase Edge Functions via `pg_net`. |
| 1.20 | Create all performance indexes | backend | S | 1.1–1.17 | Migration: create all indexes listed in schema §16 not already created in individual table migrations. Verify with `EXPLAIN ANALYZE` on critical query patterns. |

---

## Epic 2: Authentication & User Account

*Sign-up / sign-in flow, user creation, and account settings page.*

| # | Issue | Type | Size | Dependencies | Description |
|---|---|---|---|---|---|
| 2.1 | Design auth screens (sign-in, sign-up) | design | M | — | Figma: sign-in page with "Sign in with Google" as primary CTA. Minimal email/password fallback. Post-auth redirect logic (new user → onboarding, returning user → dashboard). |
| 2.2 | Implement Firebase Google OAuth sign-in | frontend | M | 0.3, 0.5 | Client-side Firebase Auth: Google sign-in popup/redirect. Obtain Firebase ID token. Store token in memory (not localStorage). Set up auth state listener. |
| 2.3 | Build user creation API route | backend | M | 0.5, 1.2, 1.3, 1.9 | `POST /api/auth/register` — called after first Firebase sign-in. Creates `users` row with Firebase `uid` as `id`. Triggers default safety settings and system instruction seeds. Stores Google OAuth tokens in Supabase Vault. |
| 2.4 | Build auth state provider and route guards | frontend | M | 2.2 | React context provider for auth state. Redirect unauthenticated users to sign-in. Redirect new users (no `users` row) to onboarding. |
| 2.5 | Build account settings page | frontend | M | 2.4, 1.2 | Page: `/settings`. Edit identity attributes (name, role, gender, home city, timezone), notification preferences, max meetings/day, default availability window. Calls `PATCH /api/users/me`. |
| 2.6 | Build user settings API routes | backend | M | 1.2 | `GET /api/users/me`, `PATCH /api/users/me`. Validates input, updates `users` row. |

---

## Epic 3: Onboarding Flow

*Guided setup experience that collects all user-level configuration: identity, calendars, CRM, contact types, outreach preferences, venue preferences, tone profile, and safety settings.*

| # | Issue | Type | Size | Dependencies | Description |
|---|---|---|---|---|---|
| 3.1 | Design onboarding flow (all steps) | design | L | — | Figma: multi-step onboarding wizard. Steps: (1) Connect Google Calendar(s), (2) Identity & role, (3) Meeting preferences, (4) Connect CRM(s), (5) Contact types & tiers, (6) Outreach preferences, (7) Venue preferences, (8) Tone calibration, (9) Safety defaults review. Progress indicator. Skip-able steps marked. |
| 3.2 | Build onboarding wizard shell | frontend | M | 2.4, 3.1 | Multi-step form container with progress bar, next/back/skip navigation, and state management. Persists partial progress so user can resume. |
| 3.3 | Step 1: Google Calendar connection | frontend | M | 3.2, 1.4 | UI to connect Google Calendars. Shows list of user's calendars from Google API. User selects up to 5, sets priority rank, contact type associations, and availability contribution per calendar. |
| 3.4 | Calendar connection API routes | backend | M | 1.4 | `POST /api/calendars` — connect a calendar. `GET /api/calendars` — list connected calendars. `PATCH /api/calendars/:id` — update priority/settings. `DELETE /api/calendars/:id` — disconnect. Google Calendar API: list user's calendars using stored OAuth token. |
| 3.5 | Step 2: Identity & role | frontend | S | 3.2, 2.5 | Form fields for role type, gender, home city, timezone. Writes to `users` table via existing settings API. |
| 3.6 | Step 3: Meeting preferences | frontend | S | 3.2 | Form for default availability window (start/end times), max meetings per day, buffer minutes. Writes to `users` table. |
| 3.7 | Step 4: CRM connection (HubSpot) | frontend | L | 3.2, 1.5 | HubSpot OAuth flow: redirect user to HubSpot, receive auth code, exchange for tokens, store in Vault. Create `crm_sources` row. Show user what data Pull-Up will access. |
| 3.8 | Step 4: CRM connection (Custom MCP) | frontend | M | 3.2, 1.5 | Form: MCP endpoint URL, optional auth credentials, schema instruction text field (or file upload to `crm-schema-docs` bucket). Create `crm_sources` row with `mcp_custom` type. |
| 3.9 | CRM connection API routes | backend | L | 1.5, 1.7 | `POST /api/crm-sources` — create CRM source (handles both HubSpot and MCP). `GET /api/crm-sources` — list. `DELETE /api/crm-sources/:id` — disconnect. `POST /api/crm-sources/:id/sync` — trigger initial contact import. |
| 3.10 | CRM contact sync engine | backend | XL | 3.9, 1.7 | For HubSpot: use HubSpot API to pull contacts, companies, deals. Map to `contacts` table using pre-built field mapping. For MCP: call MCP endpoint using user-provided schema instructions, parse response, map to `contacts` table using `field_mapping` JSON. Handle dedup via `(user_id, crm_source_id, crm_external_id)` unique constraint. |
| 3.11 | Step 5: Contact types & tiers | frontend | M | 3.2, 1.6 | UI to define contact type categories (investor, client, partner, etc.). For each: set slug, display name, default meeting length, default meeting type, priority tier. Provide starter templates user can customize. |
| 3.12 | Contact types API routes | backend | M | 1.6 | Full CRUD on `contact_types`. `POST /api/contact-types`, `GET`, `PATCH`, `DELETE`. Validate slug uniqueness per user. |
| 3.13 | Step 6: Outreach preferences | frontend | M | 3.11 | Per contact type: set outreach style (personal/EA), outreach approval mode (approve each / approve first / auto-send), scheduling reply approval. UI to flag individual contacts as Howie users and provide Howie email. |
| 3.14 | Step 7: Venue preferences | frontend | M | 3.2, 1.10 | Per meeting type: describe preferred venue traits (free text), name specific venues, describe avoided traits. Optionally scope to a city. |
| 3.15 | Venue preferences API routes | backend | S | 1.10 | CRUD on `venue_preferences`. |
| 3.16 | Step 8: Tone calibration — questionnaire | frontend | M | 3.2, 1.8 | Form: communication style questions (formal vs casual, greeting style, closing style, directness). Results stored in `tone_profiles.questionnaire_responses`. |
| 3.17 | Step 8: Tone calibration — example emails | frontend | M | 3.16, 1.6 | Per contact type: text area to paste 2–3 example outreach emails. Optional subject line and context notes. Stored in `contact_type_example_emails`. Files uploaded to `tone-samples` bucket if needed. |
| 3.18 | Tone profile synthesis | agent | M | 3.16, 3.17 | Backend job: after onboarding step 8 is complete, call Claude API with questionnaire responses + example emails. Generate `synthesized_prompt` — the system prompt used for all future message drafting in this user's voice. Store in `tone_profiles`. |
| 3.19 | Step 9: Safety defaults review | frontend | S | 3.2, 1.3 | Display current safety rules with toggles and editable parameters. User can relax or tighten defaults. Writes to `user_safety_settings`. |
| 3.20 | Safety settings API routes | backend | S | 1.3 | CRUD on `user_safety_settings`. |
| 3.21 | Onboarding completion handler | backend | S | 3.2 | `POST /api/onboarding/complete` — sets `users.onboarding_completed = true`. Triggers initial CRM sync if CRM is connected. Redirects user to dashboard. |

---

## Epic 4: Dashboard & Trip Management UI

*The main app interface: trip list, trip detail, meeting schedule view, and outreach status.*

| # | Issue | Type | Size | Dependencies | Description |
|---|---|---|---|---|---|
| 4.1 | Design dashboard and trip views | design | L | — | Figma: dashboard (trip list with status badges, upcoming meetings), trip detail (schedule timeline, outreach progress, contact list), meeting detail card. Mobile-responsive. |
| 4.2 | Build dashboard page | frontend | M | 2.4, 4.1 | Page: `/dashboard`. Lists trips by status (upcoming, active, past). Shows next upcoming meeting. Quick stats: meetings confirmed, outreach pending. |
| 4.3 | Build trip list API route | backend | S | 1.11 | `GET /api/trips` — returns user's trips with status, dates, destination, meeting count. Paginated. Filtered by status. |
| 4.4 | Build trip detail page | frontend | L | 4.1, 4.3 | Page: `/trips/:id`. Sections: trip header (dates, destination, hotel, goal), daily schedule (meetings on timeline), outreach status (wave progress, response counts), contact list (grouped by tier with status badges). |
| 4.5 | Build trip detail API routes | backend | M | 1.11, 1.12, 1.13, 1.15 | `GET /api/trips/:id` — full trip detail with nested trip contacts, outreach campaign summary, meetings. `GET /api/trips/:id/contacts` — paginated trip contacts with outreach status. `GET /api/trips/:id/meetings` — meetings for this trip. |
| 4.6 | Build meeting detail view | frontend | M | 4.4 | Expandable card or modal: meeting time, venue (with map), contact info, relationship context, outreach thread history, status. Link to calendar event. |
| 4.7 | Build outreach thread view | frontend | M | 4.4 | View all messages in an outreach thread (initial, follow-ups, responses, scheduling replies). Show status progression. For pending-approval messages, show approve/edit/reject actions. |
| 4.8 | Outreach message approval API routes | backend | M | 1.14 | `POST /api/outreach-messages/:id/approve` — marks message as approved, triggers send. `POST /api/outreach-messages/:id/edit` — update body, re-queue for approval or send. `POST /api/outreach-messages/:id/reject` — cancel this message. |
| 4.9 | Wire up Realtime subscriptions | frontend | M | 1.18 | Subscribe to Supabase Realtime channels for the current trip's `outreach_threads`, `meetings`, `trips`, and `planning_conversation_messages`. Update UI reactively on changes. |
| 4.10 | Build daily trip prep summary view | frontend | S | 4.4 | Read-only view: morning-of summary showing today's meetings in order, venue details, travel times, contact context. Could be a dedicated page or a push notification payload. |

---

## Epic 5: Trip Detection

*Automated monitoring of connected calendars to detect new travel and create trip records.*

| # | Issue | Type | Size | Dependencies | Description |
|---|---|---|---|---|---|
| 5.1 | Build trip detection Edge Function | backend | L | 1.4, 1.11 | Supabase Edge Function: `trip-detection-poll`. For each user with `onboarding_completed = true`, query all calendars where `is_trip_source = true` for events in the next 60 days. Identify travel signals: flight keywords ("flight", airline names, confirmation numbers), hotel keywords ("hotel", "reservation", chain names), events with locations in a different city than `users.home_city`. |
| 5.2 | Trip event parser | backend | M | 5.1 | Extract structured data from detected calendar events: destination city, arrival/departure datetime, hotel name/address. Handle ambiguity (e.g., event says "NYC" — resolve to "New York"). Geocode hotel address for lat/long. |
| 5.3 | Trip dedup logic | backend | S | 5.1 | Before creating a new trip, check for existing trips with overlapping dates and same destination. If a match exists, update rather than duplicate. Handle flight + hotel as two signals for the same trip. |
| 5.4 | Register trip detection cron job | setup | S | 5.1 | Configure pg_cron to invoke `trip-detection-poll` every 30 minutes. |
| 5.5 | Compute outreach cutoff date on trip creation | backend | S | 5.1, 1.9 | When a trip is created, compute `outreach_cutoff_date` using `get_instruction()` for `net_new_outreach_cutoff_days`. Store on the trip record. |
| 5.6 | Manual trip creation API | backend | M | 1.11 | `POST /api/trips` — allow user to manually create a trip (destination, dates, hotel) if auto-detection misses it or they want to plan ahead. |
| 5.7 | Manual trip creation UI | frontend | S | 4.2, 5.6 | Button on dashboard: "Plan a trip." Simple form: destination, dates, hotel (optional). Calls manual creation API. |

---

## Epic 6: Planning Conversation

*The agent-to-user conversation that scopes a trip: availability, goals, contact list, outreach plan approval.*

| # | Issue | Type | Size | Dependencies | Description |
|---|---|---|---|---|---|
| 6.1 | Design planning conversation UI | design | M | — | Figma: chat-style interface embedded in trip detail page. Agent messages with structured content (contact lists as selectable cards, availability as editable time blocks). User text input + quick-action buttons. |
| 6.2 | Build planning conversation UI | frontend | L | 6.1, 4.4, 1.17 | Chat interface component. Renders `planning_conversation_messages` from Supabase. Streams new messages via Realtime subscription. User input sends message to API. Supports rich agent messages (contact cards, time pickers, confirmation buttons). |
| 6.3 | Build planning conversation API route | backend | M | 1.17 | `POST /api/trips/:id/conversation` — receives user message, stores it, invokes planning agent Edge Function, returns agent response. `GET /api/trips/:id/conversation` — load conversation history. |
| 6.4 | Build planning agent Edge Function | agent | XL | 6.3, 1.9, 1.11, 1.12 | Core agent logic. Receives user message + conversation history + trip context. Uses Claude API to generate next response. Implements the conversation flow from PRD §4.2: trip acknowledgment → availability scoping → goal setting → contact seeding → preference confirmation → approval. Parses user responses to update trip-level instructions and availability windows. |
| 6.5 | Planning agent: availability extraction | agent | M | 6.4 | Sub-module of planning agent. Parses user messages like "I'm free Tuesday afternoon and all day Wednesday" into `trip_availability_windows` rows. Handles natural language time expressions. Reads existing calendar events to show user what's already booked. |
| 6.6 | Planning agent: goal extraction | agent | S | 6.4 | Sub-module. Parses user's stated goals ("this trip is about closing LPs") into `trips.goal_summary` and trip-level instruction sets. |
| 6.7 | Planning agent: contact list generation | agent | L | 6.4, 3.10, 1.12 | Sub-module. Queries `contacts` filtered by destination city. Scores and ranks using priority engine (PRD §4.3, schema §11.2). Presents grouped list to user in conversation. Handles user edits (add/remove/reprioritize). Creates `trip_contacts` rows. |
| 6.8 | Planning agent: outreach plan generation | agent | L | 6.7, 1.13 | Sub-module. Computes waterfall capacity (slots ÷ acceptance rate). Assigns contacts to waves. Presents plan summary to user ("Wave 1: 12 contacts, Wave 2: 8 contacts"). On approval: creates `outreach_campaign`, `outreach_waves`, `outreach_threads`. Transitions trip to `outreach_active`. |
| 6.9 | Notification: trip detected → initiate conversation | integration | M | 5.1, 6.4 | When a trip is created (status = `detected`), send notification via user's preferred channel (Slack DM, SMS, or in-app). Include trip summary and prompt to start planning. Transition trip to `planning`. |

---

## Epic 7: Outreach Message Drafting & Sending

*Generate outreach messages using the user's tone profile and send them through the appropriate channel.*

| # | Issue | Type | Size | Dependencies | Description |
|---|---|---|---|---|---|
| 7.1 | Build message drafting engine | agent | L | 1.8, 1.14 | Given a `outreach_thread` (contact, tone profile, contact type, relationship context, trip details), call Claude API to draft an outreach message matching the user's voice. Use `tone_profiles.synthesized_prompt` as system context. Output: subject line + body. Store as `outreach_messages` row with `status = draft`. |
| 7.2 | Build email send service (Gmail) | integration | L | 1.14 | Service that sends emails via Gmail API using the user's OAuth token from Vault. Supports personal sends (from user's email, user's name) and EA sends (from user's email with assistant-style signature). Records `gmail_message_id` and `gmail_thread_id` on send. Handles token refresh. |
| 7.3 | Build Slack send service | integration | M | 1.14 | Service that sends Slack DMs via Slack API. Used for internal contacts. Records `slack_channel_id`. |
| 7.4 | Build SMS send service (Twilio) | integration | M | 1.14 | Service that sends SMS via Twilio API. Records `twilio_message_sid`. |
| 7.5 | Build Howie outreach composer | agent | M | 7.2 | Specialized message drafter for Howie-enabled contacts. Composes structured email to Howie address: user's name, who they want to meet, date range, preferred times, meeting type, venue preferences. Sends via Gmail send service from user's personal email. |
| 7.6 | Build outreach send orchestrator Edge Function | backend | L | 7.1, 7.2, 7.3, 7.4, 7.5, 1.13 | `send-outreach` Edge Function. Triggered when a wave transitions to `sending`. For each thread in the wave: draft message (7.1), route to correct send service based on channel, handle approval gating (queue for review if `outreach_approval = approve_each`, auto-send if `auto_send`). Update thread and message statuses. |
| 7.7 | Build approval queue UI | frontend | M | 4.7, 4.8 | Dedicated view (or section of trip detail): pending outreach drafts awaiting approval. Show draft with contact context. Actions: approve as-is, edit and approve, reject. Bulk approve option for EA messages. |
| 7.8 | Follow-up message drafting | agent | M | 7.1 | Variant of message drafter for follow-ups. Aware of previous messages in thread. Escalates tone appropriately (first follow-up: gentle bump, second: slightly more direct, third: final attempt). Respects `contact_types.max_follow_ups`. |
| 7.9 | Build follow-up scheduler Edge Function | backend | M | 7.8, 1.14 | `follow-up-sender` Edge Function. Runs daily via pg_cron. Queries threads where `next_follow_up_date <= today` and status is follow-up-eligible. Drafts follow-up, sends or queues for approval. Updates `follow_up_count` and `next_follow_up_date`. |
| 7.10 | Register follow-up cron job | setup | S | 7.9 | Configure pg_cron: daily at 9am UTC. |

---

## Epic 8: Response Monitoring & Scheduling Agent

*Monitor the user's inbox for replies to outreach, classify responses, and autonomously negotiate meeting times.*

| # | Issue | Type | Size | Dependencies | Description |
|---|---|---|---|---|---|
| 8.1 | Build Gmail response monitor Edge Function | integration | L | 1.14, 7.2 | `response-monitor` Edge Function. For each active outreach thread with a `gmail_thread_id`, poll Gmail API for new messages in that thread. Detect new inbound messages not yet recorded in `outreach_messages`. Store new messages as inbound records. |
| 8.2 | Register response monitor cron job | setup | S | 8.1 | Configure pg_cron: every 15 minutes. |
| 8.3 | Build response classifier | agent | M | 8.1 | Given an inbound message, call Claude API to classify: `accepted`, `declined`, `counter_proposed`, `delegated`, `ambiguous`. Extract structured data: proposed times (if counter), delegate contact info (if delegated). Update `outreach_threads.status`. |
| 8.4 | Build scheduling agent Edge Function | agent | XL | 8.3, 1.15, 1.11, 7.2 | `scheduling-agent` Edge Function. Triggered after response classification. For accepted/counter-proposed: check user's availability across all calendars, compute travel time from adjacent meetings, propose or confirm time slots. Draft scheduling reply. For personal threads: queue for approval (unless `scheduling_reply_approval = auto_send`). For EA threads: auto-send. Handle multi-turn negotiation (max N back-and-forth before escalating to user). |
| 8.5 | Scheduling agent: availability calculator | backend | M | 8.4, 1.4, 1.15 | Sub-module. Given a trip, date range, and meeting duration: query all connected calendars for busy times, query existing confirmed/proposed meetings, compute available slots accounting for travel time buffers. Return ranked list of open slots. |
| 8.6 | Scheduling agent: venue selection | agent | L | 8.4, 1.10, 1.16, 1.3 | Sub-module. Given a confirmed time + contact: select venue based on meeting type, user preferences, geographic optimization (proximity to hotel and adjacent meetings), time of day, safety rules. Query Google Maps Places API. Check venue usage history for re-suggestions. Return top 3 recommendations. |
| 8.7 | Google Maps Places API integration | integration | M | — | Service wrapper for Google Maps Places API. Search venues by type and location. Return structured results: name, address, lat/long, rating, price level, hours. Cache results in `venues` table to reduce API calls. |
| 8.8 | Google Maps Directions API integration | integration | M | — | Service wrapper for Google Maps Directions API. Given two locations, return travel time by driving/transit/walking. Used by availability calculator and travel time awareness logic. |
| 8.9 | Scheduling agent: calendar write | integration | M | 8.4, 1.15 | Sub-module. When a meeting is confirmed: create Google Calendar event on the correct calendar (based on contact type → calendar mapping). Set title, location, description with relationship context. Optionally create travel buffer event before the meeting. Store `google_event_id` on meeting record. |
| 8.10 | Scheduling agent: escalation handler | backend | S | 8.4 | When the agent encounters an ambiguous response, a complex counter-proposal it can't resolve, or hits max negotiation turns: notify the user with context and ask for direction. Mark thread as `needs_user_input`. |
| 8.11 | Declined/unresponsive handler | backend | S | 8.3 | When a thread is marked `declined` or `unresponsive`: update `trip_contacts.status`, release the slot back to the waterfall. Trigger wave advancement check. |

---

## Epic 9: Outreach Waterfall Engine

*The wave advancement and over-commitment protection logic that manages outreach pacing.*

| # | Issue | Type | Size | Dependencies | Description |
|---|---|---|---|---|---|
| 9.1 | Build wave advancement Edge Function | backend | L | 1.13, 1.14, 8.11 | `wave-advancement` Edge Function. Triggered by `on_thread_status_change` DB trigger. When a thread reaches a terminal state (accepted, declined, unresponsive): recalculate remaining capacity = `total_slots - filled_slots`. If current wave is exhausted (all threads terminal) and capacity remains, unlock next wave by setting its status to `sending` (which triggers outreach send orchestrator). |
| 9.2 | Build over-commitment protection | backend | M | 9.1, 1.13 | On each acceptance: check if `filled_slots >= total_slots`. If so: pause outreach campaign (`status = paused`), cancel all pending/draft outreach messages, notify user that calendar is full. Provide option to extend availability or stop. |
| 9.3 | Build outreach cutoff enforcer Edge Function | backend | M | 1.13 | `outreach-cutoff-check` Edge Function. Daily cron. For each active campaign where `today >= trips.outreach_cutoff_date`: prevent new wave sends (mark remaining un-sent threads as `cancelled`). Allow follow-ups on already-contacted threads to continue until 2 days before trip. |
| 9.4 | Register outreach cutoff cron job | setup | S | 9.3 | Configure pg_cron: daily at midnight UTC. |
| 9.5 | Build campaign resume handler | backend | S | 9.2 | API route: `POST /api/outreach-campaigns/:id/resume`. Called when user extends availability after calendar-full pause. Recalculates capacity with new slots, re-activates campaign, unlocks next wave if needed. |
| 9.6 | Waterfall status dashboard component | frontend | M | 4.4, 9.1 | Visual component on trip detail page: shows wave progress (Wave 1: 12 sent, 5 accepted, 3 declined, 4 pending. Wave 2: locked/unlocked). Over-commitment protection status. Campaign pause/resume controls. |

---

## Epic 10: Venue Recommendation & Reservation

*Venue discovery, recommendation, and optional reservation booking for confirmed meetings.*

| # | Issue | Type | Size | Dependencies | Description |
|---|---|---|---|---|---|
| 10.1 | Build venue recommendation engine | agent | L | 8.6, 8.7, 1.10, 1.16, 1.3 | Service: given meeting parameters (type, time, contact, user preferences, hotel location, adjacent meetings), return ranked venue recommendations. Combines Google Maps search, user preference matching, safety rule filtering, geographic optimization, and usage history. |
| 10.2 | Build venue recommendation UI | frontend | M | 10.1, 4.6 | Within meeting detail: show top 3 venue recommendations with name, distance, rating, why recommended. User can accept, swap, or enter custom venue. |
| 10.3 | Venue confirmation API | backend | S | 1.15, 1.16 | `POST /api/meetings/:id/venue` — set or change venue for a meeting. Creates `venues` row if new. Creates `venue_usage_history` row. Updates meeting record and Google Calendar event location. |
| 10.4 | Geographic clustering logic | backend | M | 8.8 | Service: given a set of confirmed + proposed meetings for a day, suggest geographic clustering. E.g., "Move your 2pm to a venue near your 12pm since they're both on the Westside." Called during venue recommendation and surfaced in planning conversation. |
| 10.5 | Resy / OpenTable integration (conditional) | integration | L | — | Research free API tiers. If available: build service wrapper for venue enrichment (ambiance, noise, cuisine) and reservation booking. If not free: defer to Phase 2 and document as out of scope. |
| 10.6 | Post-meeting venue rating prompt | frontend | S | 1.16 | After a meeting is completed (based on time passing), prompt user to rate the venue (1–5) and leave optional notes. Store in `venue_usage_history`. Surface in trip prep summary or via notification. |

---

## Epic 11: Calendar Sync & Conflict Management

*Ongoing calendar synchronization and conflict detection for active trips.*

| # | Issue | Type | Size | Dependencies | Description |
|---|---|---|---|---|---|
| 11.1 | Build calendar sync Edge Function | integration | L | 1.4, 1.15 | `calendar-sync` Edge Function. For each user with an active trip: poll all connected calendars for events on trip dates. Detect new events that conflict with proposed/confirmed Pull-Up meetings. Detect cancelled/moved events that free up slots. |
| 11.2 | Register calendar sync cron job | setup | S | 11.1 | Configure pg_cron: every 15 minutes. |
| 11.3 | Conflict detection and notification | backend | M | 11.1 | When a conflict is detected (e.g., user's boss scheduled a team call over a proposed meeting): notify user with details. Suggest resolution: reschedule the Pull-Up meeting, decline the external event, or ask user to decide. |
| 11.4 | Availability recalculation on calendar change | backend | M | 11.1, 8.5 | When calendar sync detects meaningful changes: recalculate `total_available_slots` for the trip. If slots increased, potentially resume paused outreach. If slots decreased, check for over-commitment. |
| 11.5 | Multi-calendar unified availability view | frontend | M | 11.1, 4.4 | Component on trip detail: visual timeline showing events from all connected calendars overlaid, with Pull-Up meetings highlighted. Shows available slots, travel buffers, and blocked time. |

---

## Epic 12: Notification System

*Cross-channel notifications for all system events: trip detection, outreach updates, approvals, and trip prep.*

| # | Issue | Type | Size | Dependencies | Description |
|---|---|---|---|---|---|
| 12.1 | Build notification dispatch service | backend | M | 1.2 | Central service: given a notification type, user, and payload, route to the correct channel (Slack, SMS, in-app) based on `users.notification_channel`. Format message appropriately per channel. |
| 12.2 | Slack notification integration | integration | M | 12.1 | Send Slack DMs via Slack API. Support rich messages (blocks with buttons for approve/reject actions). Handle Slack interactive message callbacks for inline approvals. |
| 12.3 | SMS notification integration (Twilio) | integration | M | 12.1 | Send SMS via Twilio. Keep messages concise. Include deep link to app for actions requiring UI. |
| 12.4 | In-app notification system | frontend | M | 12.1 | Notification bell/inbox in the app header. Stores notifications in a `notifications` table (add to schema). Real-time via Supabase Realtime. Mark as read/unread. |
| 12.5 | Build daily trip prep summary generator | agent | M | 12.1, 1.15 | Morning of each meeting day: compile today's meetings in chronological order with venue details, travel times, contact context (relationship notes, last meeting, deal stage). Send via notification channel. |
| 12.6 | Register trip prep cron job | setup | S | 12.5 | Configure pg_cron: daily at 7am in user's local timezone (requires timezone-aware scheduling). |

---

## Epic 13: CRM Ongoing Sync

*Periodic refresh of contact data from connected CRMs to keep Pull-Up current.*

| # | Issue | Type | Size | Dependencies | Description |
|---|---|---|---|---|---|
| 13.1 | Build CRM sync Edge Function | integration | L | 3.10, 1.7 | `crm-contact-sync` Edge Function. For each active `crm_sources` row: pull latest contacts from source. Upsert into `contacts` table (dedup on external ID). Detect deleted/archived contacts. Update `last_synced_at`. Handle errors gracefully (mark source as `error` if unreachable). |
| 13.2 | Register CRM sync cron job | setup | S | 13.1 | Configure pg_cron: every 6 hours. |
| 13.3 | CRM sync status UI | frontend | S | 3.7, 3.8 | In settings or onboarding: show sync status per CRM source (last synced, contact count, error state). Manual "Sync now" button. |
| 13.4 | New contact detection for active trips | backend | M | 13.1, 1.12 | After a CRM sync, check if any new contacts are in a city that matches an active trip's destination. If so, flag them for potential inclusion and notify the user: "New contact [Name] detected in [City] — want to add them to your trip plan?" |

---

## Epic 14: Settings Management (Post-Onboarding)

*Allow users to edit all configuration at any time outside the onboarding flow.*

| # | Issue | Type | Size | Dependencies | Description |
|---|---|---|---|---|---|
| 14.1 | Design settings pages | design | M | — | Figma: settings organized into tabs — Account, Calendars, CRMs, Contact Types, Outreach, Venues, Tone, Safety. Each mirrors the onboarding step but in an edit-in-place format. |
| 14.2 | Build settings page shell | frontend | M | 14.1, 2.5 | Page: `/settings` with tabbed navigation. Reuse form components from onboarding steps. |
| 14.3 | Calendar management settings | frontend | S | 14.2, 3.3, 3.4 | Tab: manage connected calendars. Add/remove, reorder priority, change contact type mappings. |
| 14.4 | CRM management settings | frontend | S | 14.2, 3.7, 3.8, 13.3 | Tab: manage CRM sources. View sync status, reconnect, update schema instructions, trigger manual sync. |
| 14.5 | Contact type settings | frontend | S | 14.2, 3.11, 3.12 | Tab: edit contact types. Add new, modify existing, reorder priority tiers, update meeting length defaults. |
| 14.6 | Outreach preference settings | frontend | S | 14.2, 3.13 | Tab: edit outreach style and approval settings per contact type. |
| 14.7 | Venue preference settings | frontend | S | 14.2, 3.14 | Tab: edit venue preferences per meeting type. Add city-specific overrides. |
| 14.8 | Tone profile settings | frontend | M | 14.2, 3.16, 3.17 | Tab: re-take questionnaire, add/replace example emails, view synthesized prompt. Button to regenerate tone profile. |
| 14.9 | Safety settings | frontend | S | 14.2, 3.19 | Tab: toggle and configure safety rules. |

---

## Epic 15: Testing, QA & Hardening

*End-to-end testing, error handling, monitoring, and production readiness.*

| # | Issue | Type | Size | Dependencies | Description |
|---|---|---|---|---|---|
| 15.1 | Unit tests: database functions and triggers | backend | L | Epic 1 | Test all RLS policies (user A cannot see user B's data). Test `get_instruction()` resolution. Test trigger behaviors (safety seed, timestamp updates, agentic event triggers). |
| 15.2 | Unit tests: CRM sync engine | backend | M | 3.10 | Test HubSpot and MCP sync paths. Test dedup, field mapping, error handling for unreachable sources. |
| 15.3 | Unit tests: waterfall capacity math | backend | M | 9.1 | Test wave sizing at various acceptance rates. Test wave advancement under different response patterns. Test over-commitment protection edge cases. |
| 15.4 | Integration tests: outreach send flow | backend | L | Epic 7 | End-to-end: draft → approve → send → record. Test all channels (Gmail, Slack, Twilio, Howie). Test approval gating logic per contact type. |
| 15.5 | Integration tests: scheduling agent | backend | L | Epic 8 | End-to-end: inbound reply → classify → check availability → propose time → confirm → write to calendar. Test multi-turn negotiation. Test escalation. |
| 15.6 | Integration tests: trip detection → planning → outreach → meeting | backend | XL | Epics 5–9 | Full lifecycle test with mock calendar events, CRM data, and email responses. Verify state transitions across all entities. |
| 15.7 | Error handling and retry logic for Edge Functions | backend | L | All Edge Functions | Add exponential backoff retry for transient failures (API rate limits, network errors). Dead letter queue for permanently failed jobs. Alert on repeated failures. |
| 15.8 | Logging and observability | backend | M | All | Structured logging from all Edge Functions and API routes. Log to Supabase (or external service). Key metrics: Edge Function execution time, API call counts, error rates, outreach send success rate. |
| 15.9 | Rate limiting | backend | M | All API routes | Rate limit all public-facing API routes. Rate limit outreach sends to avoid Gmail/Slack/Twilio throttling. Implement backpressure in Edge Functions. |
| 15.10 | Security audit | backend | L | All | Review: RLS policies cover all tables, no data leaks across users. Vault secrets are never logged or exposed. Firebase tokens validated on every request. OAuth tokens refreshed properly. MCP endpoints called with appropriate auth. |
| 15.11 | Mobile responsive QA | frontend | M | Epics 4, 6 | Test all pages on mobile viewports. Planning conversation must work well on phone (primary use case: user is traveling). |

---

## Dependency Graph (Epic Level)

```
Epic 0: Scaffolding
  └── Epic 1: Database Schema
        ├── Epic 2: Auth & Account
        │     └── Epic 3: Onboarding
        │           ├── Epic 5: Trip Detection
        │           │     └── Epic 6: Planning Conversation
        │           │           └── Epic 7: Outreach Drafting & Sending
        │           │                 └── Epic 8: Response Monitoring & Scheduling Agent
        │           │                       └── Epic 9: Waterfall Engine
        │           ├── Epic 10: Venue Recommendation
        │           ├── Epic 11: Calendar Sync
        │           ├── Epic 12: Notifications
        │           └── Epic 13: CRM Sync
        └── Epic 4: Dashboard & Trip UI (can begin after schema, parallel with onboarding)

Epic 14: Settings (after onboarding components exist)
Epic 15: Testing (ongoing, gated by feature completion)
```

---

## Issue Count Summary

| Epic | Issues | Estimated Size |
|---|---|---|
| 0: Scaffolding | 8 | ~1.5 weeks |
| 1: Database Schema | 20 | ~2 weeks |
| 2: Auth & Account | 6 | ~1 week |
| 3: Onboarding | 21 | ~3–4 weeks |
| 4: Dashboard & Trip UI | 10 | ~2 weeks |
| 5: Trip Detection | 7 | ~1.5 weeks |
| 6: Planning Conversation | 9 | ~3 weeks |
| 7: Outreach Drafting & Sending | 10 | ~3 weeks |
| 8: Response Monitoring & Scheduling Agent | 11 | ~3–4 weeks |
| 9: Waterfall Engine | 6 | ~2 weeks |
| 10: Venue Recommendation | 6 | ~2 weeks |
| 11: Calendar Sync | 5 | ~1.5 weeks |
| 12: Notifications | 6 | ~1.5 weeks |
| 13: CRM Sync | 4 | ~1 week |
| 14: Settings | 9 | ~1.5 weeks |
| 15: Testing & Hardening | 11 | ~3 weeks |
| **Total** | **149** | **~30–34 weeks (1 engineer)** |
