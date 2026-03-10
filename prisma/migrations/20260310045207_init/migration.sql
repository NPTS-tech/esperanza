-- CreateEnum
CREATE TYPE "Role" AS ENUM ('USER', 'PROVIDER', 'ADMIN');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'USER',
    "language_pref" TEXT NOT NULL DEFAULT 'en',
    "consented_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "demographics" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "race" TEXT,
    "gender" TEXT,
    "age" INTEGER,
    "annual_personal_income" TEXT,
    "annual_household_income" TEXT,
    "county" TEXT,
    "has_children_under_18" BOOLEAN NOT NULL DEFAULT false,
    "has_children_under_5" BOOLEAN NOT NULL DEFAULT false,
    "educational_attainment" TEXT,
    "has_personal_vehicle" BOOLEAN NOT NULL DEFAULT false,
    "is_employed" BOOLEAN NOT NULL DEFAULT false,
    "industry_area" TEXT,

    CONSTRAINT "demographics_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "demographics_user_id_key" ON "demographics"("user_id");

-- AddForeignKey
ALTER TABLE "demographics" ADD CONSTRAINT "demographics_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
