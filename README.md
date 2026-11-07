# AniVault: Unified Anime & Manga Management

> **One library. Every adaptation. Every platform.**  
> A personal entertainment tracking ecosystem that unifies anime, manga, movies, franchises, watch & reading progress, ratings, collections, and external tracking accounts (AniList, MyAnimeList, Kitsu, AniDB, TMDB).

---

## 🏛️ Architecture & Specifications (Source of Truth)

The complete engineering blueprint, software requirements, and architectural designs are formally documented in:
👉 **[Software Requirements Specification (SRS) & Detailed Technical Architecture](file:///c:/Users/Sahil/Code/AniVault/docs/architecture/SRS_AND_TECHNICAL_ARCHITECTURE.md)**

### Highlights Covered in the Specification:
1. **Functional & Non-Functional Requirements (FR/NFR):** 12 core modules spanning hierarchical franchise trees, dual-track tracking, offline mutations, rate-limited integrations, and home-screen widgets.
2. **Screen & Navigation Architecture:** Detailed UX breakdowns for Home Dashboard, Library, Franchise Detail, Media Detail, Conflict Resolution Hub, and Universal Identity Editor.
3. **Database Entity-Relationship (ER) Architecture:** Mermaid ER diagrams covering relational schemas across franchises, media, typed relationships, external IDs, user progress, sync jobs, and widgets.
4. **PostgreSQL 16 Production DDL:** Complete SQL schema with custom enums, UUIDs, performance indexes, GIN trigram indexes for title search, and updated-at triggers.
5. **REST API Endpoint Definitions:** Full `/api/v1` specifications with request/response models.
6. **External Provider Adapter Contracts:** Strongly typed TypeScript interfaces (`IMediaMetadataProvider`, `ISyncPlatformProvider`) with rate limiting and token management.
7. **Two-Way Synchronization Engine:** Offline-first event-driven outbox pipeline with deterministic conflict resolution algorithms.
8. **Native Home-Screen Widgets:** Architecture for Android AppWidgets (Glance) and iOS WidgetKit (App Intents) for `<16ms` optimistic updates without launching the main application.
9. **Universal Import/Export Specification:** JSON Schema Draft 2020-12 definition, sample payloads, and transactional rollback pipeline.
10. **Security & Deployment:** AES-256-GCM token encryption, JWT rotation, and production Docker Compose clustering.
11. **Roadmap & Acceptance Gates:** 6-phase milestone plan with strict testing criteria.

---

## 📂 Repository Structure

```
anivault/
├── apps/
│   ├── api/             # NestJS REST & Sync Engine backend
│   ├── web/             # Vite + React 19 web application
│   ├── mobile/          # React Native + Expo (Android & iOS) + Native Widgets
│   └── desktop/         # Tauri 2 desktop shell (Windows & macOS)
├── packages/
│   ├── domain/          # Shared domain entities & interfaces
│   ├── shared-types/    # TypeScript types & DTOs
│   ├── validation/      # Zod validation schemas
│   ├── sync-engine/     # Conflict resolution & outbox logic
│   └── api-client/      # Cross-platform HTTP client
├── infrastructure/
│   └── docker/          # Docker Compose, PostgreSQL, Redis, and Nginx configurations
└── docs/
    └── architecture/    # SRS and system architecture specifications
```

---

## 🚀 Quick Start (Development)

```bash
# 1. Install dependencies across monorepo
npm install

# 2. Launch PostgreSQL 16 & Redis 7 infrastructure
docker compose -f infrastructure/docker/docker-compose.prod.yml up -d postgres-db redis-cache

# 3. Read the SRS before initiating Phase 1 development
cat docs/architecture/SRS_AND_TECHNICAL_ARCHITECTURE.md
```

