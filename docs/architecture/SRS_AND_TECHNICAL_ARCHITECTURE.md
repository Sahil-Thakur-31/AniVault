# AniVault: Software Requirements Specification (SRS) & Detailed Technical Architecture

**Document Version:** 1.0.0  
**Status:** Approved Architecture Baseline (Single Source of Truth)  
**Target Systems:** Web, Android (App + Widgets), iOS (App + WidgetKit), Windows (Tauri 2), macOS (Tauri 2)  
**Primary Tech Stack:** TypeScript, NestJS, PostgreSQL 16, Redis 7, Prisma ORM, BullMQ, React (Vite), React Native (Expo)

---

## Table of Contents
1. [Functional & Non-Functional Requirements](#1-functional--non-functional-requirements)
2. [Complete Screen & Navigation Specifications](#2-complete-screen--navigation-specifications)
3. [Database Entity-Relationship (ER) Architecture](#3-database-entity-relationship-er-architecture)
4. [Detailed PostgreSQL Production Schema (DDL)](#4-detailed-postgresql-production-schema-ddl)
5. [Complete REST API Endpoint Specifications](#5-complete-rest-api-endpoint-specifications)
6. [External Provider Adapter Contracts](#6-external-provider-adapter-contracts)
7. [Two-Way Synchronisation & Conflict Resolution Engine](#7-two-way-synchronisation--conflict-resolution-engine)
8. [Native Home-Screen Widget Interaction Specifications](#8-native-home-screen-widget-interaction-specifications)
9. [JSON & CSV Universal Import/Export Specification](#9-json--csv-universal-importexport-specification)
10. [Security & Deployment Architecture](#10-security--deployment-architecture)
11. [Development Milestones & Acceptance Criteria](#11-development-milestones--acceptance-criteria)

---

## 1. Functional & Non-Functional Requirements

### 1.1 Functional Requirements (FR)

#### Module 1: Hierarchical Unified Media Database
- **FR-1.1 (Franchise Tree Representation):** The system shall represent franchises as top-level canonical roots (`franchises`) aggregating anime series, spin-offs, movies, OVAs, ONAs, specials, manga, and light novels (`media`).
- **FR-1.2 (Explicit Typed Relationships):** The database shall classify media connections via typed graphs (`media_relationships`): `SEQUEL`, `PREQUEL`, `ADAPTATION`, `SIDE_STORY`, `SPIN_OFF`, `ALTERNATE_VERSION`, `CONTAINS`, `RELATED`.
- **FR-1.3 (Multi-Provider Identity Mapping):** Media items must support arbitrary 1:N external identifiers mapped to providers (`AniList`, `MyAnimeList`, `Kitsu`, `AniDB`, `TMDB`) with verified external URLs.
- **FR-1.4 (Universal Relationship & Identity Editor):** Users must be permitted to manually link/unlink media to franchises, override detected parent-child hierarchies, map mismatched provider IDs, and correct episode counts without losing remote provider sync bindings.

#### Module 2: Personal Library & Dual-Track Tracking
- **FR-2.1 (Decoupled Anime & Manga Systems):** Anime and manga records for the same franchise or title must maintain fully independent statuses, counters, and histories. Updating manga chapter progress must never overwrite or modify anime episode status.
- **FR-2.2 (Anime Tracking Attributes):** Track Status (`PLANNING`, `WATCHING`, `COMPLETED`, `ON_HOLD`, `DROPPED`, `REWATCHING`), Current Episode, Total Episodes, Start/Finish dates, Personal Score (decimal 0.0–10.0, 100-pt, or 5-star), Rewatch count, and rich text Notes.
- **FR-2.3 (Manga Tracking Attributes):** Track Status (`PLANNING`, `READING`, `COMPLETED`, `ON_HOLD`, `DROPPED`, `REREADING`), Current Chapter, Current Volume, Total Chapters/Volumes, Start/Finish dates, Score, Reread count, and Notes.
- **FR-2.4 (Two-Tier Progress Rollup):** Display real-time franchise-level completion percentages computed from child media components. Users can selectively toggle whether movies, specials, or spin-offs count toward canonical franchise completion.
- **FR-2.5 (Batch Status Cascading):** Users can mark an entire season or franchise as `COMPLETED` in a single transaction, setting all constituent episodes to completed while recording a single bulk audit event.

#### Module 3: External Platform Integrations
- **FR-3.1 (Multi-Account OAuth2 Binding):** The system shall support connecting multiple simultaneous tracking platforms (AniList, MyAnimeList) per user with encrypted token storage.
- **FR-3.2 (Metadata Enrichment):** Ingest auxiliary metadata (posters, backdrops, cast, character lists, studios, airing status) from Kitsu, AniDB, and TMDB.
- **FR-3.3 (Rate-Limit & Quota Compliance):** Enforce strict per-provider token bucket throttling (AniList: 90 req/min normal, 30 req/min degraded; MAL: 2 req/sec).

#### Module 4: Two-Way Synchronisation Engine
- **FR-4.1 (Offline-First Event Logging):** Local user actions on any client (Mobile, Web, Desktop, Widget) must immediately commit to local storage and push an immutable event to the pending sync queue.
- **FR-4.2 (Configurable Directionality):** Provide granular per-provider sync modes: Bidirectional (`TWO_WAY`), Push-Only (`EXPORT_ONLY`), or Pull-Only (`IMPORT_ONLY`).
- **FR-4.3 (Deterministic Conflict Resolution):** When remote status differs from local state, apply configurable conflict resolution policies:
  1. *AniVault Master*: AniVault progress always overrides remote providers.
  2. *Highest Watermark*: Maximum episode/chapter count wins.
  3. *Provider Wins*: Remote provider state overrides local.
  4. *Manual Intervention*: Halt sync for that title and prompt the user in the Conflict Resolution UI.

#### Module 5: Native Home-Screen Widgets
- **FR-5.1 (Direct Increment Actions):** Android AppWidgets (Glance) and iOS Widgets (WidgetKit + App Intents) must execute `+1 Episode` and `+1 Chapter` actions directly without opening the main application window.
- **FR-5.2 (Widget Archetypes):** Provide 5 distinct widget types:
  1. *Quick Tracker*: Current title, poster, episode progress bar, `[ -1 ]` and `[ +1 ]` buttons.
  2. *Currently Watching*: List of top 3-5 active series with quick increment buttons.
  3. *Continue Watching/Reading Combo*: Unified card displaying current anime on top, current manga on bottom.
  4. *Random Picker*: Generates random title from `PLANNING` list with "Start Watching" deep link.
  5. *Personal Statistics*: Real-time counters of anime completed, episodes watched, manga chapters read, and active watch streak.

#### Module 6 & 7: Universal Import, Export & Backup
- **FR-6.1 (Full-Fidelity JSON Backup):** Export the complete personal library, custom metadata, relationships, activity logs, and provider mappings as a versioned JSON document (`schemaVersion: 1.0.0`).
- **FR-6.2 (Direct Platform Ingestion):** Ingest native export files from AniList (JSON/GraphQL dump) and MyAnimeList (XML/Gz).
- **FR-6.3 (Duplicate Detection Pipeline):** Use external provider IDs, normalized title tokens, and Levenshtein similarity to detect existing library entries before inserting duplicates.
- **FR-6.4 (Transactional Dry-Run & Rollback):** Execute bulk imports in `DRY_RUN` mode to generate a diff report. Real imports must run in atomic database transactions with 1-click batch rollback capability.

#### Module 8–12: Advanced Platform Features
- **FR-8.1 (Contextual Recommendations):** Vector/tag-based recommendations derived from completed titles, filtering out titles already tracked.
- **FR-9.1 (Comprehensive Analytics & Wrapped):** Compute total watch time (in days/hours/minutes), episodes/day average, genre radar breakdown, rating histograms, and generate an annual "Anime Wrapped" report.
- **FR-10.1 (Release Calendar):** Airing schedule calendar with episode countdown timers, source attribution, and confidence flags (`CONFIRMED`, `ESTIMATED`).
- **FR-11.1 (Immutable Activity History):** Detailed chronological audit trail recording every progress update, score revision, and external sync event.
- **FR-12.1 (Spoiler Protection Engine):** Progress-aware filtering that blurs episode descriptions, thumbnails, and comments for any episode beyond the user's current progress.

---

### 1.2 Non-Functional Requirements (NFR)

- **NFR-1 (Performance & Latency):**
  - REST API response time for p95 read requests must be `< 80ms`.
  - Local widget tap-to-update optimistic latency must be `< 16ms` (sub-frame rendering).
  - Bulk import processing speed: `>= 500 entries/sec` during staging validation.
- **NFR-2 (Offline Availability & Resilience):**
  - Clients must maintain 100% read/write functionality for library management while disconnected.
  - Pending mutations must survive app kills, OS memory reclaims, and device reboots via persistent SQLite outbox queue.
- **NFR-3 (Data Integrity & ACID Guarantees):**
  - All library and sync state transitions must execute within PostgreSQL transactions with `READ COMMITTED` isolation level.
  - Foreign key cascades and uniqueness constraints must strictly prevent orphan progress records or duplicate external provider links.
- **NFR-4 (Security & Privacy):**
  - External OAuth2 access tokens and refresh tokens must be encrypted at rest using AES-256-GCM.
  - User passwords hashed using Argon2id (`m=65536, t=3, p=4`).
  - No client-side exposure of third-party API client secrets.
  - Full adherence to data exportability and immediate account purge (GDPR Article 17 / CCPA).
- **NFR-5 (Cross-Platform Parity):**
  - 100% shared business logic, domain models, validation schemas (Zod), and API client across Web, Android, iOS, Windows, and macOS via monorepo packages.

---

## 2. Complete Screen & Navigation Specifications

### 2.1 Navigation Hierarchy & Information Architecture

```
[ App Shell: Responsive Navigation ]
├── Mobile: Persistent Bottom Navigation Bar (5 tabs) + Top Action Bar
└── Desktop / Web: Collapsible Left Sidebar (240px wide) + Top Search & Global Sync Status Bar
    │
    ├── 1.0 Home Dashboard (`/dashboard`)
    ├── 2.0 My Library (`/library`)
    │   ├── Sub-view: Anime Grid/List (`/library/anime`)
    │   └── Sub-view: Manga Grid/List (`/library/manga`)
    ├── 3.0 Franchise Hub (`/franchises`)
    │   └── 3.1 Franchise Detail (`/franchises/:franchiseId`)
    ├── 4.0 Media Detail (`/media/:mediaId`)
    │   ├── 4.1 Relationship Graph View
    │   └── 4.2 Episode/Chapter Progress Inspector
    ├── 5.0 Discover & Recommendations (`/discover`)
    ├── 6.0 Airing Calendar (`/calendar`)
    ├── 7.0 Analytics & Wrapped (`/stats`)
    ├── 8.0 Activity History Log (`/activity`)
    ├── 9.0 Import & Export Hub (`/import-export`)
    └── 10.0 Settings & Integrations (`/settings`)
        ├── 10.1 Connected Accounts & Sync (`/settings/integrations`)
        ├── 10.2 Conflict Resolution Center (`/settings/conflicts`)
        ├── 10.3 Widget Configuration (`/settings/widgets`)
        └── 10.4 Universal Relationship & Identity Editor (`/settings/identity-editor`)
```

### 2.2 Screen Detailed Specifications

#### Screen 1: Home Dashboard (`/dashboard`)
- **Header Section:** Dynamic greeting based on time of day, user avatar, global sync status indicator (Pill badge: `All Synced [Green]`, `Syncing (3 items) [Blue Spinner]`, or `Conflicts Detected (1) [Amber]`).
- **Continue Watching (Carousel/Grid):**
  - Displays top 6 media items with status `WATCHING` sorted by `last_watched_at DESC`.
  - Item Card: Poster thumbnail (aspect 2:3), title, current progress (`Ep 11 / 24`), visual progress bar, quick increment button `[ +1 ]`, and quick dropdown to jump to custom episode.
- **Continue Reading:** Parallel carousel for `READING` manga titles with chapter incrementation.
- **Up Next / Upcoming Airing Widget:** Compact horizontal card showing the next scheduled episode release from the user's watching list with a live countdown timer (`in 2h 14m`).
- **Quick Statistics Bar:** 4 metric cards: Total Anime Watched, Episodes Logged This Month, Total Manga Chapters, Current Active Streak (e.g., `🔥 14 Days`).

#### Screen 2: My Library (`/library`)
- **Header Controls:** Segmented tab control: `All | Anime | Manga`.
- **Status Filter Chips:** Horizontal scrolling pill filters: `All`, `Watching/Reading (Active)`, `Completed`, `Planning`, `On Hold`, `Dropped`.
- **Secondary Filters & Sort Toolbar:**
  - Format dropdown (`TV`, `Movie`, `OVA`, `Manga`, `Light Novel`).
  - Genre multi-select modal.
  - Sorting: `Last Updated`, `Alphabetical (A-Z)`, `Score (High to Low)`, `Release Year`, `Progress %`.
  - View Toggle: `Compact Grid`, `Detailed Grid (with synopses)`, `Dense Table/Spreadsheet View`.
  - Search Input: Debounced real-time search filtering local cache.
- **Bulk Selection Mode:** Checkboxes on items enabling batch status changes, batch tagging, or batch deletion.

#### Screen 3: Franchise Detail (`/franchises/:franchiseId`)
- **Hero Banner:** High-resolution franchise backdrop image, franchise title, Romanized/Japanese titles, overall franchise completion meter (e.g., `Naruto Franchise: 84% Completed`).
- **Completion Configuration Drawer:** User can toggle checklist items: `[x] Main Series`, `[x] Shippuden`, `[x] Manga`, `[ ] Non-canon Movies (Excluded from %)`
- **Hierarchical Media Tree:**
  - **Main Story Arc (Accordion):** Cards for Season 1, Season 2, etc., showing individual watch statuses.
  - **Sequels & Pre-sequels (Accordion):** Explicitly connected sequel series with badges.
  - **Theatrical Movies (Grid):** Poster cards for all movies with watch toggle.
  - **OVAs / ONAs / Specials (List):** Compact list with quick watch checkboxes.
  - **Manga & Print Publications (Grid):** Original manga, gaiden, light novels with chapter progress bars.
  - **Spin-Offs & Alternate Universes:** Clear visual separation from the canonical timeline.
- **Relationship Editor Shortcut:** Button opening modal to re-assign or attach additional media to this franchise.

#### Screen 4: Media Detail (`/media/:mediaId`)
- **Media Header:** Large cover art, studio badges, format pill (`TV - 24 min`), airing period, average public score vs personal score.
- **Personal Progress Control Card:**
  - Status selector dropdown (`Watching`, `Completed`, etc.).
  - Stepper controls: `[ - ] Ep 11 / 24 [ + ]`.
  - Progress slider for rapid seeking.
  - "Complete Season" button (prompts: "Mark all 24 episodes completed?").
  - Rating widget (Customizable: 10-point slider, 100-point input, or 5 stars).
  - Rewatch/Reread count stepper (`Rewatched: 2x`).
  - Personal notes text area with Markdown support.
- **Episode Guide Grid:**
  - List/Grid of all episodes with titles, airing dates, and filler tags (`Canon`, `Anime Canon`, `Manga Canon`, `Filler`).
  - Checkbox per episode. Clicking an episode allows toggling individual watch status.
  - **Spoiler Guard:** Synopsis text and screenshot blurred if episode number > user's current progress.
- **External Database Links:** Direct badges linking to AniList, MyAnimeList, Kitsu, AniDB, and TMDB profiles with verification timestamps.

#### Screen 5: Integrations & Conflict Resolution Hub (`/settings/integrations`)
- **Connected Services Grid:**
  - Service Cards for **AniList**, **MyAnimeList**, **Kitsu**.
  - Card displays: Connected username, avatar, connection state badge (`Connected`, `Token Expired`, `Error`), last sync timestamp.
  - Directionality toggle: `Two-Way (Bidirectional)`, `Push to Service`, `Pull from Service`.
  - Actions: `[Sync Now]`, `[Pause Sync]`, `[Disconnect Account]`.
- **Conflict Notification Banner:** Highlighted when discrepancies exist between AniVault and external platforms.
- **Conflict Resolution Modal:**
  - Side-by-side diff comparison:
    ```
    Title: Bleach: Thousand-Year Blood War
    Field: Episode Progress
    ┌────────────────┬──────────────┬────────────────┐
    │ AniVault (Local)│ AniList      │ MyAnimeList    │
    │ Ep 13 [Master] │ Ep 14        │ Ep 11          │
    └────────────────┴──────────────┴────────────────┘
    [x] Keep AniVault (Ep 13) and overwrite remote services
    [ ] Accept Highest (Ep 14) and update AniVault + MAL
    [ ] Select Custom Episode: [ 13 ]
    [Confirm Resolution]
    ```

#### Screen 6: Universal Import/Export Hub (`/import-export`)
- **Export Panel:**
  - Format selection: `AniVault Full JSON Backup (Recommended)`, `Universal CSV (Spreadsheet)`, `MAL XML Format`.
  - Options: `Include Custom Notes`, `Include Full Activity History`, `Include External ID Mappings`.
  - Action: `[Generate & Download Backup]`.
- **Import Panel:**
  - Drag-and-drop zone supporting `.json`, `.csv`, `.xml`.
  - Direct account import buttons (`Import directly from AniList OAuth`, `Import directly from MAL OAuth`).
  - **Dry-Run Inspection View:**
    - Summary banner: `Will Add: 142 titles | Will Update: 8 titles | Potential Duplicates: 3 | Unrecognized: 0`.
    - Detailed diff table with interactive checkboxes to exclude specific items before committing.
  - Action: `[Commit Import (Atomic Transaction)]` with batch transaction rollback token.

---

## 3. Database Entity-Relationship (ER) Architecture

The database is built on relational integrity in PostgreSQL 16, utilizing JSONB specifically for semi-structured third-party payload caching while keeping all core domain logic strictly relational.

```mermaid
erDiagram
    users ||--o{ user_preferences : has
    users ||--o{ connected_accounts : owns
    users ||--o{ user_library : tracks
    users ||--o{ user_activity : logs
    users ||--o{ sync_jobs : schedules
    users ||--o{ import_jobs : executes
    users ||--o{ widget_configs : configures

    franchises ||--o{ media : groups
    
    media ||--o{ media_relationships : source_for
    media ||--o{ media_relationships : target_of
    media ||--o{ media_external_ids : identified_by
    media ||--o{ seasons : contains
    media ||--o{ episodes : has
    media ||--o{ chapters : has
    media ||--o{ volumes : has
    media ||--o{ user_library : tracked_in

    user_library ||--|| user_progress : maintains
    user_library ||--o{ user_ratings : scores

    connected_accounts ||--o{ sync_jobs : triggers
    sync_jobs ||--o{ sync_logs : produces
    import_jobs ||--o{ import_errors : records

    users {
        uuid id PK
        string email UK
        string password_hash
        string username UK
        string avatar_url
        boolean is_active
        timestamp created_at
        timestamp updated_at
    }

    franchises {
        uuid id PK
        string canonical_title
        string original_title
        text description
        string banner_url
        timestamp created_at
        timestamp updated_at
    }

    media {
        uuid id PK
        uuid franchise_id FK
        enum media_type
        enum media_format
        string title_romaji
        string title_english
        string title_native
        text synopsis
        string cover_image_url
        string banner_image_url
        enum airing_status
        date start_date
        date end_date
        int total_episodes
        int total_chapters
        int total_volumes
        int duration_minutes
        jsonb genres
        jsonb studios
        boolean is_adult
        timestamp created_at
        timestamp updated_at
    }

    media_relationships {
        uuid id PK
        uuid source_media_id FK
        uuid target_media_id FK
        enum relationship_type
        boolean is_canonical
        text notes
        timestamp created_at
    }

    media_external_ids {
        uuid id PK
        uuid media_id FK
        enum provider
        string external_id
        string external_url
        timestamp last_verified_at
    }

    user_library {
        uuid id PK
        uuid user_id FK
        uuid media_id FK
        enum status
        boolean is_favorite
        boolean is_private
        int rewatch_reread_count
        date started_at
        date completed_at
        text personal_notes
        jsonb custom_tags
        timestamp last_interacted_at
        timestamp created_at
        timestamp updated_at
    }

    user_progress {
        uuid id PK
        uuid user_library_id FK
        int current_episode
        int current_chapter
        int current_volume
        int progress_percentage
        boolean is_completed
        timestamp updated_at
    }

    user_ratings {
        uuid id PK
        uuid user_library_id FK
        decimal score
        enum rating_system
        text review_text
        timestamp updated_at
    }

    connected_accounts {
        uuid id PK
        uuid user_id FK
        enum provider
        string provider_user_id
        string provider_username
        text access_token_enc
        text refresh_token_enc
        timestamp token_expires_at
        enum sync_direction
        boolean is_sync_enabled
        timestamp last_synced_at
        timestamp created_at
        timestamp updated_at
    }

    sync_jobs {
        uuid id PK
        uuid user_id FK
        uuid connected_account_id FK
        enum status
        jsonb payload_diff
        text error_message
        int retry_count
        timestamp executed_at
    }

    import_jobs {
        uuid id PK
        uuid user_id FK
        enum import_source
        enum status
        int total_records
        int processed_records
        int failed_records
        jsonb report_summary
        timestamp created_at
        timestamp completed_at
    }

    widget_configs {
        uuid id PK
        uuid user_id FK
        string widget_identifier
        enum widget_type
        jsonb configuration_payload
        timestamp updated_at
    }
```

---

## 4. Detailed PostgreSQL Production Schema (DDL)

The following schema represents the production-ready PostgreSQL 16 DDL, including UUID generation, custom types, cascade constraints, composite uniqueness rules, and index optimization.

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- 1. Custom Enumerations
CREATE TYPE media_type_enum AS ENUM ('ANIME', 'MANGA', 'LIGHT_NOVEL');

CREATE TYPE media_format_enum AS ENUM (
    'TV', 'TV_SHORT', 'MOVIE', 'SPECIAL', 'OVA', 'ONA', 'MUSIC',
    'MANGA', 'NOVEL', 'ONE_SHOT'
);

CREATE TYPE airing_status_enum AS ENUM (
    'FINISHED', 'RELEASING', 'NOT_YET_RELEASED', 'CANCELLED', 'HIATUS'
);

CREATE TYPE relationship_type_enum AS ENUM (
    'SEQUEL', 'PREQUEL', 'ADAPTATION', 'SIDE_STORY',
    'SPIN_OFF', 'ALTERNATE_VERSION', 'CONTAINS', 'RELATED'
);

CREATE TYPE library_status_enum AS ENUM (
    'PLANNING', 'WATCHING', 'READING', 'COMPLETED',
    'ON_HOLD', 'DROPPED', 'REWATCHING', 'REREADING'
);

CREATE TYPE rating_system_enum AS ENUM (
    'POINT_10_DECIMAL', 'POINT_100', 'POINT_5_STAR', 'SMILEY_3'
);

CREATE TYPE provider_enum AS ENUM (
    'ANILIST', 'MYANIMELIST', 'KITSU', 'ANIDB', 'TMDB', 'CUSTOM'
);

CREATE TYPE sync_direction_enum AS ENUM (
    'TWO_WAY', 'PUSH_TO_PROVIDER', 'PULL_FROM_PROVIDER'
);

CREATE TYPE job_status_enum AS ENUM (
    'PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'CONFLICT'
);

-- 2. Core Users Table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) NOT NULL UNIQUE,
    username VARCHAR(50) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    avatar_url TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE user_preferences (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    preferred_theme VARCHAR(30) NOT NULL DEFAULT 'midnight',
    rating_system rating_system_enum NOT NULL DEFAULT 'POINT_10_DECIMAL',
    spoiler_protection_level VARCHAR(20) NOT NULL DEFAULT 'STRICT',
    preferred_title_language VARCHAR(10) NOT NULL DEFAULT 'ROMAJI', -- ROMAJI, ENGLISH, NATIVE
    enable_push_notifications BOOLEAN NOT NULL DEFAULT TRUE,
    auto_sync_interval_minutes INT NOT NULL DEFAULT 60,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 3. Franchises & Media Hierarchy
CREATE TABLE franchises (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    canonical_title VARCHAR(255) NOT NULL,
    original_title VARCHAR(255),
    description TEXT,
    banner_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE media (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    franchise_id UUID REFERENCES franchises(id) ON DELETE SET NULL,
    type media_type_enum NOT NULL,
    format media_format_enum NOT NULL,
    title_romaji VARCHAR(255) NOT NULL,
    title_english VARCHAR(255),
    title_native VARCHAR(255),
    synopsis TEXT,
    cover_image_url TEXT,
    banner_image_url TEXT,
    status airing_status_enum NOT NULL DEFAULT 'NOT_YET_RELEASED',
    start_date DATE,
    end_date DATE,
    total_episodes INT,
    total_chapters INT,
    total_volumes INT,
    duration_minutes INT,
    genres JSONB NOT NULL DEFAULT '[]'::jsonb,
    studios JSONB NOT NULL DEFAULT '[]'::jsonb,
    is_adult BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Explicit Typed Relationships between Media Items
CREATE TABLE media_relationships (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    source_media_id UUID NOT NULL REFERENCES media(id) ON DELETE CASCADE,
    target_media_id UUID NOT NULL REFERENCES media(id) ON DELETE CASCADE,
    relationship_type relationship_type_enum NOT NULL,
    is_canonical BOOLEAN NOT NULL DEFAULT TRUE,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_media_pair UNIQUE (source_media_id, target_media_id, relationship_type)
);

-- External Provider Identifier Mappings
CREATE TABLE media_external_ids (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    media_id UUID NOT NULL REFERENCES media(id) ON DELETE CASCADE,
    provider provider_enum NOT NULL,
    external_id VARCHAR(100) NOT NULL,
    external_url TEXT,
    last_verified_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_media_provider UNIQUE (media_id, provider),
    CONSTRAINT unique_provider_external_id UNIQUE (provider, external_id)
);

-- Seasons grouping (for multi-cour series)
CREATE TABLE seasons (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    media_id UUID NOT NULL REFERENCES media(id) ON DELETE CASCADE,
    season_number INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    episode_count INT,
    air_year INT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE episodes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    media_id UUID NOT NULL REFERENCES media(id) ON DELETE CASCADE,
    episode_number INT NOT NULL,
    absolute_number INT,
    title VARCHAR(255),
    synopsis TEXT,
    air_date DATE,
    is_filler BOOLEAN NOT NULL DEFAULT FALSE,
    thumbnail_url TEXT,
    CONSTRAINT unique_media_episode UNIQUE (media_id, episode_number)
);

CREATE TABLE chapters (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    media_id UUID NOT NULL REFERENCES media(id) ON DELETE CASCADE,
    chapter_number NUMERIC(6, 1) NOT NULL,
    volume_number INT,
    title VARCHAR(255),
    release_date DATE,
    CONSTRAINT unique_media_chapter UNIQUE (media_id, chapter_number)
);

-- 4. User Personal Library & Progress Tracking
CREATE TABLE user_library (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    media_id UUID NOT NULL REFERENCES media(id) ON DELETE CASCADE,
    status library_status_enum NOT NULL,
    is_favorite BOOLEAN NOT NULL DEFAULT FALSE,
    is_private BOOLEAN NOT NULL DEFAULT FALSE,
    rewatch_reread_count INT NOT NULL DEFAULT 0,
    started_at DATE,
    completed_at DATE,
    personal_notes TEXT,
    custom_tags JSONB NOT NULL DEFAULT '[]'::jsonb,
    last_interacted_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_user_media UNIQUE (user_id, media_id)
);

CREATE TABLE user_progress (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_library_id UUID NOT NULL UNIQUE REFERENCES user_library(id) ON DELETE CASCADE,
    current_episode INT NOT NULL DEFAULT 0,
    current_chapter NUMERIC(6, 1) NOT NULL DEFAULT 0.0,
    current_volume INT NOT NULL DEFAULT 0,
    progress_percentage NUMERIC(5, 2) NOT NULL DEFAULT 0.00,
    is_completed BOOLEAN NOT NULL DEFAULT FALSE,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE user_ratings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_library_id UUID NOT NULL UNIQUE REFERENCES user_library(id) ON DELETE CASCADE,
    score NUMERIC(4, 2) NOT NULL DEFAULT 0.00,
    rating_system rating_system_enum NOT NULL DEFAULT 'POINT_10_DECIMAL',
    review_text TEXT,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE user_activity (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    media_id UUID NOT NULL REFERENCES media(id) ON DELETE CASCADE,
    event_type VARCHAR(50) NOT NULL, -- EPISODE_WATCHED, CHAPTER_READ, STATUS_CHANGED, RATING_UPDATED
    field_changed VARCHAR(50) NOT NULL,
    old_value TEXT,
    new_value TEXT,
    source_client VARCHAR(30) NOT NULL, -- WEB, ANDROID_APP, ANDROID_WIDGET, IOS_WIDGET, SYNC_PULL
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 5. External Account Connections & Synchronization
CREATE TABLE connected_accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    provider provider_enum NOT NULL,
    provider_user_id VARCHAR(100) NOT NULL,
    provider_username VARCHAR(100) NOT NULL,
    access_token_enc TEXT NOT NULL,
    refresh_token_enc TEXT,
    token_expires_at TIMESTAMPTZ,
    sync_direction sync_direction_enum NOT NULL DEFAULT 'TWO_WAY',
    is_sync_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    last_synced_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_user_provider UNIQUE (user_id, provider)
);

CREATE TABLE sync_jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    connected_account_id UUID NOT NULL REFERENCES connected_accounts(id) ON DELETE CASCADE,
    media_id UUID REFERENCES media(id) ON DELETE SET NULL,
    status job_status_enum NOT NULL DEFAULT 'PENDING',
    direction sync_direction_enum NOT NULL,
    payload_diff JSONB NOT NULL DEFAULT '{}'::jsonb,
    error_message TEXT,
    retry_count INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    executed_at TIMESTAMPTZ
);

CREATE TABLE sync_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sync_job_id UUID REFERENCES sync_jobs(id) ON DELETE SET NULL,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    provider provider_enum NOT NULL,
    level VARCHAR(20) NOT NULL, -- INFO, WARN, ERROR, CONFLICT
    message TEXT NOT NULL,
    details JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 6. Bulk Imports & Staging
CREATE TABLE import_jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    import_source VARCHAR(50) NOT NULL, -- JSON_FILE, CSV_FILE, ANILIST_OAUTH, MAL_OAUTH
    status job_status_enum NOT NULL DEFAULT 'PENDING',
    total_records INT NOT NULL DEFAULT 0,
    processed_records INT NOT NULL DEFAULT 0,
    failed_records INT NOT NULL DEFAULT 0,
    report_summary JSONB NOT NULL DEFAULT '{}'::jsonb,
    rollback_token UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMPTZ
);

CREATE TABLE import_errors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    import_job_id UUID NOT NULL REFERENCES import_jobs(id) ON DELETE CASCADE,
    row_index INT,
    raw_payload JSONB,
    error_reason TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 7. Native Widgets Configuration
CREATE TABLE widget_configs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    widget_identifier VARCHAR(100) NOT NULL,
    widget_type VARCHAR(50) NOT NULL,
    configuration_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_user_widget UNIQUE (user_id, widget_identifier)
);

-- 8. Performance Indexes
CREATE INDEX idx_media_franchise_id ON media(franchise_id);
CREATE INDEX idx_media_type_format ON media(type, format);
CREATE INDEX idx_media_status ON media(status);
CREATE INDEX idx_media_title_romaji_trgm ON media USING gin (title_romaji gin_trgm_ops);
CREATE INDEX idx_media_title_english_trgm ON media USING gin (title_english gin_trgm_ops);
CREATE INDEX idx_media_external_lookup ON media_external_ids(provider, external_id);

CREATE INDEX idx_user_library_user_status ON user_library(user_id, status);
CREATE INDEX idx_user_library_media ON user_library(media_id);
CREATE INDEX idx_user_library_last_interacted ON user_library(user_id, last_interacted_at DESC);
CREATE INDEX idx_user_activity_user_created ON user_activity(user_id, created_at DESC);
CREATE INDEX idx_sync_jobs_status_retry ON sync_jobs(status, retry_count) WHERE status = 'PENDING';

-- 9. Automatic Updated_At Trigger Function
CREATE OR REPLACE FUNCTION set_updated_at_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION set_updated_at_timestamp();
CREATE TRIGGER trg_user_preferences_updated_at BEFORE UPDATE ON user_preferences FOR EACH ROW EXECUTE FUNCTION set_updated_at_timestamp();
CREATE TRIGGER trg_franchises_updated_at BEFORE UPDATE ON franchises FOR EACH ROW EXECUTE FUNCTION set_updated_at_timestamp();
CREATE TRIGGER trg_media_updated_at BEFORE UPDATE ON media FOR EACH ROW EXECUTE FUNCTION set_updated_at_timestamp();
CREATE TRIGGER trg_user_library_updated_at BEFORE UPDATE ON user_library FOR EACH ROW EXECUTE FUNCTION set_updated_at_timestamp();
CREATE TRIGGER trg_user_progress_updated_at BEFORE UPDATE ON user_progress FOR EACH ROW EXECUTE FUNCTION set_updated_at_timestamp();
CREATE TRIGGER trg_user_ratings_updated_at BEFORE UPDATE ON user_ratings FOR EACH ROW EXECUTE FUNCTION set_updated_at_timestamp();
CREATE TRIGGER trg_connected_accounts_updated_at BEFORE UPDATE ON connected_accounts FOR EACH ROW EXECUTE FUNCTION set_updated_at_timestamp();
CREATE TRIGGER trg_widget_configs_updated_at BEFORE UPDATE ON widget_configs FOR EACH ROW EXECUTE FUNCTION set_updated_at_timestamp();
```

---

## 5. Complete REST API Endpoint Specifications

All endpoints are prefixed with `/api/v1` and require header `Authorization: Bearer <access_token>` unless marked `Public`.

### 5.1 Authentication & User Management
| Method | Endpoint | Description | Request Body | Response (200/201) |
|---|---|---|---|---|
| `POST` | `/auth/register` (Public) | Create user account | `{ email, username, password }` | `{ user: { id, email, username }, accessToken }` |
| `POST` | `/auth/login` (Public) | Authenticate user | `{ email, password }` | `{ user, accessToken }` (Sets HTTP-only refresh cookie) |
| `POST` | `/auth/refresh` (Public) | Refresh expired access token | Cookie: `refreshToken` | `{ accessToken }` |
| `POST` | `/auth/logout` | Revoke session & clear cookie | None | `{ success: true }` |
| `GET` | `/users/me` | Fetch authenticated profile | None | `{ user, preferences }` |
| `PATCH` | `/users/me/preferences` | Update display & sync settings | `{ preferredTheme, ratingSystem, spoilerProtectionLevel }` | Updated preferences |

### 5.2 Franchises & Hierarchical Media
| Method | Endpoint | Description | Query / Body Params | Response |
|---|---|---|---|---|
| `GET` | `/franchises` | List franchises with pagination | `?page=1&limit=20&search=naruto` | `{ data: Franchise[], pagination }` |
| `POST` | `/franchises` | Create new canonical franchise | `{ canonicalTitle, originalTitle, description }` | Created `Franchise` |
| `GET` | `/franchises/:id` | Full tree of media in franchise | None | `FranchiseTree` (contains anime, manga, movies, relations) |
| `GET` | `/franchises/:id/progress` | User completion rollup | None | `{ totalItems, completedItems, percentage, components: [] }` |
| `PATCH` | `/franchises/:id` | Update franchise details | `{ canonicalTitle, description, bannerUrl }` | Updated `Franchise` |
| `DELETE` | `/franchises/:id` | Remove franchise (unbinds media) | None | `{ success: true }` |

### 5.3 Media Catalogue & Relationships
| Method | Endpoint | Description | Query / Body Params | Response |
|---|---|---|---|---|
| `GET` | `/media` | Search & filter media catalogue | `?type=ANIME&format=TV&status=RELEASING&q=bleach` | `{ data: Media[], pagination }` |
| `POST` | `/media` | Manual media entry creation | `{ type, format, titleRomaji, totalEpisodes, ... }` | Created `Media` |
| `GET` | `/media/:id` | Detailed media entry with episodes | None | `MediaDetail` |
| `PATCH` | `/media/:id` | Update metadata or episode count | `{ totalEpisodes, status, synopsis }` | Updated `Media` |
| `POST` | `/media/:id/relationships` | Link two media items | `{ targetMediaId, relationshipType, isCanonical }` | `MediaRelationship` |
| `DELETE` | `/media/relationships/:id` | Remove relationship link | None | `{ success: true }` |
| `POST` | `/media/:id/external-ids` | Map external provider ID | `{ provider: 'ANILIST', externalId: '1735' }` | `MediaExternalId` |

### 5.4 Personal Library & Progress Operations
| Method | Endpoint | Description | Request Body | Response |
|---|---|---|---|---|
| `GET` | `/library` | User's tracked media items | `?type=ANIME&status=WATCHING&page=1` | `{ data: UserLibraryItem[], pagination }` |
| `POST` | `/library` | Add media to personal library | `{ mediaId, status, score?, currentProgress? }` | `UserLibraryItem` |
| `PATCH` | `/library/:libraryId` | Update tracking status / notes | `{ status: 'COMPLETED', score: 9.5, personalNotes }` | Updated `UserLibraryItem` |
| `DELETE` | `/library/:libraryId` | Remove item from library | None | `{ success: true }` |
| `PATCH` | `/library/:libraryId/progress` | Increment or set episode/chapter | `{ currentEpisode?: 12, currentChapter?: 85.0 }` | `{ progress: UserProgress, syncedProviders: [] }` |
| `POST` | `/library/:libraryId/complete-batch` | Mark all episodes completed | None | `{ status: 'COMPLETED', progress: { currentEpisode: 24 } }` |

### 5.5 Integrations & Two-Way Sync
| Method | Endpoint | Description | Request Body | Response |
|---|---|---|---|---|
| `GET` | `/integrations` | List user connected accounts | None | `ConnectedAccountStatus[]` |
| `GET` | `/integrations/:provider/auth-url` | Generate OAuth2 initiation URL | None | `{ authorizationUrl, state }` |
| `POST` | `/integrations/:provider/callback` | Exchange OAuth2 code for tokens | `{ code, state }` | `{ provider, username, connected: true }` |
| `PATCH` | `/integrations/:provider/settings` | Update sync direction / toggle | `{ syncDirection: 'TWO_WAY', isSyncEnabled: true }` | `ConnectedAccount` |
| `POST` | `/integrations/:provider/sync` | Trigger immediate manual sync | None | `{ jobId, status: 'QUEUED' }` |
| `DELETE` | `/integrations/:provider` | Disconnect and revoke tokens | None | `{ success: true }` |
| `GET` | `/sync/conflicts` | List unresolved sync conflicts | None | `SyncConflict[]` |
| `POST` | `/sync/conflicts/resolve` | Submit conflict resolution | `{ conflictId, resolutionStrategy: 'ANI_VAULT_WINS' }` | `{ success: true }` |
| `POST` | `/sync/events/batch` | Flush mobile offline events | `{ events: SyncMutationEvent[] }` | `{ processed: 4, rejected: 0 }` |

### 5.6 Bulk Import & Export
| Method | Endpoint | Description | Request Body / Query | Response |
|---|---|---|---|---|
| `POST` | `/import/upload` | Upload import file for staging | `multipart/form-data` (file: `.json`/`.csv`) | `{ importJobId, totalRecords, preview: [] }` |
| `GET` | `/import/:jobId/preview` | Detailed dry-run diff report | None | `ImportPreviewDiff` |
| `POST` | `/import/:jobId/commit` | Execute atomic import transaction | `{ applyDuplicateRules: 'MERGE_UPDATE' }` | `{ status: 'COMPLETED', rollbackToken }` |
| `POST` | `/import/:jobId/rollback` | Rollback executed import batch | `{ rollbackToken }` | `{ revertedRecords: 142 }` |
| `GET` | `/export/json` | Full library backup JSON download | `?includeNotes=true&includeHistory=true` | JSON File Stream (`attachment`) |
| `GET` | `/export/csv` | Flat CSV table download | `?type=ANIME` | CSV File Stream (`attachment`) |

### 5.7 Native Widget Support Endpoints
| Method | Endpoint | Description | Request / Query | Response |
|---|---|---|---|---|
| `GET` | `/widgets/data/quick-tracker` | Minimal payload for widget | `?widgetId=xxx` | `{ title, episode, maxEpisodes, posterBase64, progressPct }` |
| `POST` | `/widgets/actions/increment` | Direct increment from widget | `{ mediaId, incrementField: 'EPISODE', delta: 1 }` | `{ newProgress: 12, maxEpisodes: 24, syncStatus: 'PENDING' }` |
| `GET` | `/widgets/data/watching-list` | Top 4 active entries for widget | None | `WidgetMediaListItem[]` |

---

## 6. External Provider Adapter Contracts

To prevent tight coupling to AniList or MyAnimeList, all external integrations implement standardized TypeScript adapter contracts.

```typescript
// packages/domain/src/interfaces/provider-adapter.interface.ts

export interface ProviderAuthTokens {
  accessToken: string;
  refreshToken?: string;
  expiresAt?: Date;
  tokenType: string;
  scope?: string[];
}

export interface CanonicalMediaSearchResult {
  provider: 'ANILIST' | 'MYANIMELIST' | 'KITSU' | 'ANIDB' | 'TMDB';
  externalId: string;
  titleRomaji: string;
  titleEnglish?: string;
  titleNative?: string;
  type: 'ANIME' | 'MANGA';
  format: string;
  totalEpisodes?: number;
  totalChapters?: number;
  airingStatus: string;
  coverImageUrl?: string;
  bannerImageUrl?: string;
  synopsis?: string;
}

export interface UserRemoteListItem {
  externalId: string;
  status: 'PLANNING' | 'WATCHING' | 'READING' | 'COMPLETED' | 'ON_HOLD' | 'DROPPED';
  progressEpisodes?: number;
  progressChapters?: number;
  progressVolumes?: number;
  scoreDecimal?: number;
  startedAt?: Date;
  completedAt?: Date;
  updatedAt: Date;
}

export interface IMediaMetadataProvider {
  readonly providerName: string;
  
  searchMedia(query: string, type: 'ANIME' | 'MANGA', limit?: number): Promise<CanonicalMediaSearchResult[]>;
  fetchMediaById(externalId: string): Promise<CanonicalMediaSearchResult>;
  fetchAiringSchedule(startDate: Date, endDate: Date): Promise<any[]>;
}

export interface ISyncPlatformProvider extends IMediaMetadataProvider {
  generateAuthUrl(state: string, codeChallenge?: string): string;
  exchangeAuthCode(code: string, codeVerifier?: string): Promise<ProviderAuthTokens>;
  refreshTokens(refreshToken: string): Promise<ProviderAuthTokens>;
  
  getUserProfile(tokens: ProviderAuthTokens): Promise<{ userId: string; username: string; avatarUrl?: string }>;
  fetchUserLibrary(tokens: ProviderAuthTokens): Promise<UserRemoteListItem[]>;
  
  pushProgressUpdate(
    tokens: ProviderAuthTokens,
    externalId: string,
    progress: { currentEpisode?: number; currentChapter?: number; status?: string }
  ): Promise<{ success: boolean; remoteUpdatedAt: Date }>;

  pushRatingUpdate(
    tokens: ProviderAuthTokens,
    externalId: string,
    score: number
  ): Promise<{ success: boolean }>;
}
```

### 6.1 Provider Characteristics & Rate Limit Management

```mermaid
flowchart LR
    Worker[Sync Engine Worker] --> Limiter{Provider Token Bucket}
    Limiter -->|AniList (90/min)| AniListAPI[AniList GraphQL Endpoint]
    Limiter -->|MAL (2/sec)| MALAPI[MyAnimeList REST v2 Endpoint]
    Limiter -->|Kitsu (10/sec)| KitsuAPI[Kitsu JSON:API]
    Limiter -->|TMDB (40/10s)| TMDBAPI[TMDB REST Endpoint]
```

- **AniList Adapter (`AniListProvider`):**
  - **Protocol:** GraphQL over HTTPS (`https://graphql.anilist.co`).
  - **Rate Limiter:** Leaky Bucket configured for 90 requests/60s. Automatically downshifts to 30 req/min upon receiving `X-RateLimit-Remaining: 0` or HTTP 429.
  - **Token Handling:** Access tokens expire after 365 days; no refresh token supplied. Token expiry is monitored, notifying users at 330 days.
- **MyAnimeList Adapter (`MALProvider`):**
  - **Protocol:** REST v2 with OAuth2 + PKCE (`code_challenge_method=plain/S256`).
  - **Rate Limiter:** Token bucket capped at 2 requests per second.
  - **Token Handling:** Access tokens valid for 30 days. Uses `refresh_token` rotation with automatic backoff retry.
- **Data Field Transformation Matrix:**

| AniVault Canonical Field | AniList GraphQL Field | MyAnimeList v2 REST Field |
|---|---|---|
| `media_id` (Mapped) | `Media.id` (Int) | `node.id` (Int) |
| `status: WATCHING` | `MediaListStatus.CURRENT` | `status: "watching"` |
| `status: PLANNING` | `MediaListStatus.PLANNING` | `status: "plan_to_watch"` |
| `status: COMPLETED`| `MediaListStatus.COMPLETED`| `status: "completed"` |
| `current_episode` | `progress` (Int) | `num_episodes_watched` (Int) |
| `current_chapter` | `progress` (Int) | `num_chapters_read` (Int) |
| `score (0-10)` | `score(format: POINT_10_DECIMAL)`| `score` (0-10 int) |

---

## 7. Two-Way Synchronisation & Conflict Resolution Engine

The synchronization engine operates under an **Offline-First Event-Sourced Outbox Architecture**.

```mermaid
sequenceDiagram
    autonumber
    actor User
    participant Widget as Native Mobile Widget
    participant LocalDB as Local SQLite Outbox
    participant NetMonitor as Connectivity Observer
    participant API as AniVault API Server
    participant Bull as BullMQ Sync Queue
    participant Remote as AniList / MAL API

    User->>Widget: Tap "+1 Episode"
    Widget->>LocalDB: 1. Optimistic Write: current_episode = 12
    Widget->>LocalDB: 2. Enqueue SyncEvent(PROGRESS_UPDATED, ep=12, PENDING)
    Widget-->>User: Immediate UI Repaint (12ms)
    
    NetMonitor->>LocalDB: Connectivity Detected (Online)
    LocalDB->>API: 3. POST /api/v1/sync/events/batch (Idempotency-Key: uuid)
    API->>API: 4. Commit to PostgreSQL & UserActivity
    API->>Bull: 5. Enqueue ProviderSyncJob(jobId)
    API-->>LocalDB: 200 OK (Acknowledge event)
    LocalDB->>LocalDB: Mark SyncEvent as SYNCED

    Bull->>Remote: 6. Rate-limited Dispatch to AniList/MAL
    alt Successful Remote Update
        Remote-->>Bull: 200 OK { remoteUpdatedAt: ts }
        Bull->>API: Mark ProviderSyncJob as COMPLETED
    else Conflict Detected (Remote value > local)
        Remote-->>Bull: Return Remote Progress (e.g., ep=14)
        Bull->>API: Emit Conflict Event & Create Conflict Record
        API-->>User: Push Notification ("Conflict on Bleach: 12 vs 14")
    end
```

### 7.1 Conflict Resolution Deterministic Algorithm

```typescript
// packages/sync-engine/src/algorithms/conflict-resolver.ts

export enum ConflictStrategy {
  ANI_VAULT_MASTER = 'ANI_VAULT_MASTER',     // Local AniVault change unconditionally wins
  HIGHEST_PROGRESS = 'HIGHEST_PROGRESS',     // Maximum episode/chapter count wins
  REMOTE_PROVIDER_WINS = 'REMOTE_PROVIDER_WINS', // Remote platform overwrites local
  MANUAL_HOLD = 'MANUAL_HOLD'                // Pause sync and await user review
}

export interface ProgressStateComparison {
  mediaId: string;
  localEpisode: number;
  localTimestamp: Date;
  remoteEpisode: number;
  remoteTimestamp: Date;
  provider: 'ANILIST' | 'MYANIMELIST';
}

export function resolveProgressDiscrepancy(
  comparison: ProgressStateComparison,
  strategy: ConflictStrategy
): { resolvedEpisode: number; requiresRemotePush: boolean; requiresLocalUpdate: boolean } {
  // If values are identical, no conflict exists
  if (comparison.localEpisode === comparison.remoteEpisode) {
    return { resolvedEpisode: comparison.localEpisode, requiresRemotePush: false, requiresLocalUpdate: false };
  }

  switch (strategy) {
    case ConflictStrategy.ANI_VAULT_MASTER:
      return {
        resolvedEpisode: comparison.localEpisode,
        requiresRemotePush: true,
        requiresLocalUpdate: false
      };

    case ConflictStrategy.REMOTE_PROVIDER_WINS:
      return {
        resolvedEpisode: comparison.remoteEpisode,
        requiresRemotePush: false,
        requiresLocalUpdate: true
      };

    case ConflictStrategy.HIGHEST_PROGRESS:
      if (comparison.localEpisode > comparison.remoteEpisode) {
        return {
          resolvedEpisode: comparison.localEpisode,
          requiresRemotePush: true,
          requiresLocalUpdate: false
        };
      } else {
        return {
          resolvedEpisode: comparison.remoteEpisode,
          requiresRemotePush: false,
          requiresLocalUpdate: true
        };
      }

    case ConflictStrategy.MANUAL_HOLD:
    default:
      throw new Error(`Manual resolution required for Media [${comparison.mediaId}]. State flagged in conflict queue.`);
  }
}
```

---

## 8. Native Home-Screen Widget Interaction Specifications

### 8.1 OS Architecture & Execution Constraints

```
┌────────────────────────────────────────────────────────────────────────┐
│ Android Native Architecture (Jetpack Compose Glance + AppWidget)      │
│ ┌──────────────────────┐  User Tap   ┌───────────────────────────────┐ │
│ │ Glance AppWidget UI  │ ──────────> │ GlanceActionReceiver          │ │
│ └──────────────────────┘             └───────────────────────────────┘ │
│                                                      │                 │
│                                           Write Room/SQLite            │
│                                                      ▼                 │
│ ┌──────────────────────┐             ┌───────────────────────────────┐ │
│ │ Widget State Cache   │ <────────── │ WorkManager (OneTimeWork)     │ │
│ └──────────────────────┘ Immediate   └───────────────────────────────┘ │
│                          Re-render                   │                 │
│                                              Dispatches POST Sync      │
└──────────────────────────────────────────────────────┼─────────────────┘
                                                       │ HTTPS TLS 1.3
┌──────────────────────────────────────────────────────┼─────────────────┐
│ iOS Native Architecture (WidgetKit + App Intents)    ▼                 │
│ ┌──────────────────────┐  User Tap   ┌───────────────────────────────┐ │
│ │ SwiftUI Widget View  │ ──────────> │ IncrementProgressIntent       │ │
│ └──────────────────────┘             └───────────────────────────────┘ │
│                                                      │                 │
│                                           Write App Group CoreData     │
│                                                      ▼                 │
│ ┌──────────────────────┐  Timeline   ┌───────────────────────────────┐ │
│ │ Shared AppGroup File │ <────────── │ WidgetCenter.reloadTimelines  │ │
│ └──────────────────────┘  Reload     └───────────────────────────────┘ │
│                                                      │                 │
│                                              BGTaskScheduler Sync      │
└────────────────────────────────────────────────────────────────────────┘
```

- **Android AppWidget Constraints:**
  - Update frequency via XML `updatePeriodMillis` has an OS-enforced minimum of 30 minutes.
  - Interactive incrementation uses `ActionCallback` in Glance. The action updates the local Room SQLite database in process, triggers an immediate widget state re-composition (<16ms), and enqueues a `OneTimeWorkRequest` with `WorkManager` for network transmission.
- **iOS WidgetKit Constraints:**
  - Interactive buttons and toggles run through `AppIntent` (iOS 17+).
  - App Intents write to the shared App Group container (`group.com.anivault.shared`).
  - Calls `WidgetCenter.shared.reloadTimelines(ofKind: "QuickTrackerWidget")` immediately.
  - Dispatches sync event to backend via `URLSession` background session.

### 8.2 Widget Layout Blueprint Specifications

#### Widget Archetype A: Quick Tracker (2x2 / Medium)
- **Dimensions:** 4x2 grid cells on Android, `systemMedium` on iOS.
- **Visual Components:**
  - Left: 2:3 Cover Poster (`width: 80dp`, corner radius: `8dp`).
  - Center-Top: Truncated Title (Bold 14sp, max 2 lines).
  - Center-Middle: Subtitle `Episode 11 of 24` + Status Pill (`Watching`).
  - Center-Bottom: Visual progress bar (`height: 6dp`, primary tint `#6366F1`).
  - Right: Vertical action column:
    - Button `[ +1 ]`: Primary filled button, executes `IncrementProgressIntent(mediaId, +1)`.
    - Button `[ -1 ]`: Subtle outlined button, executes `IncrementProgressIntent(mediaId, -1)`.

#### Widget Archetype B: Currently Watching (4x2 / Large)
- **Dimensions:** 4x3 cells on Android, `systemLarge` on iOS.
- **Visual Components:**
  - List of 3 active anime entries.
  - Each row contains: mini poster (40x50dp), title, current episode badge (`Ep 12`), and mini `[+]` button.
  - Footer shows last sync status: `Synced 4m ago` with mini status indicator.

---

## 9. JSON & CSV Universal Import/Export Specification

### 9.1 Versioned JSON Schema (`schemaVersion: 1.0.0`)

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "title": "AniVaultExportPayload",
  "type": "object",
  "required": ["schemaVersion", "exportedAt", "application", "library"],
  "properties": {
    "schemaVersion": { "type": "string", "const": "1.0.0" },
    "exportedAt": { "type": "string", "format": "date-time" },
    "application": { "type": "string", "const": "AniVault" },
    "user": {
      "type": "object",
      "required": ["username"],
      "properties": {
        "username": { "type": "string" },
        "exportId": { "type": "string", "format": "uuid" }
      }
    },
    "franchises": {
      "type": "array",
      "items": {
        "type": "object",
        "required": ["canonicalTitle"],
        "properties": {
          "canonicalTitle": { "type": "string" },
          "originalTitle": { "type": "string" },
          "description": { "type": "string" },
          "franchiseMediaIds": { "type": "array", "items": { "type": "string" } }
        }
      }
    },
    "library": {
      "type": "array",
      "items": {
        "type": "object",
        "required": ["title", "type", "format", "status", "progress"],
        "properties": {
          "title": { "type": "string" },
          "titleEnglish": { "type": "string" },
          "titleNative": { "type": "string" },
          "type": { "type": "string", "enum": ["ANIME", "MANGA", "LIGHT_NOVEL"] },
          "format": { "type": "string", "enum": ["TV", "MOVIE", "OVA", "ONA", "SPECIAL", "MANGA", "NOVEL"] },
          "status": { "type": "string", "enum": ["PLANNING", "WATCHING", "READING", "COMPLETED", "ON_HOLD", "DROPPED", "REWATCHING", "REREADING"] },
          "progress": {
            "type": "object",
            "properties": {
              "currentEpisode": { "type": "integer", "minimum": 0 },
              "totalEpisodes": { "type": ["integer", "null"] },
              "currentChapter": { "type": "number", "minimum": 0 },
              "totalChapters": { "type": ["integer", "null"] },
              "currentVolume": { "type": "integer", "minimum": 0 },
              "totalVolumes": { "type": ["integer", "null"] }
            }
          },
          "rating": {
            "type": "object",
            "properties": {
              "score": { "type": "number", "minimum": 0, "maximum": 100 },
              "ratingSystem": { "type": "string" },
              "reviewText": { "type": "string" }
            }
          },
          "dates": {
            "type": "object",
            "properties": {
              "startedAt": { "type": ["string", "null"], "format": "date" },
              "completedAt": { "type": ["string", "null"], "format": "date" }
            }
          },
          "externalIds": {
            "type": "object",
            "properties": {
              "anilist": { "type": ["string", "integer"] },
              "myanimelist": { "type": ["string", "integer"] },
              "kitsu": { "type": ["string", "integer"] },
              "tmdb": { "type": ["string", "integer"] }
            }
          },
          "personalNotes": { "type": "string" },
          "rewatchRereadCount": { "type": "integer", "minimum": 0 },
          "isFavorite": { "type": "boolean" },
          "customTags": { "type": "array", "items": { "type": "string" } }
        }
      }
    }
  }
}
```

### 9.2 Comprehensive Canonical Sample Export Payload

```json
{
  "schemaVersion": "1.0.0",
  "exportedAt": "2026-11-07T12:00:00.000Z",
  "application": "AniVault",
  "user": {
    "username": "otaku_architect",
    "exportId": "e1f9a8b0-bc32-4d7a-8f43-128c7ef3901a"
  },
  "franchises": [
    {
      "canonicalTitle": "Naruto",
      "originalTitle": "NARUTO -ナルト-",
      "description": "Massashi Kishimoto's ninja universe following Naruto Uzumaki.",
      "franchiseMediaIds": ["naruto-tv", "naruto-shippuden-tv", "naruto-movie-1", "naruto-manga"]
    }
  ],
  "library": [
    {
      "id": "naruto-tv",
      "title": "Naruto",
      "titleEnglish": "Naruto",
      "titleNative": "NARUTO -ナルト-",
      "type": "ANIME",
      "format": "TV",
      "status": "COMPLETED",
      "progress": {
        "currentEpisode": 220,
        "totalEpisodes": 220
      },
      "rating": {
        "score": 8.5,
        "ratingSystem": "POINT_10_DECIMAL",
        "reviewText": "Classic foundational battle shounen. Chunin exam arc remains peak."
      },
      "dates": {
        "startedAt": "2020-01-15",
        "completedAt": "2020-06-20"
      },
      "externalIds": {
        "anilist": 20,
        "myanimelist": 20,
        "kitsu": 11
      },
      "rewatchRereadCount": 1,
      "isFavorite": true,
      "personalNotes": "Skipped fillers from ep 136-219 on rewatch.",
      "customTags": ["Ninja", "Nostalgia", "Shounen Jump"]
    },
    {
      "id": "naruto-shippuden-tv",
      "title": "Naruto: Shippuden",
      "titleEnglish": "Naruto: Shippuden",
      "titleNative": "NARUTO -ナルト- 疾風伝",
      "type": "ANIME",
      "format": "TV",
      "status": "COMPLETED",
      "progress": {
        "currentEpisode": 500,
        "totalEpisodes": 500
      },
      "rating": {
        "score": 9.0,
        "ratingSystem": "POINT_10_DECIMAL"
      },
      "dates": {
        "startedAt": "2020-07-01",
        "completedAt": "2021-03-10"
      },
      "externalIds": {
        "anilist": 1735,
        "myanimelist": 1735,
        "kitsu": 1555
      },
      "rewatchRereadCount": 0,
      "isFavorite": true,
      "personalNotes": "Pain arc was 10/10.",
      "customTags": ["Shounen Jump", "Akatsuki"]
    },
    {
      "id": "naruto-movie-1",
      "title": "Naruto the Movie: Ninja Clash in the Land of Snow",
      "titleEnglish": "Naruto the Movie: Ninja Clash in the Land of Snow",
      "titleNative": "劇場版 NARUTO -ナルト- 大活劇!雪姫忍法帖だってばよ!!",
      "type": "ANIME",
      "format": "MOVIE",
      "status": "COMPLETED",
      "progress": {
        "currentEpisode": 1,
        "totalEpisodes": 1
      },
      "rating": {
        "score": 7.0,
        "ratingSystem": "POINT_10_DECIMAL"
      },
      "externalIds": {
        "anilist": 442,
        "myanimelist": 442
      },
      "rewatchRereadCount": 0,
      "isFavorite": false,
      "customTags": ["Franchise Movie"]
    },
    {
      "id": "naruto-manga",
      "title": "Naruto",
      "titleEnglish": "Naruto",
      "titleNative": "NARUTO -ナルト-",
      "type": "MANGA",
      "format": "MANGA",
      "status": "COMPLETED",
      "progress": {
        "currentChapter": 700,
        "totalChapters": 700,
        "currentVolume": 72,
        "totalVolumes": 72
      },
      "rating": {
        "score": 9.2,
        "ratingSystem": "POINT_10_DECIMAL"
      },
      "externalIds": {
        "anilist": 30011,
        "myanimelist": 11
      },
      "rewatchRereadCount": 0,
      "isFavorite": true,
      "personalNotes": "Read entire manga run physically in tankobon volumes.",
      "customTags": ["Manga Source"]
    }
  ]
}
```

### 9.3 Duplicate Detection & Identity Resolution Pipeline

```mermaid
flowchart TD
    Raw[Import Record Ingested] --> ExtMatch{Exact External ID Match?}
    ExtMatch -->|Yes: AniList ID / MAL ID matches| Merge[Merge into Existing Media Record]
    ExtMatch -->|No| TitleMatch{Normalized Title & Year Exact Match?}
    TitleMatch -->|Yes: Exact String Match| Merge
    TitleMatch -->|No| Levenshtein{Levenshtein / Trigram Sim > 0.88?}
    Levenshtein -->|Yes| FlagCandidate[Flag for User Resolution Review]
    Levenshtein -->|No| CreateNew[Insert New Media & Library Item]
```

---

## 10. Security & Deployment Architecture

### 10.1 Cryptographic Key Management & OAuth Token Storage
- External OAuth2 `access_token` and `refresh_token` strings are never stored in plaintext.
- **Algorithm:** AES-256-GCM authenticated encryption.
- **Key Derivation:** Master secret supplied via environment variable `TOKEN_ENCRYPTION_SECRET` (256-bit hexadecimal string), derived with HKDF-SHA256 with tenant context salt.
- Storage format in DB: `base64(iv):base64(ciphertext):base64(authTag)`.

### 10.2 Production Infrastructure Architecture

```mermaid
flowchart TD
    Client[Web / Mobile / Desktop Clients] -->|HTTPS 443 / TLS 1.3| Nginx[Nginx Reverse Proxy / Load Balancer]
    Nginx -->|Rate Limited Proxy| NestAPI[NestJS API Service Cluster]
    
    subgraph Internal Docker Network [Isolated Private VPC]
        NestAPI -->|Port 5432 / TLS| PG[(PostgreSQL 16 Primary DB)]
        NestAPI -->|Port 6379| Redis[(Redis 7 Cache & BullMQ Queue)]
        Worker[NestJS Background Sync Worker] -->|Consume Jobs| Redis
        Worker -->|DB Writes| PG
    end

    subgraph External APIs [Rate-Limited Outbound Egress]
        Worker --> AniList[AniList GraphQL]
        Worker --> MAL[MyAnimeList REST API]
        Worker --> TMDB[TMDB API]
    end
```

### 10.3 Production Docker Compose Deployment Configuration

```yaml
# infrastructure/docker/docker-compose.prod.yml
version: '3.9'

services:
  reverse-proxy:
    image: nginx:1.25-alpine
    container_name: anivault-reverse-proxy
    restart: always
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - ./nginx/ssl:/etc/nginx/ssl:ro
      - web-static:/var/www/anivault/web:ro
    depends_on:
      - api-server

  api-server:
    build:
      context: ../../
      dockerfile: infrastructure/docker/Dockerfile.api
    container_name: anivault-api-server
    restart: always
    environment:
      NODE_ENV: production
      PORT: 3000
      DATABASE_URL: postgresql://${DB_USER}:${DB_PASSWORD}@postgres-db:5432/${DB_NAME}?schema=public&sslmode=disable
      REDIS_URL: redis://:${REDIS_PASSWORD}@redis-cache:6379/0
      JWT_SECRET: ${JWT_SECRET}
      JWT_REFRESH_SECRET: ${JWT_REFRESH_SECRET}
      TOKEN_ENCRYPTION_SECRET: ${TOKEN_ENCRYPTION_SECRET}
      CORS_ALLOWED_ORIGINS: ${CORS_ALLOWED_ORIGINS}
    ports:
      - "3000:3000"
    depends_on:
      postgres-db:
        condition: service_healthy
      redis-cache:
        condition: service_healthy

  sync-worker:
    build:
      context: ../../
      dockerfile: infrastructure/docker/Dockerfile.worker
    container_name: anivault-sync-worker
    restart: always
    environment:
      NODE_ENV: production
      DATABASE_URL: postgresql://${DB_USER}:${DB_PASSWORD}@postgres-db:5432/${DB_NAME}?schema=public&sslmode=disable
      REDIS_URL: redis://:${REDIS_PASSWORD}@redis-cache:6379/0
      TOKEN_ENCRYPTION_SECRET: ${TOKEN_ENCRYPTION_SECRET}
    depends_on:
      postgres-db:
        condition: service_healthy
      redis-cache:
        condition: service_healthy

  postgres-db:
    image: postgres:16-alpine
    container_name: anivault-postgres
    restart: always
    environment:
      POSTGRES_USER: ${DB_USER}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
      POSTGRES_DB: ${DB_NAME}
    volumes:
      - pgdata:/var/lib/postgresql/data
      - ../database/init.sql:/docker-entrypoint-initdb.d/init.sql:ro
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${DB_USER} -d ${DB_NAME}"]
      interval: 5s
      timeout: 5s
      retries: 5

  redis-cache:
    image: redis:7-alpine
    container_name: anivault-redis
    restart: always
    command: redis-server --requirepass ${REDIS_PASSWORD} --appendonly yes
    volumes:
      - redisdata:/data
    healthcheck:
      test: ["CMD", "redis-cli", "-a", "${REDIS_PASSWORD}", "ping"]
      interval: 5s
      timeout: 5s
      retries: 5

volumes:
  pgdata:
  redisdata:
  web-static:
```

---

## 11. Development Milestones & Acceptance Criteria

### Phase 1: Core Foundation & Data Layer (Weeks 1–4)
- [x] Complete Monorepo scaffolding (`apps/api`, `apps/web`, `apps/mobile`, `packages/domain`, `packages/shared-types`).
- [x] PostgreSQL 16 schema deployment with migrations via Prisma.
- [x] JWT Authentication module with Argon2id password hashing and secure cookie refresh rotation.
- [x] Relational CRUD API endpoints for Franchises, Media, Seasons, Episodes, and Chapters.
- [x] Dual-track User Library tracking (Anime vs Manga independent progress).
- [x] **Acceptance Gate 1:**
  - Automated tests verify Naruto anime and Naruto manga exist under 1 franchise root with independent progress states.
  - Test verifies batch completion of a 24-episode season updates all progress counters in single transaction.

### Phase 2: External Integrations & Bi-Directional Sync (Weeks 5–8)
- [x] Abstract adapter interface (`ISyncPlatformProvider`) implementation.
- [x] AniList OAuth2 & GraphQL query/mutation provider adapter with 90 req/min rate limiter.
- [x] MyAnimeList OAuth2 + PKCE REST v2 provider adapter with token refresh worker.
- [x] BullMQ + Redis background worker architecture for rate-limited sync jobs.
- [x] Interactive Conflict Resolution API and frontend conflict comparison modal.
- [x] **Acceptance Gate 2:**
  - Authenticating AniList pulls the user's watching list into AniVault without duplicate entries.
  - Updating an episode in AniVault pushes an update to AniList and MAL within 3 seconds when online.
  - Intentionally inducing a progress conflict (e.g. Local 12 vs AniList 14) halts auto-overwrite and surfaces conflict resolution UI.

### Phase 3: Bulk Import/Export & Staging Engine (Weeks 9–11)
- [x] Versioned JSON Export engine producing validated `schemaVersion: 1.0.0` payloads.
- [x] Multipart file upload staging pipeline for JSON and CSV.
- [x] Duplicate detection service using Levenshtein distance and external ID matching.
- [x] Dry-run diff engine with transactional rollback token mechanics.
- [x] **Acceptance Gate 3:**
  - Exporting library to JSON and re-importing into a clean test database produces a 100% byte-for-byte identical library state.
  - Attempting to import a malformed JSON file safely fails at the Zod schema validation layer with line-numbered error reports.

### Phase 4: Mobile Application & Native Widgets (Weeks 12–16)
- [x] React Native + Expo application build for Android and iOS.
- [x] Local SQLite / WatermelonDB offline storage abstraction with mutation outbox.
- [x] Android Jetpack Compose Glance AppWidget: Quick Tracker (2x2) with `[ +1 ]` direct button.
- [x] iOS WidgetKit SwiftUI Widget: Quick Tracker with AppIntent-driven progress increment.
- [x] Background sync worker using Android WorkManager and iOS BGTaskScheduler.
- [x] **Acceptance Gate 4:**
  - Tapping `+1` on the Android/iOS home screen widget updates episode progress on screen within `< 50ms` while in Airplane Mode.
  - Re-enabling network connectivity triggers automatic outbox flush to AniVault API and connected AniList account without user intervention.

### Phase 5: Discovery, Analytics & Release Calendar (Weeks 17–20)
- [x] Airing calendar view with confirmed episode release countdowns.
- [x] Analytics engine: watch time calculator, genre radar chart, score distribution histograms.
- [x] Annual "Anime Wrapped" generator with exportable social cards.
- [x] Spoiler protection engine filtering synopsis and thumbnails according to current episode watch index.
- [x] **Acceptance Gate 5:**
  - Spoiler-protected title blurs synopsis and episode titles beyond user's current episode number.
  - Calendar shows accurate local air times converted from JST broadcast schedules.

### Phase 6: Desktop App (Tauri 2) & Cross-Platform Polish (Weeks 21–24)
- [x] Tauri 2 desktop wrapper bundling Vite + React frontend for Windows (.msi) and macOS (.dmg).
- [x] System tray integration with quick-track menu and desktop native notifications for airing episodes.
- [x] End-to-end integration test suite using Vitest, Playwright, and Detox.
- [x] Final production security audit (OWASP Top 10, AES token encryption verification, Pen-testing).
- [x] **Acceptance Gate 6:**
  - Desktop installer launches on Windows 11 and macOS Sequoia, synchronizing with the central API with full offline capability.

---

*End of Formal Specifications. This document stands as the immutable baseline for all engineering deliverables.*

