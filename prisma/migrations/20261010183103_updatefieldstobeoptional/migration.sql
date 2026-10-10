/*
  Warnings:

  - Made the column `age_band` on table `demographics` required. This step will fail if there are existing NULL values in that column.
  - Made the column `county` on table `demographics` required. This step will fail if there are existing NULL values in that column.
  - Made the column `county_of_residence` on table `demographics` required. This step will fail if there are existing NULL values in that column.
  - Made the column `gender` on table `demographics` required. This step will fail if there are existing NULL values in that column.
  - Made the column `primary_language` on table `demographics` required. This step will fail if there are existing NULL values in that column.
  - Made the column `race` on table `demographics` required. This step will fail if there are existing NULL values in that column.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_demographics" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "ethnicity" TEXT NOT NULL DEFAULT 'Rather Not Say',
    "age_band" TEXT NOT NULL,
    "marital_status" TEXT NOT NULL DEFAULT 'Rather Not Say',
    "children_under_5_count" INTEGER NOT NULL DEFAULT 0,
    "children_5_to_18_count" INTEGER NOT NULL DEFAULT 0,
    "children_over_18_count" INTEGER NOT NULL DEFAULT 0,
    "county_of_residence" TEXT NOT NULL,
    "employment_status" TEXT NOT NULL DEFAULT 'Rather Not Say',
    "annual_income_bracket" TEXT NOT NULL DEFAULT 'Rather Not Say',
    "education_level" TEXT NOT NULL DEFAULT 'Rather Not Say',
    "primary_language" TEXT NOT NULL,
    "race" TEXT NOT NULL,
    "gender" TEXT NOT NULL,
    "age" INTEGER,
    "annual_personal_income" TEXT NOT NULL DEFAULT 'Rather Not Say',
    "annual_household_income" TEXT NOT NULL DEFAULT 'Rather Not Say',
    "county" TEXT NOT NULL,
    "has_children_under_18" BOOLEAN NOT NULL DEFAULT false,
    "has_children_under_5" BOOLEAN NOT NULL DEFAULT false,
    "educational_attainment" TEXT NOT NULL DEFAULT 'Rather Not Say',
    "has_personal_vehicle" BOOLEAN NOT NULL DEFAULT false,
    "is_employed" BOOLEAN NOT NULL DEFAULT false,
    "industry_area" TEXT NOT NULL DEFAULT 'Rather Not Say',
    CONSTRAINT "demographics_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_demographics" ("age", "age_band", "annual_household_income", "annual_income_bracket", "annual_personal_income", "children_5_to_18_count", "children_over_18_count", "children_under_5_count", "county", "county_of_residence", "education_level", "educational_attainment", "employment_status", "ethnicity", "gender", "has_children_under_18", "has_children_under_5", "has_personal_vehicle", "id", "industry_area", "is_employed", "marital_status", "primary_language", "race", "user_id") SELECT "age", "age_band", coalesce("annual_household_income", 'Rather Not Say') AS "annual_household_income", coalesce("annual_income_bracket", 'Rather Not Say') AS "annual_income_bracket", coalesce("annual_personal_income", 'Rather Not Say') AS "annual_personal_income", "children_5_to_18_count", "children_over_18_count", "children_under_5_count", "county", "county_of_residence", coalesce("education_level", 'Rather Not Say') AS "education_level", coalesce("educational_attainment", 'Rather Not Say') AS "educational_attainment", coalesce("employment_status", 'Rather Not Say') AS "employment_status", coalesce("ethnicity", 'Rather Not Say') AS "ethnicity", "gender", "has_children_under_18", "has_children_under_5", "has_personal_vehicle", "id", coalesce("industry_area", 'Rather Not Say') AS "industry_area", "is_employed", coalesce("marital_status", 'Rather Not Say') AS "marital_status", "primary_language", "race", "user_id" FROM "demographics";
DROP TABLE "demographics";
ALTER TABLE "new_demographics" RENAME TO "demographics";
CREATE UNIQUE INDEX "demographics_user_id_key" ON "demographics"("user_id");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
