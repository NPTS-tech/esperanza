-- AlterTable
ALTER TABLE "users" ADD COLUMN     "share_with_providers" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "username" TEXT;

-- AlterTable
ALTER TABLE "demographics" ADD COLUMN     "age_band" TEXT,
ADD COLUMN     "annual_income_bracket" TEXT,
ADD COLUMN     "children_5_to_18_count" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "children_over_18_count" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "children_under_5_count" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "county_of_residence" TEXT,
ADD COLUMN     "education_level" TEXT,
ADD COLUMN     "employment_status" TEXT,
ADD COLUMN     "ethnicity" TEXT,
ADD COLUMN     "marital_status" TEXT,
ADD COLUMN     "primary_language" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");
