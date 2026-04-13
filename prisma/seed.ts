import type { EventStatus, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

import {
  build_dallas_county_demographics_write_data,
  type DallasCountyDemographicsInput,
} from "../src/lib/dallas_county_profile";
import {
  DALLAS_COUNTY_AGE_BAND_OPTIONS,
  DALLAS_COUNTY_ANNUAL_INCOME_OPTIONS,
  DALLAS_COUNTY_COUNTY_OPTIONS,
  DALLAS_COUNTY_EDUCATION_LEVEL_OPTIONS,
  DALLAS_COUNTY_EMPLOYMENT_STATUS_OPTIONS,
  DALLAS_COUNTY_ETHNICITY_OPTIONS,
  DALLAS_COUNTY_GENDER_OPTIONS,
  DALLAS_COUNTY_MARITAL_STATUS_OPTIONS,
  DALLAS_COUNTY_PRIMARY_LANGUAGE_OPTIONS,
  DALLAS_COUNTY_RACE_OPTIONS,
} from "../src/lib/dallas_county_profile_options";
import { db } from "../src/lib/db";

type SeedAccount = {
  username: string;
  email: string;
  password: string;
  role: Role;
  language_pref: "en" | "es";
  share_with_providers: boolean;
  demographics: DallasCountyDemographicsInput;
};

type SeedEvent = {
  title_en: string;
  title_es: string;
  description_en: string;
  description_es: string;
  location_name: string;
  location_address: string;
  latitude: number;
  longitude: number;
  start_time: Date;
  end_time: Date;
  status: EventStatus;
  category: string;
};

const RESIDENT_PASSWORD = "user123";
const GENERATED_RESIDENT_COUNT = 30;

const base_accounts: SeedAccount[] = [
  {
    username: "admin",
    email: "admin@esperanza.app",
    password: "admin123",
    role: "ADMIN",
    language_pref: "en",
    share_with_providers: true,
    demographics: {
      race: "White",
      gender: "Female",
      ethnicity: "Not Hispanic/Latino",
      age_band: "36-45",
      marital_status: "Married",
      children_under_5_count: 0,
      children_5_to_18_count: 1,
      children_over_18_count: 0,
      county_of_residence: "Dallas",
      employment_status: "Employed full-time",
      annual_income_bracket: "$70,000-$80,000",
      education_level: "Graduate degree",
      primary_language: "English",
    },
  },
  {
    username: "provider",
    email: "provider@esperanza.app",
    password: "provider123",
    role: "PROVIDER",
    language_pref: "en",
    share_with_providers: true,
    demographics: {
      race: "Black or African American",
      gender: "Male",
      ethnicity: "Not Hispanic/Latino",
      age_band: "46-55",
      marital_status: "Married",
      children_under_5_count: 0,
      children_5_to_18_count: 2,
      children_over_18_count: 0,
      county_of_residence: "Dallas",
      employment_status: "Employed full-time",
      annual_income_bracket: "$50,000-$60,000",
      education_level: "Bachelor degree",
      primary_language: "English",
    },
  },
  {
    username: "user",
    email: "user@esperanza.app",
    password: RESIDENT_PASSWORD,
    role: "USER",
    language_pref: "en",
    share_with_providers: true,
    demographics: {
      race: "Asian",
      gender: "Female",
      ethnicity: "Hispanic/Latino",
      age_band: "61-75",
      marital_status: "Widowed",
      children_under_5_count: 0,
      children_5_to_18_count: 0,
      children_over_18_count: 2,
      county_of_residence: "Dallas",
      employment_status: "Retired",
      annual_income_bracket: "$20,000-$30,000",
      education_level: "High school diploma",
      primary_language: "English",
    },
  },
];

const sample_announcement = {
  title_en: "Welcome to Esperanza",
  title_es: "Bienvenido a Esperanza",
  body_en:
    "We're excited to have you here! Browse events, RSVP for activities, and explore services available in your community.",
  body_es:
    "¡Nos emociona tenerte aquí! Explora eventos, confirma tu asistencia a actividades y descubre los servicios disponibles en tu comunidad.",
};

const password_hash_cache = new Map<string, string>();

function build_event_window(
  day_offset: number,
  duration_hours: number,
  start_hour = 10,
) {
  const start_time = new Date();
  start_time.setHours(start_hour, 0, 0, 0);
  start_time.setDate(start_time.getDate() + day_offset);

  return {
    start_time,
    end_time: new Date(start_time.getTime() + duration_hours * 60 * 60 * 1000),
  };
}

function build_generated_resident(index: number): SeedAccount {
  const sequence = String(index + 1).padStart(2, "0");
  const is_spanish_pref = index % 3 === 0;
  const language_pref = is_spanish_pref ? "es" : "en";
  const primary_language =
    index % 10 === 0
      ? "Other"
      : is_spanish_pref
        ? "Spanish"
        : DALLAS_COUNTY_PRIMARY_LANGUAGE_OPTIONS[index % 2];

  return {
    username: `resident${sequence}`,
    email: `resident${sequence}@esperanza.app`,
    password: RESIDENT_PASSWORD,
    role: "USER",
    language_pref,
    share_with_providers: index % 6 !== 0,
    demographics: {
      race: DALLAS_COUNTY_RACE_OPTIONS[index % DALLAS_COUNTY_RACE_OPTIONS.length],
      gender:
        DALLAS_COUNTY_GENDER_OPTIONS[index % DALLAS_COUNTY_GENDER_OPTIONS.length],
      ethnicity:
        DALLAS_COUNTY_ETHNICITY_OPTIONS[
          index % DALLAS_COUNTY_ETHNICITY_OPTIONS.length
        ],
      age_band:
        DALLAS_COUNTY_AGE_BAND_OPTIONS[
          index % DALLAS_COUNTY_AGE_BAND_OPTIONS.length
        ],
      marital_status:
        DALLAS_COUNTY_MARITAL_STATUS_OPTIONS[
          index % DALLAS_COUNTY_MARITAL_STATUS_OPTIONS.length
        ],
      children_under_5_count: index % 5 === 0 ? 1 : index % 11 === 0 ? 2 : 0,
      children_5_to_18_count:
        index % 4 === 0 ? 2 : index % 3 === 0 ? 1 : 0,
      children_over_18_count: index % 7 === 0 ? 1 : index % 13 === 0 ? 2 : 0,
      county_of_residence:
        DALLAS_COUNTY_COUNTY_OPTIONS[index % DALLAS_COUNTY_COUNTY_OPTIONS.length],
      employment_status:
        DALLAS_COUNTY_EMPLOYMENT_STATUS_OPTIONS[
          index % DALLAS_COUNTY_EMPLOYMENT_STATUS_OPTIONS.length
        ],
      annual_income_bracket:
        DALLAS_COUNTY_ANNUAL_INCOME_OPTIONS[
          index % DALLAS_COUNTY_ANNUAL_INCOME_OPTIONS.length
        ],
      education_level:
        DALLAS_COUNTY_EDUCATION_LEVEL_OPTIONS[
          index % DALLAS_COUNTY_EDUCATION_LEVEL_OPTIONS.length
        ],
      primary_language,
    },
  };
}

function build_seed_events(): SeedEvent[] {
  return [
    {
      title_en: "Community Health Fair",
      title_es: "Feria de Salud Comunitaria",
      description_en:
        "Free health screenings, flu shots, and wellness resources for the whole family.",
      description_es:
        "Exámenes de salud gratuitos, vacunas contra la gripe y recursos de bienestar para toda la familia.",
      location_name: "Esperanza Community Center",
      location_address: "123 Jefferson Blvd, Dallas, TX 75208",
      latitude: 32.7767,
      longitude: -96.797,
      ...build_event_window(-3, 6, 9),
      status: "APPROVED",
      category: "Health",
    },
    {
      title_en: "Job Skills Workshop",
      title_es: "Taller de Habilidades Laborales",
      description_en:
        "Learn resume writing, interview skills, and job search strategies.",
      description_es:
        "Aprenda redacción de currículum, habilidades para entrevistas y estrategias de búsqueda de empleo.",
      location_name: "Dallas Public Library - Oak Lawn",
      location_address: "4100 Cedar Springs Rd, Dallas, TX 75219",
      latitude: 32.8078,
      longitude: -96.8011,
      ...build_event_window(-6, 3, 14),
      status: "APPROVED",
      category: "Employment",
    },
    {
      title_en: "Family Resource Night",
      title_es: "Noche de Recursos para Familias",
      description_en:
        "School enrollment support, childcare referrals, and family assistance tables.",
      description_es:
        "Apoyo para inscripción escolar, referencias de cuidado infantil y mesas de asistencia familiar.",
      location_name: "Martin Luther King Jr. Community Center",
      location_address: "2922 Martin Luther King Jr Blvd, Dallas, TX 75215",
      latitude: 32.7637,
      longitude: -96.7831,
      ...build_event_window(-13, 3, 17),
      status: "APPROVED",
      category: "Community",
    },
    {
      title_en: "Senior Benefits Clinic",
      title_es: "Clínica de Beneficios para Personas Mayores",
      description_en:
        "One-on-one help with Medicare, SNAP, and utility-assistance applications.",
      description_es:
        "Ayuda individual con solicitudes de Medicare, SNAP y asistencia para servicios públicos.",
      location_name: "Oak Cliff Senior Center",
      location_address: "223 W Colorado Blvd, Dallas, TX 75208",
      latitude: 32.7664,
      longitude: -96.8288,
      ...build_event_window(-28, 4, 10),
      status: "APPROVED",
      category: "Senior Services",
    },
    {
      title_en: "Transit Pass Enrollment Day",
      title_es: "Jornada de Inscripción para Pases de Transporte",
      description_en:
        "Apply for reduced-fare transit cards and learn about neighborhood routes.",
      description_es:
        "Solicite tarjetas de transporte con tarifa reducida y conozca las rutas del vecindario.",
      location_name: "West Dallas Multipurpose Center",
      location_address: "2828 Fish Trap Rd, Dallas, TX 75212",
      latitude: 32.7825,
      longitude: -96.8842,
      ...build_event_window(-64, 5, 11),
      status: "APPROVED",
      category: "Transit",
    },
    {
      title_en: "Back-to-School Community Expo",
      title_es: "Expo Comunitaria de Regreso a Clases",
      description_en:
        "Meet local providers offering school supplies, tutoring, and family support.",
      description_es:
        "Conozca proveedores locales que ofrecen útiles escolares, tutoría y apoyo familiar.",
      location_name: "Pleasant Grove Stadium",
      location_address: "9533 Lake June Rd, Dallas, TX 75217",
      latitude: 32.7417,
      longitude: -96.662,
      ...build_event_window(-182, 5, 12),
      status: "APPROVED",
      category: "Education",
    },
    {
      title_en: "Winter Housing Assistance Fair",
      title_es: "Feria de Asistencia de Vivienda de Invierno",
      description_en:
        "Emergency rental help, utility assistance, and housing navigation support.",
      description_es:
        "Ayuda de emergencia para alquiler, asistencia para servicios públicos y apoyo de navegación de vivienda.",
      location_name: "South Dallas Cultural Center",
      location_address: "3400 S Fitzhugh Ave, Dallas, TX 75210",
      latitude: 32.7611,
      longitude: -96.7619,
      ...build_event_window(-420, 4, 9),
      status: "APPROVED",
      category: "Financial",
    },
    {
      title_en: "Neighborhood Cleanup Kickoff",
      title_es: "Inicio de Limpieza del Vecindario",
      description_en:
        "Volunteer orientation and block beautification planning for local families.",
      description_es:
        "Orientación de voluntarios y planificación para embellecer las cuadras del vecindario.",
      location_name: "Kidd Springs Park",
      location_address: "711 W Canty St, Dallas, TX 75208",
      latitude: 32.7448,
      longitude: -96.8326,
      ...build_event_window(5, 3, 8),
      status: "APPROVED",
      category: "Community",
    },
    {
      title_en: "Family Movie Night",
      title_es: "Noche de Película Familiar",
      description_en:
        "Bring the kids for a free outdoor movie. Popcorn and drinks provided.",
      description_es:
        "Traigan a los niños a una película gratuita al aire libre. Palomitas y bebidas incluidas.",
      location_name: "Kidd Springs Park",
      location_address: "711 W Canty St, Dallas, TX 75208",
      latitude: 32.7448,
      longitude: -96.8326,
      ...build_event_window(12, 3, 19),
      status: "PENDING",
      category: "Recreation",
    },
    {
      title_en: "Tax Assistance Clinic (Cancelled)",
      title_es: "Clínica de Asistencia Fiscal (Cancelado)",
      description_en:
        "Free tax preparation help for low-income families. This event has been cancelled.",
      description_es:
        "Ayuda gratuita con la preparación de impuestos para familias de bajos ingresos. Este evento ha sido cancelado.",
      location_name: "Esperanza Community Center",
      location_address: "123 Jefferson Blvd, Dallas, TX 75208",
      latitude: 32.7767,
      longitude: -96.797,
      ...build_event_window(-20, 4, 10),
      status: "CANCELLED",
      category: "Financial",
    },
  ];
}

async function get_password_hash(password: string) {
  const existing = password_hash_cache.get(password);
  if (existing) return existing;

  const password_hash = await bcrypt.hash(password, 12);
  password_hash_cache.set(password, password_hash);
  return password_hash;
}

async function upsert_seed_account(account: SeedAccount) {
  const password_hash = await get_password_hash(account.password);

  const user = await db.user.upsert({
    where: { email: account.email },
    update: {
      username: account.username,
      password_hash,
      role: account.role,
      language_pref: account.language_pref,
      share_with_providers: account.share_with_providers,
      consented_at: new Date(),
    },
    create: {
      username: account.username,
      email: account.email,
      password_hash,
      role: account.role,
      language_pref: account.language_pref,
      share_with_providers: account.share_with_providers,
      consented_at: new Date(),
    },
  });

  await db.demographics.upsert({
    where: { user_id: user.id },
    update: build_dallas_county_demographics_write_data(account.demographics),
    create: {
      user_id: user.id,
      ...build_dallas_county_demographics_write_data(account.demographics),
    },
  });

  return user;
}

async function main() {
  console.log("\n Esperanza — Seeding database...\n");

  const generated_residents = Array.from(
    { length: GENERATED_RESIDENT_COUNT },
    (_, index) => build_generated_resident(index),
  );
  const all_accounts = [...base_accounts, ...generated_residents];
  const seeded_users = new Map<string, Awaited<ReturnType<typeof upsert_seed_account>>>();

  for (const account of all_accounts) {
    const user = await upsert_seed_account(account);
    seeded_users.set(account.email, user);
    console.log(
      `   ✅ ${account.role.padEnd(8)} ${account.email} ${
        account.share_with_providers ? "[shared]" : "[private]"
      }`,
    );
  }

  const provider = seeded_users.get("provider@esperanza.app");
  const admin = seeded_users.get("admin@esperanza.app");

  if (!provider || !admin) {
    throw new Error("Expected seeded provider and admin accounts to exist");
  }

  await db.providerProfile.upsert({
    where: { user_id: provider.id },
    update: {
      org_name: "Esperanza Community Partners",
      bio: "Demo provider account used for local event analytics and CSV export testing.",
      website_url: "https://esperanza.app/providers/demo",
      contact_email: "provider@esperanza.app",
      contact_phone: "(214) 555-0100",
    },
    create: {
      user_id: provider.id,
      org_name: "Esperanza Community Partners",
      bio: "Demo provider account used for local event analytics and CSV export testing.",
      website_url: "https://esperanza.app/providers/demo",
      contact_email: "provider@esperanza.app",
      contact_phone: "(214) 555-0100",
    },
  });

  await db.event.deleteMany({
    where: { provider_id: provider.id },
  });

  const created_events = [];
  for (const event of build_seed_events()) {
    const created_event = await db.event.create({
      data: {
        ...event,
        provider_id: provider.id,
      },
    });

    created_events.push(created_event);
    console.log(
      `   ✅ Event: ${event.title_en} (${event.status}, ${event.start_time.toISOString().slice(0, 10)})`,
    );
  }

  const approved_events = created_events.filter((event) => event.status === "APPROVED");
  const resident_users = [...seeded_users.entries()]
    .filter(([email, user]) => user.role === "USER" && email !== "admin@esperanza.app")
    .map(([, user]) => user)
    .sort((left, right) => left.email.localeCompare(right.email));

  await db.rsvp.deleteMany({
    where: {
      event_id: {
        in: approved_events.map((event) => event.id),
      },
    },
  });

  let rsvp_count = 0;

  for (const [index, resident] of resident_users.entries()) {
    if (index % 8 === 0) continue;

    const selected_event_indexes = new Set<number>([
      index % approved_events.length,
      (index + 1) % approved_events.length,
    ]);

    if (index % 2 === 0) {
      selected_event_indexes.add(0);
    }

    if (index % 3 === 0) {
      selected_event_indexes.add(2 % approved_events.length);
    }

    if (index % 5 === 0) {
      selected_event_indexes.add(4 % approved_events.length);
    }

    if (index % 7 === 0) {
      selected_event_indexes.add(6 % approved_events.length);
    }

    for (const event_index of selected_event_indexes) {
      await db.rsvp.create({
        data: {
          user_id: resident.id,
          event_id: approved_events[event_index].id,
        },
      });
      rsvp_count += 1;
    }
  }

  console.log(`   ✅ RSVPs refreshed: ${rsvp_count}`);

  await db.announcement.deleteMany({
    where: { title_en: sample_announcement.title_en },
  });
  await db.announcement.create({
    data: {
      ...sample_announcement,
      author_id: admin.id,
    },
  });
  console.log(`   ✅ Announcement: ${sample_announcement.title_en}`);

  console.log("\n   ─────────────────────────────────────");
  console.log("   Dev credentials:");
  console.log("   ─────────────────────────────────────");
  console.log("   ADMIN    admin@esperanza.app / admin123");
  console.log("   PROVIDER provider@esperanza.app / provider123");
  console.log("   USER     user@esperanza.app / user123");
  console.log("   USER     resident01@esperanza.app → resident30@esperanza.app / user123");
  console.log("   ─────────────────────────────────────");
  console.log("   Seed notes:");
  console.log("   - 30 generated resident accounts with mixed demographics");
  console.log("   - Some residents keep sharing disabled to test exclusion");
  console.log("   - Provider events span last week, last month, last year, all time, and upcoming");
  console.log("   ─────────────────────────────────────\n");
}

main()
  .catch((error) => {
    console.error("Seed error:", error);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
