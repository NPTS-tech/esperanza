# Push Notifications — Architecture

Status: **built (steps 1–5) for event reminders.** `PushSubscription` table,
`/api/push/subscribe` (POST/DELETE), the opt-in in Profile → Event Reminders
(`src/components/reminder_settings.tsx`), and `src/lib/push.ts`. Step 2 differs
from the plan below: the public key is read at runtime as `VAPID_PUBLIC_KEY` and
passed to the client as a prop, so no build arg is needed. Step 6 is not built;
instead the Profile page re-posts the current subscription on each visit.
Senders: `src/lib/reminders.ts`. Env vars: see `.env.example`.

## Approach

**Web Push + VAPID**, server-side via the [`web-push`](https://www.npmjs.com/package/web-push)
library. No FCM/APNs account, no third-party service — the browser's own push
service delivers, VAPID keys authenticate us. Works on Chrome/Edge/Firefox, and
on **iOS 16.4+ only when the PWA is installed to the Home Screen** (plain Safari
tabs can't receive web push — worth saying in the opt-in UI).

Payload contract (what the SW already expects):

```json
{ "title": "…", "body": "…", "url": "/events/123", "tag": "event-123", "icon": "/icons/icon-192.png" }
```

## The additive pieces (build order)

1. **DB — `PushSubscription` table.** One Prisma model, one `migrate` (SQLite,
   additive). Shape:
   ```prisma
   model PushSubscription {
     id         String   @id @default(uuid())
     user_id    String
     endpoint   String   @unique   // the browser push endpoint = natural key
     p256dh     String
     auth       String
     created_at DateTime @default(now())
     user       User     @relation(fields: [user_id], references: [id], onDelete: Cascade)
     @@map("push_subscriptions")
     @@index([user_id])
   }
   ```
   Add `push_subscriptions PushSubscription[]` to `User`.

2. **VAPID keys.** Generate once (`npx web-push generate-vapid-keys`). Public key
   → `NEXT_PUBLIC_VAPID_PUBLIC_KEY` (inlined in client bundle, so it's a Docker
   build-arg like the Geoapify key). Private key + `VAPID_SUBJECT` (a mailto:) →
   runtime env, stored in the S3 env file (`esperanza/<env>.env`), never built in.

3. **`POST /api/push/subscribe` + `/api/push/unsubscribe`.** Auth-gated. Upsert
   on `endpoint`, stamp `user_id` from the session. Unsubscribe deletes by endpoint.

4. **Client opt-in — `PushPrompt` component.** On a user gesture (not on load):
   `Notification.requestPermission()` → `navigator.serviceWorker.ready` →
   `reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey })`
   (base64url-decode the public key) → POST the subscription to `/api/push/subscribe`.
   Gate the CTA on `display-mode: standalone` for iOS.

5. **Send helper — `src/lib/push.ts`.** Wrap `web-push.sendNotification(sub, JSON.stringify(payload))`
   with the VAPID creds. Fan out to a user's subscriptions; **prune rows on
   `404`/`410`** (dead endpoints). Localize `title`/`body` using the recipient's
   existing `User.language_pref`. Call it from the flows that should notify:
   new announcement, event reminder / change, RSVP confirmation.

6. **SW `pushsubscriptionchange` handler.** Add once (3) exists — the browser
   rotates subscriptions periodically; re-subscribe and re-POST. Omitted today
   because it needs the endpoint from (3).

## Why it's safe to defer

The SW already displays whatever arrives, and the data model hangs off `User`
by FK — adding it later is a migration plus new files, with zero edits to auth,
events, or the existing SW caching logic. The only decision locked in now is the
**payload contract above**, which the SW and any future sender both honor.
