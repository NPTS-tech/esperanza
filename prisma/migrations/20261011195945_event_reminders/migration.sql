-- AlterTable
ALTER TABLE "rsvps" ADD COLUMN "reminder_sent_at" DATETIME;

-- AlterTable (plain ADD COLUMNs instead of Prisma's table rebuild of "users")
ALTER TABLE "users" ADD COLUMN "reminder_push" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "users" ADD COLUMN "reminder_email" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "users" ADD COLUMN "reminder_lead_min" INTEGER NOT NULL DEFAULT 60;

-- CreateTable
CREATE TABLE "push_subscriptions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "endpoint" TEXT NOT NULL,
    "p256dh" TEXT NOT NULL,
    "auth" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "push_subscriptions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "push_subscriptions_endpoint_key" ON "push_subscriptions"("endpoint");

-- CreateIndex
CREATE INDEX "push_subscriptions_user_id_idx" ON "push_subscriptions"("user_id");
