// Self-check for send_due_reminders. Run against a throwaway DB:
//   DATABASE_URL=file:/tmp/r.db pnpm exec prisma migrate deploy
//   DATABASE_URL=file:/tmp/r.db pnpm exec tsx src/lib/reminders.check.ts
import assert from "node:assert";
import { db } from "@/lib/db";
import { send_due_reminders } from "@/lib/reminders";

async function main() {
    const now = new Date();
    const mk = (name: string, extra = {}) =>
        db.user.create({ data: { name, email: `${name}-${now.getTime()}@x.test`, ...extra } });
    const a = await mk("a"); // default 60 min lead
    const b = await mk("b", { reminder_lead_min: 15 });
    const c = await mk("c", { reminder_push: false, reminder_email: false });
    const ev = (status: string, mins: number) =>
        db.event.create({
            data: {
                title_en: "T", title_es: "T", description_en: "d", description_es: "d",
                location_name: "Park", latitude: 0, longitude: 0, category: "x",
                start_time: new Date(now.getTime() + mins * 60000),
                end_time: new Date(now.getTime() + (mins + 60) * 60000),
                provider_id: a.id, status,
            },
        });
    const soon = await ev("APPROVED", 30);
    const pending = await ev("PENDING", 30);
    const past = await ev("APPROVED", -5);
    for (const u of [a, b, c]) await db.rsvp.create({ data: { user_id: u.id, event_id: soon.id } });
    await db.rsvp.create({ data: { user_id: a.id, event_id: pending.id } });
    await db.rsvp.create({ data: { user_id: a.id, event_id: past.id } });

    assert.equal(await send_due_reminders(now), 1, "only a's RSVP to the approved event is due");
    assert.equal(await send_due_reminders(now), 0, "already reminded");
    // b's 15-minute lead comes due later; c opted out of both channels.
    assert.equal(await send_due_reminders(new Date(now.getTime() + 16 * 60000)), 1);
    console.log("reminders check OK");
}

main().finally(() => db.$disconnect());
