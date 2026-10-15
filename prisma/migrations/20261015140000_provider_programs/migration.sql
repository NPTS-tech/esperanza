-- AlterTable
ALTER TABLE "provider_profiles" ADD COLUMN "beneficiaries" TEXT;

-- CreateTable
CREATE TABLE "provider_program_categories" (
    "user_id" TEXT NOT NULL,
    "category_id" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY ("user_id", "category_id"),
    CONSTRAINT "provider_program_categories_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "provider_program_categories_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "event_categories" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
