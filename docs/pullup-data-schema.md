# Pull-Up — Data Schema

**Version:** 1.1  
**Last Updated:** March 13, 2026  
**Source:** Pull-Up Phase 1 PRD v1.1  
**Stack:** Supabase (PostgreSQL 15+), Firebase Auth, Vercel

---

## 1. Schema Overview

This document defines the data model for Pull-Up Phase 1. All tables live in Supabase PostgreSQL. Row-Level Security (RLS) is enabled on every table, with policies keyed to the Firebase `uid` passed through from Vercel API routes. The `users.id` column stores the Firebase `uid` directly — this is the foreign key used across the entire schema.

### Infrastructure Notes

- **Database:** Supabase PostgreSQL with RLS enabled on all tables
- **Auth bridge:** Firebase Auth → Vercel middleware verifies ID token → sets `request.jwt.claims.sub` header → Supabase RLS reads via `auth.uid()` custom function mapped to Firebase `uid`
- **Encrypted credentials:** OAuth tokens and API keys stored in Supabase Vault (`vault.secrets`), referenced by ID from application tables — never stored in plaintext
- **Realtime:** Supabase Realtime enabled on `planning_conversation_messages`, `outreach_threads`, `meetings` for live UI updates
- **Background jobs:** Supabase Edge Functions + `pg_cron` for scheduled and event-driven agentic work
- **All `id` columns:** `uuid` type, default `gen_random_uuid()`
- **All `created_at` / `updated_at` columns:** `timestamptz`, default `now()`. `updated_at` auto-maintained via trigger.
- **All enums:** Defined as PostgreSQL `CREATE TYPE` enums for type safety

### Entity Relationship Summary

```
User (id = Firebase uid)
├── Calendars (up to 5)
├── CRM Sources (HubSpot native or MCP)
│   └── Contacts
├── Instruction Sets (user-level)
├── Tone Profile
├── Venue Preferences
└── Trips
    ├── Instruction Sets (trip-level)
    ├── Trip Contacts (prioritized, scored)
    │   └── Outreach (waves, follow-ups)
    │       └── Outreach Messages
    └── Meetings
        └── Venue
```

### RLS Policy Pattern

Every table with a `user_id` column uses this base policy:

```sql
CREATE POLICY "Users can only access their own data"
  ON [table_name]
  FOR ALL
  USING (user_id = auth.uid());
```

For tables without a direct `user_id` (e.g., `outreach_messages`), RLS policies join through the parent chain to reach `user_id`. These are documented per table below.

---

## 2. Users

### 2.1 `users`

| Field | Type | Required | Description |
|---|---|---|---|
| `id` | uuid | yes | Primary key. **Set to the Firebase `uid`** — not auto-generated. This is the join key for all RLS policies. |
| `email` | text | yes | Primary email address (used for login and default personal outreach) |
| `full_name` | string | yes | Display name |
| `first_name` | string | yes | Used in outreach templates |
| `last_name` | string | yes | Used in outreach templates |
| `home_city` | string | yes | Used to detect out-of-city travel |
| `home_timezone` | string | yes | IANA timezone (e.g., `America/Chicago`) |
| `role_type` | enum | yes | `salesperson`, `investor`, `founder`, `executive`, `bd`, `other` |
| `role_label` | string | no | Custom role description if `role_type` is `other` |
| `gender` | enum | no | `male`, `female`, `non_binary`, `prefer_not_to_say`. Informs safety defaults. |
| `max_meetings_per_day` | integer | yes | Hard cap. Default: 5 |
| `default_availability_start` | time | yes | Earliest meeting start time. Default: `09:00` |
| `default_availability_end` | time | yes | Latest meeting end time. Default: `18:00` |
| `meeting_buffer_minutes` | integer | yes | Minimum buffer added on top of travel time between meetings. Default: 15 |
| `notification_channel` | enum | yes | `slack`, `sms`, `in_app`. Where the agent initiates conversations and sends alerts. |
| `notification_phone` | string | no | Required if `notification_channel` is `sms` |
| `notification_slack_user_id` | string | no | Required if `notification_channel` is `slack` |
| `onboarding_completed` | boolean | yes | Default: false |
| `google_oauth_vault_secret_id` | uuid | no | FK → Supabase Vault `vault.secrets`. Stores encrypted Google OAuth access + refresh tokens for Calendar and Gmail API access. |
| `created_at` | timestamptz | yes | Default: `now()` |
| `updated_at` | timestamptz | yes | Default: `now()`, auto-updated via trigger |

### 2.2 `user_safety_settings`

Comfort and safety defaults. All rows are created with safe defaults on account creation. Users can modify.

| Field | Type | Required | Description |
|---|---|---|---|
| `id` | uuid | yes | Primary key |
| `user_id` | uuid | yes | FK → `users` |
| `rule_key` | string | yes | Identifier for the rule (e.g., `cross_gender_evening_drinks`, `evening_venue_type`, `first_meeting_venue_type`) |
| `rule_value` | jsonb | yes | Configuration for this rule. Structure varies by `rule_key`. |
| `enabled` | boolean | yes | Whether this safety rule is active. Default: true |
| `created_at` | timestamp | yes | |
| `updated_at` | timestamp | yes | |

**Default safety rules created on account setup:**

| `rule_key` | Default `rule_value` | Behavior |
|---|---|---|
| `cross_gender_evening_drinks` | `{ "blocked": true, "override_allowed": true }` | Do not schedule evening drinks/bar meetings between user and contacts of a different gender |
| `evening_venue_type` | `{ "allowed_types": ["hotel_lobby", "restaurant"], "after_hour": 18 }` | Evening meetings default to well-lit, public, professional venues |
| `first_meeting_venue_type` | `{ "allowed_types": ["cafe", "restaurant", "hotel_lobby", "office"], "blocked_types": ["bar", "private_club"] }` | First-time meetings with new contacts avoid isolated or unfamiliar venues |

---

## 3. Calendars

### 3.1 `calendars`

| Field | Type | Required | Description |
|---|---|---|---|
| `id` | uuid | yes | Primary key |
| `user_id` | uuid | yes | FK → `users` |
| `google_calendar_id` | string | yes | Google Calendar API identifier |
| `display_name` | string | yes | User-facing label (e.g., "Work", "Personal", "Fund") |
| `priority_rank` | integer | yes | 1 = highest priority. Used for conflict resolution. Unique per user. |
| `contributes_availability` | boolean | yes | Whether events on this calendar block availability for scheduling. Default: true |
| `is_trip_source` | boolean | yes | Whether this calendar is monitored for trip detection events. Default: true |
| `created_at` | timestamp | yes | |
| `updated_at` | timestamp | yes | |

**Constraint:** Max 5 calendars per user. `priority_rank` is unique within a user's calendars.

### 3.2 `calendar_contact_type_mappings`

Defines which contact types write meetings to which calendar.

| Field | Type | Required | Description |
|---|---|---|---|
| `id` | uuid | yes | Primary key |
| `calendar_id` | uuid | yes | FK → `calendars` |
| `contact_type` | string | yes | References `contact_types.slug` |
| `created_at` | timestamp | yes | |

**Example:** Calendar "Fund" is mapped to contact types `lp_committed`, `lp_prospective`. Calendar "Work" is mapped to `client`, `partner`. When a meeting is confirmed with an LP, it goes on the Fund calendar.

---

## 4. CRM Sources

### 4.1 `crm_sources`

| Field | Type | Required | Description |
|---|---|---|---|
| `id` | uuid | yes | Primary key |
| `user_id` | uuid | yes | FK → `users` |
| `source_type` | enum | yes | `hubspot_native`, `mcp_custom` |
| `display_name` | string | yes | User-facing label (e.g., "Sales CRM", "Fund CRM", "Personal Contacts") |
| `mcp_endpoint` | string | no | Required if `source_type` is `mcp_custom`. The MCP server URL. |
| `schema_instructions` | text | no | Required if `source_type` is `mcp_custom`. Natural-language description of the CRM data structure and how to query it. |
| `field_mapping` | jsonb | no | Maps Pull-Up required/recommended fields to CRM-specific field names. See §4.2. |
| `hubspot_vault_secret_id` | uuid | no | FK → Supabase Vault `vault.secrets`. Required if `source_type` is `hubspot_native`. Stores encrypted HubSpot OAuth tokens. |
| `mcp_auth_vault_secret_id` | uuid | no | FK → Supabase Vault `vault.secrets`. Optional. Stores encrypted auth credentials for the MCP endpoint if it requires authentication. |
| `last_sync_at` | timestamp | no | Last time contacts were pulled/refreshed from this source |
| `sync_status` | enum | yes | `active`, `error`, `disconnected` |
| `created_at` | timestamp | yes | |
| `updated_at` | timestamp | yes | |

### 4.2 `field_mapping` Structure

For `mcp_custom` sources, this JSON object maps Pull-Up's expected fields to the CRM's actual field names or paths.

```json
{
  "required": {
    "contact_name": "properties.full_name",
    "contact_email": "properties.email",
    "contact_city": "properties.location.city",
    "contact_type": "properties.tags[0]"
  },
  "recommended": {
    "last_interaction_date": "properties.last_activity_date",
    "deal_stage": "associations.deals[0].stage",
    "company_name": "properties.company",
    "notes": "properties.description",
    "phone": "properties.phone"
  }
}
```

For `hubspot_native` sources, the field mapping is pre-configured and not user-editable.

---

## 5. Contact Types & Priority Tiers

### 5.1 `contact_types`

User-defined categories for their contacts. Created during onboarding, editable anytime.

| Field | Type | Required | Description |
|---|---|---|---|
| `id` | uuid | yes | Primary key |
| `user_id` | uuid | yes | FK → `users` |
| `slug` | string | yes | Machine-readable key (e.g., `investor`, `client`, `partner`, `colleague`) |
| `display_name` | string | yes | User-facing label (e.g., "Investor", "Client") |
| `default_meeting_length_minutes` | integer | yes | Default duration for meetings with this contact type |
| `default_meeting_type` | enum | yes | `coffee`, `lunch`, `dinner`, `drinks`, `office_visit`, `video_call` |
| `outreach_style` | enum | yes | `personal`, `ea`. Whether outreach to this type comes from user's email or EA. |
| `outreach_approval` | enum | yes | `approve_each`, `approve_first_then_auto`, `auto_send` |
| `scheduling_reply_approval` | enum | yes | `approve_each`, `auto_send`. Controls whether the scheduling agent can auto-reply on personal threads. |
| `max_follow_ups` | integer | yes | Max follow-ups for this contact type. Default: 3 for Tier 1, 2 for Tier 2, 1 for Tier 3. |
| `priority_tier` | integer | yes | 1 = highest priority. Used in waterfall wave assignment. |
| `created_at` | timestamp | yes | |
| `updated_at` | timestamp | yes | |

**Constraint:** `slug` is unique per user.

### 5.2 `contact_type_example_emails`

Sample outreach emails provided during onboarding for tone calibration.

| Field | Type | Required | Description |
|---|---|---|---|
| `id` | uuid | yes | Primary key |
| `contact_type_id` | uuid | yes | FK → `contact_types` |
| `email_body` | text | yes | Full text of the example email |
| `email_subject` | string | no | Subject line if provided |
| `context_notes` | text | no | User's notes on the context of this email (e.g., "I sent this to an LP I'd met once before") |
| `created_at` | timestamp | yes | |

---

## 6. Contacts

### 6.1 `contacts`

| Field | Type | Required | Description |
|---|---|---|---|
| `id` | uuid | yes | Primary key |
| `user_id` | uuid | yes | FK → `users` |
| `crm_source_id` | uuid | no | FK → `crm_sources`. Null if manually added. |
| `crm_external_id` | string | no | The contact's ID in the source CRM. Used for dedup and sync. |
| `full_name` | string | yes | |
| `first_name` | string | no | |
| `last_name` | string | no | |
| `email` | string | yes | Primary email |
| `phone` | string | no | |
| `company_name` | string | no | |
| `city` | string | no | Contact's primary city. Used for trip-based filtering. |
| `contact_type_id` | uuid | yes | FK → `contact_types` |
| `outreach_type_override` | enum | no | `personal`, `ea`. If set, overrides the contact type default for this specific contact. |
| `uses_howie` | boolean | yes | Default: false |
| `howie_email` | string | no | Required if `uses_howie` is true |
| `last_interaction_date` | date | no | Last known meeting or meaningful interaction |
| `deal_stage` | string | no | Current deal stage from CRM (e.g., "negotiation", "closed-won", "prospecting") |
| `relationship_notes` | text | no | Free-text notes synced from CRM or added manually |
| `gender` | enum | no | `male`, `female`, `non_binary`, `unknown`. Used for safety-aware scheduling. |
| `is_internal` | boolean | yes | Whether this contact is within the user's own company. Default: false. Affects personal time rules. |
| `last_synced_at` | timestamp | no | |
| `created_at` | timestamp | yes | |
| `updated_at` | timestamp | yes | |

**Constraint:** `(user_id, crm_source_id, crm_external_id)` is unique when `crm_source_id` is not null (prevents duplicate imports).

---

## 7. Tone Profile

### 7.1 `tone_profiles`

Stores the extracted tone model for the user, built from onboarding questionnaire and example emails.

| Field | Type | Required | Description |
|---|---|---|---|
| `id` | uuid | yes | Primary key |
| `user_id` | uuid | yes | FK → `users`. One-to-one. |
| `formality_level` | enum | yes | `very_formal`, `formal`, `casual`, `very_casual` |
| `greeting_style` | string | no | e.g., "Uses first name immediately", "Opens with 'Hey [Name]'" |
| `closing_style` | string | no | e.g., "Best,", "Cheers,", "Talk soon," |
| `tone_keywords` | text[] | no | Extracted descriptors: `["warm", "direct", "concise"]` |
| `questionnaire_responses` | jsonb | yes | Raw responses from the onboarding tone questionnaire |
| `synthesized_prompt` | text | no | System-generated prompt used to instruct the LLM when drafting messages in this user's voice. Updated as the profile evolves. |
| `created_at` | timestamp | yes | |
| `updated_at` | timestamp | yes | |

---

## 8. Instruction Sets

### 8.1 `instruction_sets`

Stores the three-tier instruction hierarchy. System-level instructions are seeded by the platform. User-level and trip-level are user-created.

| Field | Type | Required | Description |
|---|---|---|---|
| `id` | uuid | yes | Primary key |
| `scope` | enum | yes | `system`, `user`, `trip` |
| `user_id` | uuid | no | FK → `users`. Null for system-level. |
| `trip_id` | uuid | no | FK → `trips`. Set only for trip-level. |
| `category` | string | yes | Groups related instructions (e.g., `availability`, `outreach_timing`, `venue_preferences`, `safety`, `goals`, `contact_priority`) |
| `instruction_key` | string | yes | Specific instruction identifier within category (e.g., `net_new_outreach_cutoff_days`, `max_follow_ups`) |
| `instruction_value` | jsonb | yes | The instruction content. Structure varies by key. |
| `is_active` | boolean | yes | Default: true. Allows soft-disabling without deletion. |
| `created_at` | timestamp | yes | |
| `updated_at` | timestamp | yes | |

**Resolution rule:** When the system needs an instruction, it queries in order: trip-level → user-level → system-level. The first match wins. This implements the override hierarchy defined in the PRD.

**System-level seed instructions:**

| `category` | `instruction_key` | `instruction_value` |
|---|---|---|
| `outreach_timing` | `min_lead_time_days` | `{ "value": 3 }` |
| `outreach_timing` | `recommended_planning_start_days` | `{ "value": 21 }` |
| `outreach_timing` | `net_new_outreach_cutoff_days` | `{ "value": 5 }` |
| `outreach_timing` | `follow_up_continue_cutoff_days` | `{ "value": 2 }` |
| `outreach_timing` | `follow_up_spacing_days` | `{ "min": 2, "max": 3 }` |
| `outreach_timing` | `max_follow_ups_per_contact` | `{ "value": 3 }` |
| `waterfall` | `default_acceptance_rate` | `{ "value": 0.50 }` |
| `scheduling` | `min_buffer_minutes` | `{ "value": 15 }` |

---

## 9. Venue Preferences

### 9.1 `venue_preferences`

User-defined preferences for venue types by meeting type. Stored at the user level, optionally overridden per city.

| Field | Type | Required | Description |
|---|---|---|---|
| `id` | uuid | yes | Primary key |
| `user_id` | uuid | yes | FK → `users` |
| `meeting_type` | enum | yes | `coffee`, `lunch`, `dinner`, `drinks`, `office_visit` |
| `city` | string | no | If set, this preference applies only in this city. If null, it's a global default. |
| `preferred_venue_traits` | text | no | Natural-language description (e.g., "Quiet, upscale, good for conversation") |
| `preferred_venue_names` | text[] | no | Specific named venues (e.g., `["Alfred Coffee", "Verve Coffee Roasters"]`) |
| `avoided_venue_traits` | text | no | Natural-language exclusions (e.g., "No loud sports bars") |
| `created_at` | timestamp | yes | |
| `updated_at` | timestamp | yes | |

---

## 10. Trips

### 10.1 `trips`

| Field | Type | Required | Description |
|---|---|---|---|
| `id` | uuid | yes | Primary key |
| `user_id` | uuid | yes | FK → `users` |
| `destination_city` | string | yes | Extracted from calendar event |
| `destination_state` | string | no | |
| `destination_country` | string | no | |
| `arrival_datetime` | timestamp | yes | |
| `departure_datetime` | timestamp | yes | |
| `destination_timezone` | string | yes | IANA timezone for the destination |
| `hotel_name` | string | no | Extracted from hotel booking event if available |
| `hotel_address` | string | no | |
| `hotel_latitude` | decimal | no | Geocoded from address |
| `hotel_longitude` | decimal | no | Geocoded from address |
| `trigger_calendar_id` | uuid | no | FK → `calendars`. The calendar where the trip was detected. |
| `trigger_event_id` | string | no | Google Calendar event ID that triggered detection |
| `status` | enum | yes | `detected`, `planning`, `outreach_active`, `outreach_paused`, `in_trip`, `complete`, `cancelled` |
| `goal_summary` | text | no | Free-text trip goal captured during planning conversation (e.g., "Focus on closing Series B LPs") |
| `outreach_start_date` | date | no | Date when Wave 1 was approved and sent |
| `outreach_cutoff_date` | date | no | Computed: `arrival_date - net_new_outreach_cutoff_days` |
| `total_available_slots` | integer | no | Computed during planning based on availability windows and meeting length defaults |
| `created_at` | timestamp | yes | |
| `updated_at` | timestamp | yes | |

### 10.2 `trip_availability_windows`

Explicit availability blocks for this trip, captured during the planning conversation. These override the user's default availability for the trip dates.

| Field | Type | Required | Description |
|---|---|---|---|
| `id` | uuid | yes | Primary key |
| `trip_id` | uuid | yes | FK → `trips` |
| `date` | date | yes | |
| `start_time` | time | yes | |
| `end_time` | time | yes | |
| `restriction` | enum | yes | `open`, `internal_only`, `blocked` |
| `notes` | text | no | e.g., "Morning personal time — only company-internal contacts" |
| `created_at` | timestamp | yes | |

---

## 11. Trip Contacts

### 11.1 `trip_contacts`

The prioritized list of contacts for a specific trip. Generated by the contact prioritization engine and approved (possibly edited) by the user during the planning conversation.

| Field | Type | Required | Description |
|---|---|---|---|
| `id` | uuid | yes | Primary key |
| `trip_id` | uuid | yes | FK → `trips` |
| `contact_id` | uuid | yes | FK → `contacts` |
| `priority_score` | decimal | yes | Computed score (higher = more important to meet). See §11.2 for scoring inputs. |
| `priority_tier` | integer | yes | 1, 2, or 3. Derived from score and contact type tier. |
| `wave_assignment` | integer | no | Which outreach wave this contact is assigned to. Null until outreach plan is built. |
| `goal_alignment_score` | decimal | no | How well this contact maps to the trip's stated goals (0.0–1.0) |
| `recency_score` | decimal | no | Based on time since last interaction (longer gap = higher score) |
| `deal_relevance_score` | decimal | no | Based on deal stage / fund relevance |
| `user_requested` | boolean | yes | True if the user explicitly asked to meet this person. Default: false. |
| `user_excluded` | boolean | yes | True if the user explicitly excluded this person. Default: false. |
| `status` | enum | yes | `pending`, `outreach_sent`, `accepted`, `declined`, `unresponsive`, `excluded` |
| `created_at` | timestamp | yes | |
| `updated_at` | timestamp | yes | |

**Constraint:** `(trip_id, contact_id)` is unique.

### 11.2 Priority Score Inputs

The `priority_score` is a weighted composite. Weights are configurable at the system level and overridable at the user level:

- `goal_alignment_score` × weight (default: 0.30)
- `recency_score` × weight (default: 0.20)
- `deal_relevance_score` × weight (default: 0.25)
- `contact_type.priority_tier` normalized × weight (default: 0.15)
- `user_requested` bonus (default: +1.0, effectively forces to top)
- Geographic proximity to hotel × weight (default: 0.10)

---

## 12. Outreach

### 12.1 `outreach_campaigns`

One campaign per trip. Tracks the overall state of the outreach waterfall.

| Field | Type | Required | Description |
|---|---|---|---|
| `id` | uuid | yes | Primary key |
| `trip_id` | uuid | yes | FK → `trips`. One-to-one. |
| `status` | enum | yes | `draft`, `approved`, `active`, `paused`, `complete` |
| `acceptance_rate_assumption` | decimal | yes | The rate used for capacity math. Default: 0.50. |
| `total_slots` | integer | yes | Total available meeting slots for the trip |
| `filled_slots` | integer | yes | Currently confirmed meetings. Default: 0 |
| `current_wave` | integer | yes | The active wave number. Default: 1 |
| `approved_at` | timestamp | no | When the user approved the outreach plan |
| `paused_at` | timestamp | no | When outreach was paused (e.g., calendar full) |
| `completed_at` | timestamp | no | |
| `created_at` | timestamp | yes | |
| `updated_at` | timestamp | yes | |

### 12.2 `outreach_waves`

Each wave within a campaign.

| Field | Type | Required | Description |
|---|---|---|---|
| `id` | uuid | yes | Primary key |
| `campaign_id` | uuid | yes | FK → `outreach_campaigns` |
| `wave_number` | integer | yes | 1, 2, 3, etc. |
| `target_count` | integer | yes | Number of contacts in this wave |
| `status` | enum | yes | `pending`, `sending`, `awaiting_responses`, `complete` |
| `slots_remaining_at_start` | integer | yes | Open slots when this wave was initiated |
| `started_at` | timestamp | no | |
| `completed_at` | timestamp | no | |
| `created_at` | timestamp | yes | |

### 12.3 `outreach_threads`

One thread per contact per trip. Tracks the full lifecycle of outreach to a single person.

| Field | Type | Required | Description |
|---|---|---|---|
| `id` | uuid | yes | Primary key |
| `campaign_id` | uuid | yes | FK → `outreach_campaigns` |
| `wave_id` | uuid | yes | FK → `outreach_waves` |
| `trip_contact_id` | uuid | yes | FK → `trip_contacts` |
| `contact_id` | uuid | yes | FK → `contacts` (denormalized for query convenience) |
| `channel` | enum | yes | `email_personal`, `email_ea`, `howie`, `slack`, `sms` |
| `outreach_type` | enum | yes | `personal`, `ea` |
| `status` | enum | yes | `draft`, `pending_approval`, `sent`, `follow_up_1`, `follow_up_2`, `follow_up_3`, `accepted`, `declined`, `counter_proposed`, `delegated`, `unresponsive`, `cancelled` |
| `gmail_thread_id` | string | no | Gmail thread ID for email-based outreach. Used by the scheduling agent to monitor replies. |
| `slack_channel_id` | string | no | Slack DM channel ID if outreach is via Slack |
| `twilio_message_sid` | string | no | Twilio message SID if outreach is via SMS |
| `next_follow_up_date` | date | no | Scheduled date for the next follow-up |
| `follow_up_count` | integer | yes | Default: 0 |
| `responded_at` | timestamp | no | |
| `created_at` | timestamp | yes | |
| `updated_at` | timestamp | yes | |

### 12.4 `outreach_messages`

Individual messages within a thread (initial outreach + follow-ups + scheduling replies).

| Field | Type | Required | Description |
|---|---|---|---|
| `id` | uuid | yes | Primary key |
| `thread_id` | uuid | yes | FK → `outreach_threads` |
| `message_type` | enum | yes | `initial_outreach`, `follow_up`, `scheduling_reply`, `confirmation`, `cancellation` |
| `direction` | enum | yes | `outbound`, `inbound` |
| `channel` | enum | yes | `email`, `slack`, `sms` |
| `subject` | string | no | Email subject line |
| `body` | text | yes | Message content |
| `sender_email` | string | no | |
| `recipient_email` | string | no | |
| `gmail_message_id` | string | no | For email messages, the Gmail API message ID |
| `approval_status` | enum | no | `pending`, `approved`, `auto_approved`, `edited_and_approved`. Null for inbound messages. |
| `approved_at` | timestamp | no | |
| `sent_at` | timestamp | no | |
| `received_at` | timestamp | no | For inbound messages |
| `created_at` | timestamp | yes | |

---

## 13. Meetings

### 13.1 `meetings`

| Field | Type | Required | Description |
|---|---|---|---|
| `id` | uuid | yes | Primary key |
| `trip_id` | uuid | yes | FK → `trips` |
| `contact_id` | uuid | yes | FK → `contacts` |
| `trip_contact_id` | uuid | yes | FK → `trip_contacts` |
| `outreach_thread_id` | uuid | no | FK → `outreach_threads`. Null if meeting was pre-existing (not booked by Pull-Up). |
| `target_calendar_id` | uuid | yes | FK → `calendars`. Which calendar this meeting is written to. |
| `google_event_id` | string | no | Google Calendar event ID once created |
| `meeting_type` | enum | yes | `coffee`, `lunch`, `dinner`, `drinks`, `office_visit`, `video_call` |
| `date` | date | yes | |
| `start_time` | time | yes | |
| `end_time` | time | yes | |
| `duration_minutes` | integer | yes | |
| `venue_id` | uuid | no | FK → `venues`. Null if venue not yet selected or is virtual. |
| `venue_name` | string | no | Denormalized for display |
| `venue_address` | string | no | Denormalized for display |
| `status` | enum | yes | `proposed`, `negotiating`, `confirmed`, `cancelled`, `rescheduled`, `completed` |
| `travel_time_from_previous_minutes` | integer | no | Computed travel time from the preceding meeting or hotel |
| `travel_block_event_id` | string | no | Google Calendar event ID for the travel buffer block (if user has travel blocks enabled) |
| `calendar_description` | text | no | Context written into the calendar event (relationship summary, last meeting date, etc.) |
| `confirmed_at` | timestamp | no | |
| `cancelled_at` | timestamp | no | |
| `created_at` | timestamp | yes | |
| `updated_at` | timestamp | yes | |

---

## 14. Venues

### 14.1 `venues`

| Field | Type | Required | Description |
|---|---|---|---|
| `id` | uuid | yes | Primary key |
| `google_place_id` | string | no | Google Maps Place ID |
| `name` | string | yes | |
| `address` | string | yes | |
| `city` | string | yes | |
| `latitude` | decimal | yes | |
| `longitude` | decimal | yes | |
| `venue_type` | enum | yes | `cafe`, `restaurant`, `bar`, `hotel_lobby`, `office`, `coworking`, `private_club`, `other` |
| `price_level` | integer | no | 1–4 scale from Google Maps |
| `google_rating` | decimal | no | |
| `resy_id` | string | no | Resy venue ID if available |
| `opentable_id` | string | no | OpenTable venue ID if available |
| `supports_reservation` | boolean | yes | Whether a reservation can be made programmatically. Default: false |
| `ambiance_notes` | text | no | Enrichment data: noise level, dress code, vibe (from Resy/OpenTable or user notes) |
| `created_at` | timestamp | yes | |
| `updated_at` | timestamp | yes | |

### 14.2 `venue_usage_history`

Tracks which venues the user has used, with whom, and how they rated them.

| Field | Type | Required | Description |
|---|---|---|---|
| `id` | uuid | yes | Primary key |
| `user_id` | uuid | yes | FK → `users` |
| `venue_id` | uuid | yes | FK → `venues` |
| `meeting_id` | uuid | no | FK → `meetings` |
| `contact_id` | uuid | no | FK → `contacts`. Who the user met here. |
| `visit_date` | date | yes | |
| `user_rating` | integer | no | 1–5 post-meeting rating |
| `user_notes` | text | no | e.g., "Too loud for a business meeting" |
| `created_at` | timestamp | yes | |

---

## 15. Planning Conversations

### 15.1 `planning_conversations`

Stores the agent ↔ user planning conversation for each trip.

| Field | Type | Required | Description |
|---|---|---|---|
| `id` | uuid | yes | Primary key |
| `trip_id` | uuid | yes | FK → `trips`. One-to-one. |
| `channel` | enum | yes | `slack`, `sms`, `in_app` |
| `status` | enum | yes | `initiated`, `in_progress`, `plan_approved`, `abandoned` |
| `initiated_at` | timestamp | yes | |
| `approved_at` | timestamp | no | When the user approved the final outreach plan |
| `created_at` | timestamp | yes | |
| `updated_at` | timestamp | yes | |

### 15.2 `planning_conversation_messages`

| Field | Type | Required | Description |
|---|---|---|---|
| `id` | uuid | yes | Primary key |
| `conversation_id` | uuid | yes | FK → `planning_conversations` |
| `role` | enum | yes | `agent`, `user` |
| `content` | text | yes | Message body |
| `message_metadata` | jsonb | no | Structured data attached to agent messages (e.g., contact list presented, availability parsed) |
| `sent_at` | timestamp | yes | |
| `created_at` | timestamp | yes | |

---

## 16. Indexes

### Performance-Critical Indexes

```
users: (email) UNIQUE
calendars: (user_id, priority_rank) UNIQUE
contacts: (user_id, crm_source_id, crm_external_id) UNIQUE WHERE crm_source_id IS NOT NULL
contacts: (user_id, city)
trips: (user_id, status)
trips: (user_id, arrival_datetime)
trip_contacts: (trip_id, contact_id) UNIQUE
trip_contacts: (trip_id, priority_score DESC)
trip_contacts: (trip_id, wave_assignment)
outreach_threads: (campaign_id, status)
outreach_threads: (gmail_thread_id) WHERE gmail_thread_id IS NOT NULL
outreach_threads: (next_follow_up_date) WHERE status IN ('sent', 'follow_up_1', 'follow_up_2')
outreach_messages: (thread_id, created_at)
meetings: (trip_id, date, start_time)
meetings: (target_calendar_id, date)
venue_usage_history: (user_id, venue_id)
```

---

## 17. Enumeration Reference

| Enum | Values |
|---|---|
| `user_role_type` | `salesperson`, `investor`, `founder`, `executive`, `bd`, `other` |
| `gender` | `male`, `female`, `non_binary`, `prefer_not_to_say`, `unknown` |
| `notification_channel` | `slack`, `sms`, `in_app` |
| `crm_source_type` | `hubspot_native`, `mcp_custom` |
| `crm_sync_status` | `active`, `error`, `disconnected` |
| `outreach_style` | `personal`, `ea` |
| `outreach_approval` | `approve_each`, `approve_first_then_auto`, `auto_send` |
| `scheduling_reply_approval` | `approve_each`, `auto_send` |
| `outreach_channel` | `email_personal`, `email_ea`, `howie`, `slack`, `sms` |
| `outreach_thread_status` | `draft`, `pending_approval`, `sent`, `follow_up_1`, `follow_up_2`, `follow_up_3`, `accepted`, `declined`, `counter_proposed`, `delegated`, `unresponsive`, `cancelled` |
| `outreach_message_type` | `initial_outreach`, `follow_up`, `scheduling_reply`, `confirmation`, `cancellation` |
| `message_direction` | `outbound`, `inbound` |
| `message_approval_status` | `pending`, `approved`, `auto_approved`, `edited_and_approved` |
| `meeting_type` | `coffee`, `lunch`, `dinner`, `drinks`, `office_visit`, `video_call` |
| `meeting_status` | `proposed`, `negotiating`, `confirmed`, `cancelled`, `rescheduled`, `completed` |
| `venue_type` | `cafe`, `restaurant`, `bar`, `hotel_lobby`, `office`, `coworking`, `private_club`, `other` |
| `trip_status` | `detected`, `planning`, `outreach_active`, `outreach_paused`, `in_trip`, `complete`, `cancelled` |
| `availability_restriction` | `open`, `internal_only`, `blocked` |
| `instruction_scope` | `system`, `user`, `trip` |
| `conversation_status` | `initiated`, `in_progress`, `plan_approved`, `abandoned` |
| `conversation_role` | `agent`, `user` |

---

## 18. Supabase Infrastructure Configuration

### 18.1 RLS Policies (Summary)

| Table | Policy | Rule |
|---|---|---|
| `users` | Own record only | `id = auth.uid()` |
| `calendars` | Own calendars | `user_id = auth.uid()` |
| `calendar_contact_type_mappings` | Via calendar | `calendar_id IN (SELECT id FROM calendars WHERE user_id = auth.uid())` |
| `crm_sources` | Own CRM sources | `user_id = auth.uid()` |
| `contact_types` | Own contact types | `user_id = auth.uid()` |
| `contacts` | Own contacts | `user_id = auth.uid()` |
| `tone_profiles` | Own profile | `user_id = auth.uid()` |
| `instruction_sets` | Own or system | `user_id = auth.uid() OR scope = 'system'` |
| `venue_preferences` | Own preferences | `user_id = auth.uid()` |
| `trips` | Own trips | `user_id = auth.uid()` |
| `trip_availability_windows` | Via trip | `trip_id IN (SELECT id FROM trips WHERE user_id = auth.uid())` |
| `trip_contacts` | Via trip | `trip_id IN (SELECT id FROM trips WHERE user_id = auth.uid())` |
| `outreach_campaigns` | Via trip | `trip_id IN (SELECT id FROM trips WHERE user_id = auth.uid())` |
| `outreach_waves` | Via campaign → trip | Join through `outreach_campaigns` to `trips.user_id` |
| `outreach_threads` | Via campaign → trip | Join through `outreach_campaigns` to `trips.user_id` |
| `outreach_messages` | Via thread → campaign → trip | Join through parent chain to `trips.user_id` |
| `meetings` | Via trip | `trip_id IN (SELECT id FROM trips WHERE user_id = auth.uid())` |
| `venues` | Public read | All users can read venues. Write restricted to service role. |
| `venue_usage_history` | Own history | `user_id = auth.uid()` |
| `planning_conversations` | Via trip | `trip_id IN (SELECT id FROM trips WHERE user_id = auth.uid())` |
| `planning_conversation_messages` | Via conversation → trip | Join through parent chain to `trips.user_id` |
| `user_safety_settings` | Own settings | `user_id = auth.uid()` |

### 18.2 Realtime Subscriptions

Supabase Realtime is enabled on the following tables for live UI updates. All subscriptions are filtered through RLS — users only receive events for their own data.

| Table | Events | UI Consumer |
|---|---|---|
| `planning_conversation_messages` | INSERT | Planning conversation chat UI — new messages stream in as the agent responds |
| `outreach_threads` | UPDATE | Trip dashboard — thread status changes (sent → accepted, etc.) update in real time |
| `meetings` | INSERT, UPDATE | Trip schedule view — new confirmed meetings and status changes appear live |
| `trips` | UPDATE | Trip list — status transitions (planning → outreach_active, etc.) reflected immediately |

### 18.3 Database Triggers

| Trigger | Table | Event | Action |
|---|---|---|---|
| `update_timestamp` | All tables with `updated_at` | BEFORE UPDATE | Sets `updated_at = now()` |
| `on_thread_status_change` | `outreach_threads` | AFTER UPDATE on `status` | Calls Edge Function to evaluate wave advancement: counts remaining open threads, recalculates capacity, potentially unlocks next wave |
| `on_meeting_confirmed` | `meetings` | AFTER INSERT / UPDATE where `status = 'confirmed'` | Calls Edge Function to: increment `outreach_campaigns.filled_slots`, check if calendar is full, pause outreach if needed |
| `on_meeting_cancelled` | `meetings` | AFTER UPDATE where `status = 'cancelled'` | Calls Edge Function to: decrement `filled_slots`, potentially resume paused outreach |
| `on_new_user` | `users` | AFTER INSERT | Seeds default `user_safety_settings` rows and system-level `instruction_sets` |

### 18.4 pg_cron Scheduled Jobs

All scheduled jobs run as Supabase Edge Functions invoked by pg_cron.

| Job | Schedule | Description |
|---|---|---|
| `trip_detection_poll` | `*/30 * * * *` (every 30 min) | For each active user, polls connected Google Calendars for new flight/hotel events. Creates `trips` rows in `detected` status and initiates planning conversation. |
| `follow_up_sender` | `0 9 * * *` (daily at 9am UTC) | Queries `outreach_threads` where `next_follow_up_date <= today` and status is in a follow-up-eligible state. Generates and sends (or queues for approval) follow-up messages. |
| `response_monitor` | `*/15 * * * *` (every 15 min) | For each active `outreach_thread` with a `gmail_thread_id`, checks Gmail for new replies. Classifies responses and triggers the scheduling agent Edge Function. |
| `calendar_sync` | `*/15 * * * *` (every 15 min) | Syncs availability across all connected calendars for users with active trips. Detects conflicts with proposed meetings. |
| `outreach_cutoff_check` | `0 0 * * *` (daily at midnight UTC) | Checks active campaigns where `today >= outreach_cutoff_date`. Transitions campaign status to prevent new outreach sends. |
| `crm_contact_sync` | `0 */6 * * *` (every 6 hours) | Refreshes contact data from connected CRM sources. Updates `contacts` table and flags new contacts in trip destination cities. |

### 18.5 Supabase Edge Functions

| Function | Trigger Source | Description |
|---|---|---|
| `trip-detected` | `trip_detection_poll` cron job | Parses calendar event, extracts destination/dates, creates trip record, initiates planning conversation via configured notification channel. |
| `planning-agent` | Vercel API route (user sends message) | Receives user message in planning conversation, generates agent response via Claude API, updates trip-level instructions as they're confirmed. |
| `build-outreach-plan` | `planning-agent` (when plan is approved) | Generates prioritized contact list, assigns waves, computes capacity, creates `outreach_campaign`, `outreach_waves`, and `outreach_threads`. |
| `send-outreach` | Database trigger (wave status → `sending`) | For each thread in the wave: generates message via Claude API (using tone profile), sends via appropriate channel (Gmail / Slack / Twilio), updates thread and message records. |
| `scheduling-agent` | `response_monitor` cron job | Receives classified inbound response. Checks calendar availability, proposes or confirms times, selects venues, handles negotiation loop. Writes confirmed meetings to calendar. |
| `wave-advancement` | Database trigger (thread status change) | Evaluates whether current wave is exhausted. If remaining capacity exists, unlocks next wave and triggers `send-outreach`. |
| `calendar-write` | `scheduling-agent` (meeting confirmed) | Creates Google Calendar event on the correct calendar. Adds title, location, description, and optional travel buffer block. |

### 18.6 Supabase Storage Buckets

| Bucket | Access | Purpose |
|---|---|---|
| `tone-samples` | Private (RLS: owner only) | Example outreach emails uploaded during onboarding |
| `crm-schema-docs` | Private (RLS: owner only) | Schema instruction documents for custom MCP CRM integrations |

### 18.7 Database Functions

```sql
-- Custom auth.uid() function that reads Firebase uid from request header
-- This bridges Firebase Auth → Supabase RLS
CREATE OR REPLACE FUNCTION auth.uid() RETURNS uuid AS $
  SELECT COALESCE(
    current_setting('request.jwt.claims', true)::json->>'sub',
    current_setting('request.headers', true)::json->>'x-firebase-uid'
  )::uuid;
$ LANGUAGE sql STABLE;

-- Helper: Get resolved instruction value (trip → user → system fallback)
CREATE OR REPLACE FUNCTION get_instruction(
  p_user_id uuid,
  p_trip_id uuid,
  p_category text,
  p_instruction_key text
) RETURNS jsonb AS $
  SELECT instruction_value FROM instruction_sets
  WHERE (
    (scope = 'trip' AND trip_id = p_trip_id)
    OR (scope = 'user' AND user_id = p_user_id)
    OR (scope = 'system')
  )
  AND category = p_category
  AND instruction_key = p_instruction_key
  AND is_active = true
  ORDER BY
    CASE scope
      WHEN 'trip' THEN 1
      WHEN 'user' THEN 2
      WHEN 'system' THEN 3
    END
  LIMIT 1;
$ LANGUAGE sql STABLE;
```
