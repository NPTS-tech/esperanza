-- Add optional address field so events can store both a user-facing place name
-- and a structured/reverse-geocoded address from map selection.
ALTER TABLE "events"
ADD COLUMN "location_address" TEXT;