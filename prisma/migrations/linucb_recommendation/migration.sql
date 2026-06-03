-- ============================================================
-- Migration: Hybrid LinUCB Recommendation System
-- PostgreSQL 15 compatible
-- Replaces old Thompson Sampling (BanditArmUCB + RecommendationEventUCB)
-- ============================================================

-- ─────────────────────────────────────────
-- 1. Drop old recommendation tables
-- ─────────────────────────────────────────

DROP TABLE IF EXISTS "RecommendationEventUCB" CASCADE;
DROP TABLE IF EXISTS "BanditArmUCB" CASCADE;

-- ─────────────────────────────────────────
-- 2. BanditArmUCB (per-listing arm data)
-- ─────────────────────────────────────────

CREATE TABLE "BanditArmUCB" (
    "id"              TEXT        NOT NULL DEFAULT gen_random_uuid()::text,
    "listing_id"      TEXT        NOT NULL,
    "listing_type"    TEXT        NOT NULL,
    "location_zone"   TEXT        NOT NULL,
    "tags"            JSONB       NOT NULL DEFAULT '[]'::jsonb,
    "tag_source"      TEXT        NOT NULL DEFAULT 'llm',
    "commission_rate" DOUBLE PRECISION NOT NULL DEFAULT 0.10,
    "impressions"     INTEGER     NOT NULL DEFAULT 0,
    "clicks"          INTEGER     NOT NULL DEFAULT 0,
    "wishlists"       INTEGER     NOT NULL DEFAULT 0,
    "conversions"     INTEGER     NOT NULL DEFAULT 0,
    "total_revenue"   DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "n_updates"       INTEGER     NOT NULL DEFAULT 0,
    "is_underexposed" BOOLEAN     NOT NULL DEFAULT true,
    "updated_at"      TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT "BanditArmUCB_pkey" PRIMARY KEY ("id")
);

-- Unique constraint: one arm per listing+type+zone
ALTER TABLE "BanditArmUCB"
    ADD CONSTRAINT "BanditArmUCB_listing_id_listing_type_location_zone_key"
    UNIQUE ("listing_id", "listing_type", "location_zone");

-- B-tree indexes for filtering
CREATE INDEX "BanditArmUCB_location_zone_idx" ON "BanditArmUCB" ("location_zone");
CREATE INDEX "BanditArmUCB_listing_type_idx"  ON "BanditArmUCB" ("listing_type");

-- GIN index on JSONB tags to prevent sequential scans
CREATE INDEX "BanditArmUCB_tags_gin_idx" ON "BanditArmUCB" USING GIN ("tags");

-- ─────────────────────────────────────────
-- 3. LinUCBGlobal (single global row)
-- ─────────────────────────────────────────

CREATE TABLE "LinUCBGlobal" (
    "id"          TEXT        NOT NULL DEFAULT 'global',
    "a_matrix"    JSONB       NOT NULL,
    "b_vector"    JSONB       NOT NULL,
    "d"           INTEGER     NOT NULL,
    "vocab_hash"  TEXT        NOT NULL,
    "n_updates"   INTEGER     NOT NULL DEFAULT 0,
    "updated_at"  TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT "LinUCBGlobal_pkey" PRIMARY KEY ("id")
);

-- CHECK constraint: only one row allowed (id must be 'global')
ALTER TABLE "LinUCBGlobal"
    ADD CONSTRAINT "LinUCBGlobal_single_row_check"
    CHECK ("id" = 'global');

-- ─────────────────────────────────────────
-- 4. SystemConfig (key-value settings)
-- ─────────────────────────────────────────

CREATE TABLE "SystemConfig" (
    "key"        TEXT        NOT NULL,
    "value"      TEXT        NOT NULL,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT "SystemConfig_pkey" PRIMARY KEY ("key")
);

-- ─────────────────────────────────────────
-- 5. ListingTag (LLM-generated tags cache)
-- ─────────────────────────────────────────

CREATE TABLE "ListingTag" (
    "id"              TEXT        NOT NULL DEFAULT gen_random_uuid()::text,
    "listing_id"      TEXT        NOT NULL,
    "listing_type"    TEXT        NOT NULL,
    "tags"            JSONB       NOT NULL DEFAULT '[]'::jsonb,
    "raw_description" TEXT,
    "confidence"      DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "created_at"      TIMESTAMPTZ NOT NULL DEFAULT now(),
    "updated_at"      TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT "ListingTag_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "ListingTag"
    ADD CONSTRAINT "ListingTag_listing_id_listing_type_key"
    UNIQUE ("listing_id", "listing_type");

-- GIN index on JSONB tags
CREATE INDEX "ListingTag_tags_gin_idx" ON "ListingTag" USING GIN ("tags");

-- ─────────────────────────────────────────
-- 6. UserProfile (recommendation user profile)
-- ─────────────────────────────────────────

CREATE TABLE "UserProfile" (
    "user_id"            TEXT        NOT NULL,
    "tag_affinity"       JSONB       NOT NULL DEFAULT '{}'::jsonb,
    "avg_booking_price"  DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "price_std_dev"      DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "dominant_trip_type" TEXT        NOT NULL DEFAULT 'unknown',
    "total_bookings"     INTEGER     NOT NULL DEFAULT 0,
    "updated_at"         TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT "UserProfile_pkey" PRIMARY KEY ("user_id")
);

-- GIN index on JSONB tag_affinity
CREATE INDEX "UserProfile_tag_affinity_gin_idx" ON "UserProfile" USING GIN ("tag_affinity");

-- ─────────────────────────────────────────
-- 7. UserSession (session-level features)
-- ─────────────────────────────────────────

CREATE TABLE "UserSession" (
    "id"                TEXT        NOT NULL DEFAULT gen_random_uuid()::text,
    "session_id"        TEXT        NOT NULL,
    "user_id"           TEXT,
    "location_lat"      DOUBLE PRECISION,
    "location_lon"      DOUBLE PRECISION,
    "device_type"       TEXT        NOT NULL DEFAULT 'mobile',
    "entry_hour"        INTEGER     NOT NULL,
    "entry_month"       INTEGER     NOT NULL,
    "scroll_depth_max"  DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "dwell_seconds"     INTEGER     NOT NULL DEFAULT 0,
    "click_sequence"    JSONB       NOT NULL DEFAULT '[]'::jsonb,
    "price_range_viewed" JSONB      NOT NULL DEFAULT '{"min":0,"max":0}'::jsonb,
    "budget_segment"    TEXT        NOT NULL DEFAULT 'unknown',
    "created_at"        TIMESTAMPTZ NOT NULL DEFAULT now(),
    "updated_at"        TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT "UserSession_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "UserSession"
    ADD CONSTRAINT "UserSession_session_id_key" UNIQUE ("session_id");

-- ─────────────────────────────────────────
-- 8. RecommendationEventUCB (event log)
-- ─────────────────────────────────────────

CREATE TABLE "RecommendationEventUCB" (
    "id"            TEXT        NOT NULL DEFAULT gen_random_uuid()::text,
    "event_type"    TEXT        NOT NULL,
    "listing_id"    TEXT        NOT NULL,
    "listing_type"  TEXT        NOT NULL,
    "user_id"       TEXT,
    "session_id"    TEXT        NOT NULL,
    "location_zone" TEXT        NOT NULL,
    "reward"        DOUBLE PRECISION NOT NULL,
    "rank_shown"    INTEGER,
    "price"         DOUBLE PRECISION,
    "metadata"      JSONB,
    "created_at"    TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT "RecommendationEventUCB_pkey" PRIMARY KEY ("id")
);

-- Indexes for query patterns
CREATE INDEX "RecommendationEventUCB_session_id_idx"  ON "RecommendationEventUCB" ("session_id");
CREATE INDEX "RecommendationEventUCB_user_id_idx"     ON "RecommendationEventUCB" ("user_id");
CREATE INDEX "RecommendationEventUCB_listing_id_idx"  ON "RecommendationEventUCB" ("listing_id");
CREATE INDEX "RecommendationEventUCB_event_type_idx"  ON "RecommendationEventUCB" ("event_type");
CREATE INDEX "RecommendationEventUCB_created_at_idx"  ON "RecommendationEventUCB" ("created_at");

-- ─────────────────────────────────────────
-- 9. Seed SystemConfig
-- ─────────────────────────────────────────

INSERT INTO "SystemConfig" ("key", "value", "updated_at")
VALUES
    ('vocab_hash',      '',    now()),
    ('d',               '306', now()),
    ('schema_version',  '1',   now())
ON CONFLICT ("key") DO NOTHING;
