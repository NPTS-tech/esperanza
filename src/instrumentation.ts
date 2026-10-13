// Runs once when the Next.js server starts.
export async function register() {
    if (process.env.NEXT_RUNTIME !== "nodejs") return;
    const { start_reminder_scheduler } = await import("@/lib/reminders");
    start_reminder_scheduler();
}
