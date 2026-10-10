/*
  Warnings:

  - You are about to drop the column `category` on the `events` table. All the data in the column will be lost.
  - Added the required column `category_id` to the `events` table without a default value. This is not possible if the table is not empty.
    The new column is backfilled below from the legacy `category` string.
  - Events in the removed `Community` and `Other` categories are deleted (decided in the interests issue), along with their RSVPs.

*/
-- CreateTable
CREATE TABLE "event_categories" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "slug" TEXT NOT NULL,
    "name_en" TEXT NOT NULL,
    "name_es" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "emoji" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "event_categories_slug_key" ON "event_categories"("slug");

-- SeedCategories
-- Keep these values in sync with SEED_CATEGORIES in prisma/seed.ts.
-- Fixed IDs so the backfill below is deterministic.
INSERT INTO "event_categories" ("id", "slug", "name_en", "name_es", "color", "emoji") VALUES
    ('00000000-0000-4000-8000-000000000001', 'health', 'Health', 'Salud', '#ef4444', '🏥'),
    ('00000000-0000-4000-8000-000000000002', 'employment', 'Employment', 'Empleo', '#3b82f6', '💼'),
    ('00000000-0000-4000-8000-000000000003', 'financial', 'Financial', 'Finanzas', '#22c55e', '💰'),
    ('00000000-0000-4000-8000-000000000004', 'recreation', 'Recreation', 'Recreación', '#f97316', '⚽'),
    ('00000000-0000-4000-8000-000000000005', 'transit', 'Transit', 'Tránsito', '#8b5cf6', '🚌'),
    ('00000000-0000-4000-8000-000000000006', 'senior_services', 'Senior Services', 'Servicios para Mayores', '#06b6d4', '🤝'),
    ('00000000-0000-4000-8000-000000000007', 'education', 'Education', 'Educación', '#eab308', '📚'),
    ('00000000-0000-4000-8000-000000000008', 'children', 'Children', 'Niños', '#ec4899', '🧸'),
    ('00000000-0000-4000-8000-000000000009', 'housing', 'Housing', 'Vivienda', '#f59e0b', '🏠');

-- DataMigration: drop events in removed categories (Community, Other) along with their RSVPs
DELETE FROM "rsvps" WHERE "event_id" IN (SELECT "id" FROM "events" WHERE "category" IN ('Community', 'Other'));
DELETE FROM "events" WHERE "category" IN ('Community', 'Other');

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_events" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title_en" TEXT NOT NULL,
    "title_es" TEXT NOT NULL,
    "description_en" TEXT NOT NULL,
    "description_es" TEXT NOT NULL,
    "location_name" TEXT NOT NULL,
    "location_address" TEXT,
    "latitude" REAL NOT NULL,
    "longitude" REAL NOT NULL,
    "start_time" DATETIME NOT NULL,
    "end_time" DATETIME NOT NULL,
    "provider_id" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "category_id" TEXT NOT NULL,
    "image_url" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "events_provider_id_fkey" FOREIGN KEY ("provider_id") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "events_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "event_categories" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
-- Backfill category_id from the legacy `category` display name
-- ('Health' -> 'health', 'Senior Services' -> 'senior_services', ...).
INSERT INTO "new_events" ("created_at", "category_id", "description_en", "description_es", "end_time", "id", "image_url", "latitude", "location_address", "location_name", "longitude", "provider_id", "start_time", "status", "title_en", "title_es", "updated_at") SELECT "created_at", (SELECT "id" FROM "event_categories" WHERE "event_categories"."slug" = replace(lower("events"."category"), ' ', '_')), "description_en", "description_es", "end_time", "id", "image_url", "latitude", "location_address", "location_name", "longitude", "provider_id", "start_time", "status", "title_en", "title_es", "updated_at" FROM "events";
DROP TABLE "events";
ALTER TABLE "new_events" RENAME TO "events";
CREATE INDEX "events_category_id_idx" ON "events"("category_id");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateTable
CREATE TABLE "user_interest_event_categories" (
    "user_id" TEXT NOT NULL,
    "category_id" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY ("user_id", "category_id"),
    CONSTRAINT "user_interest_event_categories_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "user_interest_event_categories_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "event_categories" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
