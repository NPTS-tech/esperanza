/*
  Warnings:

  - Made the column `age` on table `demographics` required. This step will fail if there are existing NULL values in that column.
  - Made the column `county_of_residence` on table `demographics` required. This step will fail if there are existing NULL values in that column.
  - Made the column `gender` on table `demographics` required. This step will fail if there are existing NULL values in that column.
  - Made the column `race` on table `demographics` required. This step will fail if there are existing NULL values in that column.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_demographics" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "ethnicity" TEXT,
    "age_band" TEXT,
    "marital_status" TEXT,
    "children_under_5_count" INTEGER NOT NULL DEFAULT 0,
    "children_5_to_18_count" INTEGER NOT NULL DEFAULT 0,
    "children_over_18_count" INTEGER NOT NULL DEFAULT 0,
    "county_of_residence" TEXT NOT NULL,
    "employment_status" TEXT,
    "annual_income_bracket" TEXT,
    "education_level" TEXT,
    "primary_language" TEXT,
    "race" TEXT NOT NULL,
    "gender" TEXT NOT NULL,
    "age" INTEGER NOT NULL,
    "annual_personal_income" TEXT,
    "annual_household_income" TEXT,
    "county" TEXT,
    "has_children_under_18" BOOLEAN NOT NULL DEFAULT false,
    "has_children_under_5" BOOLEAN NOT NULL DEFAULT false,
    "educational_attainment" TEXT,
    "has_personal_vehicle" BOOLEAN NOT NULL DEFAULT false,
    "is_employed" BOOLEAN NOT NULL DEFAULT false,
    "industry_area" TEXT,
    CONSTRAINT "demographics_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_demographics" ("age", "age_band", "annual_household_income", "annual_income_bracket", "annual_personal_income", "children_5_to_18_count", "children_over_18_count", "children_under_5_count", "county", "county_of_residence", "education_level", "educational_attainment", "employment_status", "ethnicity", "gender", "has_children_under_18", "has_children_under_5", "has_personal_vehicle", "id", "industry_area", "is_employed", "marital_status", "primary_language", "race", "user_id") SELECT "age", "age_band", "annual_household_income", "annual_income_bracket", "annual_personal_income", "children_5_to_18_count", "children_over_18_count", "children_under_5_count", "county", "county_of_residence", "education_level", "educational_attainment", "employment_status", "ethnicity", "gender", "has_children_under_18", "has_children_under_5", "has_personal_vehicle", "id", "industry_area", "is_employed", "marital_status", "primary_language", "race", "user_id" FROM "demographics";
DROP TABLE "demographics";
ALTER TABLE "new_demographics" RENAME TO "demographics";
CREATE UNIQUE INDEX "demographics_user_id_key" ON "demographics"("user_id");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
