# Pull-Up — Phase 1 Product Requirements Document

**Version:** 1.1  
**Last Updated:** March 13, 2026  
**Status:** Draft

---

## 1. Overview

### 1.1 Product Summary

Pull-Up is an agentic scheduling assistant for business travelers. It monitors a user's calendar for upcoming travel, proactively initiates a planning conversation, and then executes a prioritized outreach campaign to fill the trip with the highest-value meetings possible — all while respecting the user's time constraints, relationship context, comfort preferences, and communication style.

### 1.2 Core Value Proposition

Business travelers waste significant time manually coordinating meetings around trips. The process of identifying who to meet, ranking them by priority, doing outreach, following up, negotiating times, selecting venues, and managing logistics is repetitive, time-sensitive, and high-stakes. Pull-Up compresses this entire workflow into a supervised agentic loop: the system does the work, the user stays in control of decisions that matter.

### 1.3 Phase 1 Scope

Phase 1 delivers the end-to-end flow for a single user traveling to a single destination. It covers trip detection, conversational planning, contact prioritization, outreach waterfall execution, venue recommendation, and calendar placement. It does not cover multi-leg trip optimization, team coordination, or expense management.

---

## 2. User Profile

### 2.1 Target User

Executives, founders, investors, and senior salespeople who travel regularly for business and maintain large networks across multiple cities. They typically have a CRM (or multiple), a full calendar, and either a human EA or a service like Howie.com assisting with scheduling.

### 2.2 User Identity Attributes

These are captured during onboarding and stored as user-level configuration. They influence venue selection, meeting time suggestions, and safety-aware defaults.

- **Role type:** Salesperson, Investor, Founder, Executive, BD, Other (custom)
- **Gender:** Used for comfort-aware scheduling defaults (see §7.1). These defaults are on by default but user-configurable — users can relax or tighten them.
- **Typical meeting lengths by contact type:** e.g., "60-min coffees with investors, 30-min meetings with clients, 45-min lunches with partners"
- **Max meetings per day:** Hard cap on how many meetings the system will attempt to fill
- **Preferred outreach style by contact type:** Personal (from user's own email) vs. EA (from the system or delegated assistant)
- **Connected CRMs and data sources:** Venture fund CRM, sales CRM, personal contacts

---

## 3. Instruction Hierarchy

Pull-Up operates on a three-tier instruction model. Lower tiers inherit from higher tiers and can override them. Conflicts resolve in favor of the most specific tier.

### 3.1 System-Level Instructions

Set by the Pull-Up platform. These are global defaults and guardrails that apply to every user and every trip.

- Minimum lead time for triggering a trip plan: **3 days before departure**
- Recommended planning start: **2–3 weeks before departure**
- Net-new outreach cutoff: **5 days before departure** (no first-touch messages sent after this point; follow-ups to already-contacted people may continue)
- Minimum buffer between meetings: determined by travel time calculation (never zero)
- Maximum follow-ups per contact per trip: **3**
- Default outreach acceptance rate assumption: **50%** (used in waterfall capacity math; see §5.2)

### 3.2 User-Level Instructions

Set by the user during onboarding and editable at any time. These persist across all trips.

- Identity attributes (role, gender, meeting length defaults — see §2.2)
- Contact type definitions and priority rankings (e.g., "Tier 1: Active LPs and pipeline deals. Tier 2: Warm intros and dormant relationships. Tier 3: Cold but strategic.")
- Venue preferences by meeting type (e.g., "Coffee: upscale café, quiet. Lunch: sit-down restaurant, business-appropriate. Drinks: hotel bar or known cocktail spot.")
- Outreach channel preferences by contact type (personal email, EA-routed, Slack DM, SMS via Twilio)
- Approval requirements: which outreach types require user review before sending vs. auto-send
- Default daily availability windows (e.g., "I generally take meetings 10am–6pm")
- Personal time rules (e.g., "mornings before 9am are personal unless the contact is internal/company")
- Max meetings per day
- **Calendar priority and segmentation:** For users with multiple Google Calendars (up to 5), the user defines which calendar is primary, the priority order across calendars, and the types of contacts/meetings associated with each calendar (e.g., "Work calendar is for client meetings, Personal calendar is for investor coffees, Fund calendar is for LP meetings"). The system reads availability across all connected calendars and writes new meetings to the appropriate calendar based on contact type.
- **Comfort and safety preferences:** Defaults are safe-by-default (see §7.1) but fully user-configurable. Users can relax or tighten any safety heuristic.

### 3.3 Trip-Level Instructions

Set per trip during the planning conversation. These override user-level defaults for the duration of a specific trip.

- **Goals:** e.g., "This trip is focused on closing Series B LPs" or "Priority is client retention, not new sales"
- **Availability overrides:** specific windows the user wants open or blocked for this trip
- **Contact inclusions/exclusions:** "I definitely want to see Disney" or "Skip anyone from Acme Corp this trip"
- **Meeting count targets:** "I want 4 meetings max on Tuesday, but Wednesday is wide open"
- **Location constraints:** "I'm staying at the Pendry in WeHo — keep meetings on the Westside if possible"

---

## 4. Core Agentic Flow

### 4.1 Trip Detection (Trigger)

The system monitors connected Google Calendar(s) — up to 5 per user — for new events that indicate travel. Trigger signals include:

- A flight booking (airline confirmation, Google Flights event)
- A hotel reservation
- A calendar event with a location in a different city than the user's home base

When a trigger fires, the system extracts: **destination city, arrival date/time, departure date/time, and hotel location** (if available).

### 4.2 Planning Conversation (Agent → User)

The agent initiates an asynchronous conversation (via Slack, SMS, or in-app chat — user's configured preference). This conversation is structured but adaptive. The agent's goal is to collect enough context to build a prioritized outreach plan.

**Conversation flow (representative, not rigid):**

1. **Trip acknowledgment:** "I see you're headed to Los Angeles, arriving March 20 and departing March 23. Want me to set up some meetings for you?"
2. **Availability scoping:** "You're there for three nights. Which time blocks are open for meetings? Any time you want to protect?"
3. **Goal setting:** "What's the priority for this trip — new business, fundraising, existing client check-ins, or a mix?"
4. **Contact seeding:** "Based on your CRM, here are the people I'd recommend meeting, ranked by priority. Want to adjust this list?"
   - The system pulls contacts from connected CRMs filtered by: city match (lives/works in destination), relationship tier, recency of last interaction, relevance to stated trip goals
   - Presents them grouped by priority tier with a brief rationale for each
5. **Preference confirmation:** "For outreach — should messages to Tier 1 contacts come from you personally, or is it okay if I handle it as your EA?"
6. **Approval:** "Here's the outreach plan: X people in the first wave, Y in the second. I'll start reaching out today. Sound good?"

The user can respond at their own pace. The agent proceeds only after explicit approval of the outreach plan.

### 4.3 Contact Prioritization Engine

Contacts are scored and ranked using a weighted model informed by user-level and trip-level instructions.

**Input signals:**

- CRM relationship tier / contact type tag
- Trip goal alignment (does this contact map to the stated trip objective?)
- Recency of last meeting (longer gap = higher priority for relationship maintenance)
- Deal stage (for sales CRM: active pipeline > closed-won > dormant)
- Fund relevance (for venture CRM: committed LP > prospective LP > passed)
- User-specified inclusions ("I want to see Disney")
- Geographic proximity to user's hotel / primary meeting zone

**Output:** An ordered list of contacts, grouped by priority tier, with a recommended outreach wave assignment (see §5).

**Contact outreach type** is a per-contact attribute:

- **Personal:** Outreach comes from the user's own email. The system drafts the message; the user reviews and sends (or approves auto-send if configured).
- **EA:** Outreach comes from the system acting as the user's assistant. Can be auto-sent without user approval unless the user has set otherwise.

### 4.4 Meeting Length Defaults

Meeting duration is determined by contact type, as defined in user-level instructions:

- Investor coffee: 60 min
- Client check-in: 30 min
- Partner lunch: 90 min
- (Custom definitions supported)

These defaults can be overridden per contact during the planning conversation or per trip in trip-level instructions.

---

## 5. Outreach Waterfall

The waterfall is the core scheduling mechanism. Its job is to maximize calendar fill rate while minimizing the risk of over-commitment (reaching out to too many people and having to decline accepted meetings).

### 5.1 Waterfall Design Principles

- **Outreach is staged in waves**, not sent all at once
- **Higher-priority contacts are reached first** and given more follow-up attempts
- **The system calculates outreach capacity** based on: available meeting slots, expected response rate, time until trip, and follow-up cadence
- **Net-new outreach stops 5 days before departure.** Follow-ups to already-contacted people can continue up to 2 days before.

### 5.2 Capacity Calculation

Before the first wave, the system computes:

- **Total available meeting slots (S):** Based on availability windows across all connected calendars, meeting length defaults, and travel time buffers
- **Days until outreach cutoff (D):** Trip date minus 5 days
- **Follow-up cadence:** 1 follow-up every 2–3 days, max 3 follow-ups per contact
- **Expected acceptance rate (A):** Default 50%. This is a static default for Phase 1. In future phases, the system will learn per-user and per-contact-type acceptance rates from historical data.
- **Wave 1 size:** `S / A` — enough outreach to theoretically fill all slots if the acceptance rate holds, but no more
- **Wave 2 unlocks** when: Wave 1 follow-ups are complete OR enough declines/non-responses come in that remaining capacity is clear
- **Wave 3+ (if needed):** Same logic, recalculated against remaining open slots

### 5.3 Follow-Up Logic

- Tier 1 contacts receive up to **3 follow-ups** (spaced 2–3 days apart)
- Tier 2 contacts receive up to **2 follow-ups**
- Tier 3 contacts receive **1 follow-up**
- If a contact hasn't responded after all follow-ups and the outreach window is still open, they are marked "unresponsive" for this trip (no further contact)

### 5.4 Over-Commitment Protection

If acceptances exceed available slots:

1. The system immediately pauses all pending outreach
2. It notifies the user: "You've filled your calendar — I've paused outreach. Want to extend availability or stop here?"
3. If new slots open (cancellations, availability changes), outreach can resume

---

## 6. Outreach Execution

### 6.1 Channels

Outreach is executed through the following channels, selected per contact based on user preferences and available integrations:

| Channel | Integration | Use Case |
|---|---|---|
| Email (personal) | Gmail MCP | Tier 1 contacts, personal relationships. User reviews draft before send (unless auto-send is enabled). |
| Email (EA) | Gmail MCP or dedicated outreach address | Tier 2/3 contacts, transactional scheduling. System sends on behalf of user's assistant persona. |
| Howie.com | Via user's personal email to Howie (see §6.4) | If the contact uses Howie, the system emails Howie with scheduling instructions on the user's behalf. |
| Slack | Slack MCP | Internal/company contacts. Agent sends a DM or posts in a shared channel. |
| SMS | Twilio MCP | Quick pings, confirmations, or contacts who prefer text. |

### 6.2 Message Generation

The system generates outreach messages tailored to:

- **Relationship context:** pulled from CRM notes, last interaction date, deal stage
- **Trip framing:** "I'll be in LA the week of March 20th"
- **Ask calibration:** casual for warm relationships ("Would love to grab coffee if you have time"), structured for professional contacts ("I'd like to set up 30 minutes to review our Q1 progress")
- **Sender voice:** Personal messages match the user's tone (see §6.3). EA messages are professional and concise.

All messages flagged as "personal" outreach type are queued for user review unless the user has enabled auto-send for that contact type.

### 6.3 Tone Calibration

During onboarding, the system captures the user's voice through two mechanisms:

1. **Questionnaire:** The user answers questions about their communication style — formal vs. casual, direct vs. warm, how they typically open and close messages, whether they use first names immediately, etc.
2. **Example emails:** The user provides 2–3 sample outreach emails per contact type (e.g., one to an investor, one to a client, one to a friend/colleague). The system extracts tone markers, phrasing patterns, greeting/closing style, and level of formality from these samples.

The system uses this profile to generate drafts that sound like the user. Over time, user edits to drafts serve as implicit feedback to further refine the voice model.

### 6.4 Howie.com Integration

Howie.com is an AI executive assistant service used by some contacts. There is no public API. Integration works as follows:

1. During CRM import or manual contact setup, the user can flag a contact as "Uses Howie" and provide the contact's Howie email address (typically `firstname@howie.com` or similar).
2. When the system needs to schedule with a Howie-enabled contact, it composes an email **from the user's personal email** (via Gmail MCP) addressed to the contact's Howie address.
3. The email contains structured scheduling instructions: who the user wants to meet, the date range, preferred times, meeting type, and venue preferences.
4. Howie processes the request and coordinates with the contact. Replies from Howie route back to the user's inbox and are processed by the Pull-Up response agent (see §6.5).

This approach requires no partnership or API access — it uses Howie the same way a human EA would.

### 6.5 Response Handling & Scheduling Agent

All replies to outreach — whether from the contact directly, their assistant, or their Howie instance — route back through the user's inbox (Gmail MCP).

**Pull-Up Scheduling Agent:** A dedicated agent monitors the user's inbox for replies to outreach threads. When a response is detected, the agent:

1. **Classifies the response:** Accepted, declined, counter-proposed, delegated to assistant, or ambiguous.
2. **For accepted / counter-proposed:** The agent checks the user's availability across all connected calendars and either confirms the proposed time or offers alternatives. It handles the back-and-forth negotiation of finding a mutually workable slot.
3. **For delegated responses:** If a contact's assistant or Howie replies, the agent continues the scheduling thread seamlessly, treating the assistant as the point of contact.
4. **For declined:** The contact is marked unavailable and the slot is released back to the waterfall.
5. **For ambiguous replies:** The agent escalates to the user for guidance rather than guessing.

**Approval behavior:** By default, the scheduling agent operates autonomously for EA-type outreach threads. For personal outreach threads, the agent drafts responses and queues them for user review — unless the user has configured auto-send for scheduling replies (distinct from initial outreach auto-send).

**Calendar writes:** When a meeting is confirmed, the agent writes the event to the appropriate Google Calendar based on the contact type → calendar mapping defined in user-level instructions.

---

## 7. Venue Selection & Calendar Placement

### 7.1 Venue Recommendation

When a meeting is confirmed, the system recommends a venue based on:

- **Meeting type:** Coffee, lunch, drinks, office visit (mapped from contact type and meeting length)
- **User venue preferences:** Stored in user-level instructions (e.g., "For investor coffees, I like Alfred Coffee or Verve")
- **Geographic optimization:** Venue should be convenient relative to the user's hotel and adjacent meetings
- **Time of day:** Morning → coffee. Midday → lunch. Afternoon → coffee or office. Evening → drinks or dinner.
- **Comfort and safety preferences (safe by default, user-configurable):**
  - By default, the system avoids scheduling evening drinks/bar meetings between users and contacts of a different gender. Users can turn this off.
  - By default, evening meetings (after 6pm) default to well-lit, public, professional venues (hotel lobbies, known restaurants). Users can relax this.
  - By default, the system avoids isolated or unfamiliar venue types for first-time meetings with new contacts. Users can adjust.
  - Users can add custom rules (e.g., "No meetings south of the 10 freeway" or "Only hotel lobby for first meetings").
- **Previous venues used with this contact:** If the user has met this person before at a specific spot, the system can suggest it again or offer variety.

### 7.2 Venue Data Sources

The system uses multiple data sources for venue discovery and information:

- **Google Maps Places API:** Primary source for venue search, location data, hours, ratings, and photos. Accessed via MCP.
- **Resy / OpenTable (if free tier available):** Used for enriched venue data (cuisine type, ambiance, noise level, dress code) and, where possible, reservation booking. If these APIs offer a free tier with sufficient data access, they are integrated in Phase 1. If not, they are deferred to Phase 2 and the system relies on Google Maps data alone.
- **User history:** Venues the user has previously used are tracked and available for re-suggestion.

### 7.3 Travel Time Awareness

The system calculates estimated travel time between consecutive meetings using Google Maps Directions API. Constraints:

- Minimum buffer between meetings: **travel time + 15 minutes**
- If two meetings cannot fit sequentially due to geography, the system either proposes a venue change, a time shift, or flags the conflict to the user
- The system clusters meetings geographically when possible (e.g., "All your Westside meetings on Tuesday, DTLA on Wednesday")

### 7.4 Calendar Placement

Confirmed meetings are placed on the appropriate Google Calendar (based on contact type → calendar mapping) with:

- Title: Contact name + meeting type (e.g., "Coffee — Sarah Chen")
- Location: Venue name and address
- Description: Brief context (relationship summary, last meeting date, agenda if available)
- Travel time: Shown as a separate "travel" block before the meeting (optional, user-configurable)
- Reminders: Per user preference

---

## 8. Technical Stack & Infrastructure

### 8.1 Deployment & Hosting

| Layer | Technology | Notes |
|---|---|---|
| **Hosting / Deployment** | Vercel | All frontend and API routes deployed as a Vercel project. Serverless functions for API endpoints. Edge functions for latency-sensitive operations (e.g., webhook receivers). |
| **Framework** | Next.js (App Router) | Server components for dashboard, client components for interactive planning UI. API routes (`/app/api/`) for all backend logic. |
| **Authentication** | Firebase Auth | Google OAuth (required — users need Google account for Calendar/Gmail), email/password as fallback. Firebase ID tokens verified server-side on every Supabase request via middleware. |
| **Database** | Supabase (PostgreSQL) | All application data. Row-level security (RLS) policies keyed to Firebase `uid` for multi-tenant isolation. |
| **Realtime** | Supabase Realtime | Powers live updates in the planning conversation UI and meeting status changes. Subscriptions scoped to user's trip data. |
| **Background Jobs** | Supabase Edge Functions + pg_cron | Scheduled jobs for: trip detection polling, follow-up scheduling, outreach wave advancement, calendar sync. Supabase Edge Functions for event-driven work triggered by database changes or webhooks. |
| **File Storage** | Supabase Storage | Tone profile sample emails, CRM schema instruction documents, any future file attachments. |
| **Secrets / Environment** | Vercel Environment Variables + Supabase Vault | API keys for Google Maps, Twilio, HubSpot, and MCP endpoints stored in Vercel env vars (server-side only). Supabase Vault for per-user encrypted credentials (OAuth tokens, CRM keys). |
| **AI / LLM** | Anthropic Claude API | Message drafting, tone matching, planning conversation, response classification, contact prioritization reasoning. Called from Vercel serverless functions. |

### 8.2 Authentication Flow

Firebase Auth is the identity layer. Supabase is the data layer. They are connected as follows:

1. User signs in via Firebase Auth (Google OAuth is the primary path since Google Calendar and Gmail integration require a Google account).
2. On first sign-in, a Supabase `users` row is created with `id` set to the Firebase `uid`. This is the foreign key used across all tables.
3. Every API request from the client includes the Firebase ID token in the `Authorization` header.
4. Vercel API routes (or middleware) verify the Firebase token, extract the `uid`, and pass it to Supabase queries.
5. Supabase RLS policies enforce `user_id = auth.uid()` on all tables, using a custom `auth.uid()` function that reads the Firebase `uid` from a request header set by the API layer.
6. Google OAuth tokens (access + refresh) obtained during Firebase sign-in are stored encrypted in Supabase Vault. These tokens are used server-side for Google Calendar and Gmail MCP operations.

### 8.3 Background Job Architecture

Agentic workflows (outreach waterfall, follow-ups, response monitoring) require reliable background execution beyond the scope of a single HTTP request.

| Job | Trigger | Runtime | Frequency |
|---|---|---|---|
| **Trip detection** | pg_cron | Supabase Edge Function | Every 30 minutes. Polls connected calendars for new travel events. |
| **Outreach wave sender** | Database trigger (wave status → `sending`) | Supabase Edge Function | Event-driven. Sends initial outreach for all contacts in a wave. |
| **Follow-up scheduler** | pg_cron | Supabase Edge Function | Daily. Checks `outreach_threads.next_follow_up_date` and sends due follow-ups. |
| **Response monitor** | pg_cron | Supabase Edge Function | Every 15 minutes. Polls Gmail for new replies on tracked `gmail_thread_id`s. Classifies responses and triggers scheduling agent. |
| **Wave advancement** | Database trigger (thread status changes) | Supabase Edge Function | Event-driven. When enough declines/unresponsives accumulate, recalculates capacity and unlocks next wave. |
| **Calendar sync** | pg_cron | Supabase Edge Function | Every 15 minutes. Syncs availability across all connected calendars. Detects new events that might conflict with proposed meetings. |
| **Outreach cutoff enforcer** | pg_cron | Supabase Edge Function | Daily. Checks if any active campaigns have hit their `outreach_cutoff_date` and transitions status to prevent new sends. |

### 8.4 Vercel-Specific Considerations

- **Serverless function timeout:** Vercel Pro plan provides up to 300s function execution. Complex agentic flows (e.g., drafting 10+ outreach messages in a wave) should be broken into individual invocations queued via Supabase Edge Functions, not executed in a single serverless call.
- **Edge middleware:** Used for Firebase token verification on every request. Runs at the edge, adds minimal latency.
- **ISR / Caching:** Dashboard pages (trip list, meeting schedule) can use ISR with short revalidation windows. Planning conversation UI is fully dynamic (no caching).
- **Cron via Vercel:** Vercel supports cron jobs (`vercel.json` cron config) as an alternative to pg_cron for jobs that need to call external APIs directly. Either approach works — use pg_cron for database-centric jobs and Vercel cron for API-centric jobs.

---

## 9. Integration Architecture

### 9.1 CRM Integration Model

Pull-Up supports two CRM integration paths:

**Path A — Native HubSpot Integration:**
A first-party HubSpot integration with pre-built field mappings. The system accesses contacts, companies, deals, and activity history. During setup, the user is shown exactly what data Pull-Up needs access to and grants scoped permissions.

**Path B — Bring Your Own CRM (via MCP):**
Any CRM can be connected by providing an MCP server endpoint and a set of instructions describing the data structure. The user (or their admin) defines:

- How to query contacts by city/location
- Where relationship tier / contact type is stored
- How to access deal stage or pipeline status
- Where last interaction date lives
- Any custom fields relevant to prioritization

Pull-Up provides a template describing the data schema it expects. The MCP server translates the user's CRM data into that schema. This makes the system CRM-agnostic — Salesforce, Affinity, Attio, Copper, a custom Airtable, or anything else with an MCP adapter works.

**Required data fields (minimum for Pull-Up to function):**

- Contact name
- Contact email
- Contact city / location
- Contact type / relationship tier (or enough data to infer it)

**Recommended data fields (for richer prioritization):**

- Last interaction date
- Deal stage / pipeline status
- Company name
- Notes / relationship context
- Phone number (for SMS outreach)

### 8.2 Calendar Integration

Users can connect up to **5 Google Calendars**. During setup, the user defines for each calendar:

- **Priority rank:** Which calendar takes precedence when events conflict
- **Contact type association:** Which types of meetings belong on this calendar (e.g., "Work calendar = client meetings, Fund calendar = LP meetings, Personal = everything else")
- **Availability contribution:** Whether events on this calendar should block availability for Pull-Up scheduling (default: yes for all)

The system reads availability across all connected calendars (union of busy times) and writes new meetings to the appropriate calendar based on contact type mapping.

### 8.3 Full Integration Map

| Integration | Protocol | Purpose |
|---|---|---|
| Google Calendar (up to 5) | MCP | Trip detection, availability reading across all calendars, meeting placement to appropriate calendar |
| Gmail | MCP | Personal and EA email outreach, response monitoring, Howie.com communication |
| HubSpot | Native integration | First-party CRM: contacts, deals, activity history |
| Any CRM | MCP (user-provided) | Bring-your-own CRM with user-defined schema mapping |
| Slack | MCP | Internal contact outreach, user notifications, planning conversation |
| Twilio | MCP | SMS outreach and confirmations |
| Google Maps (Places + Directions) | API / MCP | Venue search, travel time calculation |
| Resy / OpenTable | API (if free tier) | Venue enrichment and reservation booking (included if free; deferred if paid) |
| Howie.com | Via Gmail (no API) | Delegated scheduling for contacts who use Howie |

### 8.4 MCP Design Principle

Every external service is integrated as an MCP server with a declared capability description. This allows the agent to reason about which tools to use at each step without hardcoded logic. New integrations (e.g., a new CRM, a new messaging platform) are added by registering a new MCP server — no changes to core agent logic required.

For the Bring Your Own CRM path, the user provides both the MCP endpoint and a natural-language description of their data structure. The agent uses this description to correctly query and interpret CRM data without requiring a standardized schema across all CRMs.

---

## 9. Onboarding Flow

Onboarding captures everything the system needs to operate autonomously. It is completed once and can be updated at any time.

### 9.1 Onboarding Steps

1. **Connect integrations:** Google Calendar(s), Gmail, CRM(s), Slack, Twilio (optional). For each calendar, define priority rank and contact type association.
2. **Identity & role:** Name, role type, gender, home city.
3. **Meeting preferences:** Default meeting lengths per contact type, max meetings per day, preferred daily availability windows, personal time rules.
4. **Contact types & tiers:** Define contact type categories (investor, client, partner, colleague, etc.) and priority tiers within each. Map contact types to CRM fields.
5. **Outreach preferences:** For each contact type, define outreach channel (personal email, EA email, Slack, SMS) and approval requirements (review each draft, approve first then auto-send, full auto-send). Define which contacts use Howie.com.
6. **Venue preferences:** For each meeting type (coffee, lunch, drinks, dinner, office), describe preferred venue characteristics. Optionally name specific venues per city.
7. **Tone calibration:** Complete a short questionnaire on communication style. Provide 2–3 example outreach emails per contact type (investor, client, etc.) for the system to model the user's voice.
8. **Safety & comfort defaults:** Review and optionally adjust the default safety heuristics (see §7.1). All defaults are safe-by-default; the user can relax or tighten them.

### 9.2 Onboarding Principle

The system should be usable after completing steps 1–3 alone, with sensible defaults for everything else. Steps 4–8 improve quality but are not blocking. The system can prompt for missing preferences during the first trip planning conversation.

---

## 10. Notification & Approval Model

### 10.1 Notification Types

| Event | Channel | Urgency |
|---|---|---|
| Trip detected — planning conversation initiated | Slack / SMS / In-app (user preference) | Normal |
| Outreach plan ready for review | Same as above | Normal |
| Contact accepted — time/venue proposed | Same | High |
| Scheduling conflict detected | Same | High |
| Calendar full — outreach paused | Same | Normal |
| Personal outreach draft ready for review | Same | High |
| Daily trip prep summary (morning of meeting day) | Same | Normal |

### 10.2 Approval Gates

The system is designed to be autonomous by default with configurable approval checkpoints:

- **Always requires approval:** Outreach plan (before Wave 1 sends)
- **Configurable:** Personal email drafts (approve each, approve first then auto-send, or full auto-send)
- **Configurable:** Scheduling agent replies on personal threads (approve each, or auto-send for routine time confirmations)
- **Auto-approved by default:** EA outreach, Slack messages to internal contacts, follow-ups that match approved templates, venue suggestions for confirmed meetings

---

## 11. Data Model (Simplified)

### 11.1 Core Entities

**User**
- Identity attributes, preferences, instruction defaults, connected integrations, tone profile, safety settings

**Calendar**
- Google Calendar ID, display name, priority rank, contact type associations, availability contribution (yes/no)

**Trip**
- Destination, dates, hotel, associated calendar events, trip-level instructions, goals, status (planning / outreach-active / in-trip / complete)

**Contact**
- Name, email, phone, CRM source, contact type, relationship tier, city, outreach type (personal / EA), uses Howie (yes/no), Howie email, last interaction date

**Outreach**
- Trip ID, Contact ID, wave number, channel, message content, status (draft / pending-approval / sent / followed-up-1 / followed-up-2 / followed-up-3 / accepted / declined / unresponsive), timestamps

**Meeting**
- Trip ID, Contact ID, date/time, duration, venue, target calendar ID, calendar event ID, status (proposed / negotiating / confirmed / cancelled)

**Venue**
- Name, address, coordinates, type (café / restaurant / bar / office / hotel lobby), source (Google Maps / Resy / OpenTable / user-defined), user rating, times used

**Instruction Set**
- Scope (system / user / trip), content, associated user ID or trip ID, created/updated timestamps

---

## 12. Phase 1 Success Metrics

- **Trip activation rate:** % of detected trips where the user engages with the planning conversation
- **Calendar fill rate:** % of available meeting slots filled per trip
- **Outreach efficiency:** Ratio of outreach sent to meetings confirmed (target: ≤ 3:1)
- **Over-commitment incidents:** Number of times a user has to decline an accepted meeting (target: 0)
- **Time to first outreach:** Hours between trip detection and first outreach message sent
- **Scheduling agent resolution rate:** % of response threads the agent handles without escalating to the user
- **User satisfaction (NPS):** Post-trip survey

---

## 13. Out of Scope for Phase 1

- Multi-leg / multi-city trip optimization
- Team-level coordination (multiple users traveling to the same city)
- Expense tracking or receipt management
- Automated agenda or talking points generation
- Post-meeting follow-up automation (thank-you notes, CRM updates)
- AI-generated trip reports or meeting summaries
- Public-facing booking page for inbound meeting requests
- Per-user / per-contact-type learned acceptance rates (ships with 50% static default; learning deferred to Phase 2)
- Resy / OpenTable integration if their APIs require paid tiers

---

## 14. Resolved Design Decisions

| # | Question | Decision |
|---|---|---|
| 1 | Infrastructure stack | **Vercel** (hosting, serverless functions, edge middleware), **Firebase Auth** (Google OAuth identity layer), **Supabase** (PostgreSQL database with RLS, Edge Functions for background jobs, Realtime for live UI, Vault for encrypted credentials, Storage for file uploads). Next.js App Router as the framework. Anthropic Claude API for all LLM operations. |
| 2 | CRM flexibility | Any CRM supported via user-provided MCP server + data structure instructions. HubSpot supported natively. System defines required/recommended data fields; user maps their CRM to these fields. |
| 2 | Howie.com integration | No API. System emails the contact's Howie address from the user's personal Gmail with structured scheduling instructions. Howie replies are processed by the scheduling agent. |
| 3 | Response monitoring | Replies route through the user's Gmail inbox. The Pull-Up scheduling agent monitors outreach threads, classifies responses, and handles scheduling negotiation autonomously (with configurable approval for personal threads). |
| 4 | Venue data | Google Maps Places API as primary source. Resy / OpenTable integrated if free API tier is available; deferred otherwise. |
| 5 | Multi-calendar | Up to 5 Google Calendars. User defines priority rank, contact type association, and availability contribution per calendar. System reads across all, writes to the appropriate one. |
| 6 | Acceptance rate | Static 50% default for Phase 1. Per-user and per-contact-type learning deferred to Phase 2. |
| 7 | Tone calibration | Onboarding questionnaire + 2–3 example emails per contact type. User edits to drafts serve as ongoing implicit feedback. |
| 8 | Safety defaults | Safe by default, fully user-configurable. Users can relax or tighten any comfort/safety heuristic. |

---

## 15. Open Questions (Remaining)

1. **Scheduling agent guardrails:** What is the maximum number of back-and-forth messages the scheduling agent will send before escalating to the user? Should this be configurable?
2. **Howie detection:** Can we auto-detect whether a contact uses Howie (e.g., by checking for a known Howie email pattern in CRM data), or does the user need to manually flag each contact?
3. **Venue reservation flow:** If Resy/OpenTable integration is available, should the system auto-book reservations for confirmed lunch/dinner meetings, or always queue for user approval?
4. **Outreach thread identity:** For EA-style outreach, does the system send from the user's Gmail with an assistant-style signature, or from a separate Pull-Up-managed email address? The former is simpler; the latter avoids cluttering the user's sent folder.
5. **Cancellation and rescheduling:** If a confirmed meeting needs to change (contact cancels, user's flight changes), how much autonomy does the scheduling agent have to rebook? Should it auto-propose alternatives or escalate?
