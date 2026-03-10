import { db } from "../src/lib/db";
import bcrypt from "bcryptjs";

const seed_accounts = [
    {
        email: "admin@esperanza.app",
        password: "admin123",
        role: "ADMIN" as const,
        language_pref: "en",
    },
    {
        email: "provider@esperanza.app",
        password: "provider123",
        role: "PROVIDER" as const,
        language_pref: "en",
    },
    {
        email: "user@esperanza.app",
        password: "user123",
        role: "USER" as const,
        language_pref: "en",
    },
];

const sample_events = [
    {
        title_en: "Community Health Fair",
        title_es: "Feria de Salud Comunitaria",
        description_en: "Free health screenings, flu shots, and wellness resources for the whole family.",
        description_es: "Exámenes de salud gratuitos, vacunas contra la gripe y recursos de bienestar para toda la familia.",
        location_name: "Esperanza Community Center",
        latitude: 32.7767,
        longitude: -96.797,
        start_time: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        end_time: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000 + 6 * 60 * 60 * 1000),
        status: "APPROVED" as const,
        category: "Health",
    },
    {
        title_en: "Job Skills Workshop",
        title_es: "Taller de Habilidades Laborales",
        description_en: "Learn resume writing, interview skills, and job search strategies.",
        description_es: "Aprenda redacción de currículum, habilidades para entrevistas y estrategias de búsqueda de empleo.",
        location_name: "Dallas Public Library - Oak Lawn",
        latitude: 32.8078,
        longitude: -96.8011,
        start_time: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        end_time: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000),
        status: "APPROVED" as const,
        category: "Employment",
    },
    {
        title_en: "Family Movie Night",
        title_es: "Noche de Película Familiar",
        description_en: "Bring the kids for a free outdoor movie. Popcorn and drinks provided.",
        description_es: "Traigan a los niños a una película gratuita al aire libre. Palomitas y bebidas incluidas.",
        location_name: "Kidd Springs Park",
        latitude: 32.7821,
        longitude: -96.8123,
        start_time: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        end_time: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000),
        status: "PENDING" as const,
        category: "Recreation",
    },
    {
        title_en: "Tax Assistance Clinic (Cancelled)",
        title_es: "Clínica de Asistencia Fiscal (Cancelado)",
        description_en: "Free tax preparation help for low-income families. This event has been cancelled.",
        description_es: "Ayuda gratuita con la preparación de impuestos para familias de bajos ingresos. Este evento ha sido cancelado.",
        location_name: "Esperanza Community Center",
        latitude: 32.7767,
        longitude: -96.797,
        start_time: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
        end_time: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000 + 4 * 60 * 60 * 1000),
        status: "CANCELLED" as const,
        category: "Financial",
    },
];

const sample_announcement = {
    title_en: "Welcome to Esperanza",
    title_es: "Bienvenido a Esperanza",
    body_en: "We're excited to have you here! Browse events, RSVP for activities, and explore services available in your community.",
    body_es: "¡Nos emociona tenerte aquí! Explora eventos, confirma tu asistencia a actividades y descubre los servicios disponibles en tu comunidad.",
};

async function main() {
    console.log("\n🌿 Esperanza — Seeding database...\n");

    for (const account of seed_accounts) {
        const existing = await db.user.findUnique({
            where: { email: account.email },
        });

        if (existing) {
            console.log(`   ⏭️  ${account.role.padEnd(8)} ${account.email} (already exists)`);
            continue;
        }

        const password_hash = await bcrypt.hash(account.password, 12);

        await db.user.create({
            data: {
                email: account.email,
                password_hash,
                role: account.role,
                language_pref: account.language_pref,
                consented_at: new Date(),
            },
        });

        console.log(`   ✅ ${account.role.padEnd(8)} ${account.email}`);
    }

    const provider = await db.user.findUnique({ where: { email: "provider@esperanza.app" } });
    const user = await db.user.findUnique({ where: { email: "user@esperanza.app" } });
    const admin = await db.user.findUnique({ where: { email: "admin@esperanza.app" } });

    if (provider) {
        const eventCount = await db.event.count();
        if (eventCount === 0) {
            for (const evt of sample_events) {
                await db.event.create({
                    data: {
                        ...evt,
                        provider_id: provider.id,
                    },
                });
                console.log(`   ✅ Event: ${evt.title_en}`);
            }
        } else {
            console.log(`   ⏭️  Events (already seeded)`);
        }
    }

    if (user && provider) {
        const rsvpCount = await db.rsvp.count();
        if (rsvpCount === 0) {
            const approvedEvents = await db.event.findMany({
                where: { status: "APPROVED" },
                take: 2,
            });
            for (const evt of approvedEvents) {
                await db.rsvp.create({
                    data: {
                        user_id: user.id,
                        event_id: evt.id,
                    },
                });
                console.log(`   ✅ RSVP: ${user.email} → ${evt.title_en}`);
            }
        } else {
            console.log(`   ⏭️  RSVPs (already seeded)`);
        }
    }

    if (admin) {
        const announcementCount = await db.announcement.count();
        if (announcementCount === 0) {
            await db.announcement.create({
                data: {
                    ...sample_announcement,
                    author_id: admin.id,
                },
            });
            console.log(`   ✅ Announcement: ${sample_announcement.title_en}`);
        } else {
            console.log(`   ⏭️  Announcements (already seeded)`);
        }
    }

    console.log("\n   ─────────────────────────────────────");
    console.log("   Dev credentials:");
    console.log("   ─────────────────────────────────────");
    for (const account of seed_accounts) {
        console.log(`   ${account.role.padEnd(8)} ${account.email} / ${account.password}`);
    }
    console.log("   ─────────────────────────────────────\n");
}

main()
    .catch((e) => {
        console.error("Seed error:", e);
        process.exit(1);
    })
    .finally(async () => {
        await db.$disconnect();
    });
