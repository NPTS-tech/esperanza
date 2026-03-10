// mock data for development — replace with real API calls later

export const ROLES = {
    USER: "USER",
    PROVIDER: "PROVIDER",
    ADMIN: "ADMIN",
} as const;

export const EVENT_STATUS = {
    PENDING: "PENDING",
    APPROVED: "APPROVED",
    REJECTED: "REJECTED",
} as const;

export interface User {
    id: string;
    email: string;
    role: keyof typeof ROLES;
    language_pref: "en" | "es";
    created_at: string;
}

export interface Demographics {
    user_id: string;
    race: string;
    gender: string;
    age: number;
    annual_personal_income: string;
    annual_household_income: string;
    county: string;
    has_children_under_18: boolean;
    has_children_under_5: boolean;
    educational_attainment: string;
    has_personal_vehicle: boolean;
    is_employed: boolean;
    industry_area: string;
}

export interface AppEvent {
    id: string;
    title_en: string;
    title_es: string;
    description_en: string;
    description_es: string;
    location_name: string;
    latitude: number;
    longitude: number;
    start_time: string;
    end_time: string;
    provider_id: string;
    status: keyof typeof EVENT_STATUS;
    category: string;
    created_at: string;
}

export interface RSVP {
    user_id: string;
    event_id: string;
    created_at: string;
}

export interface Announcement {
    id: string;
    title_en: string;
    title_es: string;
    body_en: string;
    body_es: string;
    author_id: string;
    target_role: "ALL" | "USER" | "PROVIDER";
    created_at: string;
}

export interface Service {
    id: string;
    name_en: string;
    name_es: string;
    description_en: string;
    description_es: string;
    category: string;
    eligibility: string;
    location: string;
    phone: string;
    hours: string;
}

// ---- mock current user ----

export const mock_current_user: User = {
    id: "user-001",
    email: "resident@esperanza.app",
    role: "USER",
    language_pref: "en",
    created_at: "2026-01-15T10:00:00Z",
};

// ---- mock events ----

export const mock_events: AppEvent[] = [
    {
        id: "evt-001",
        title_en: "Free Health Screening",
        title_es: "Examen de Salud Gratuito",
        description_en: "Free health screenings including blood pressure, glucose, and BMI checks. Open to all Esperanza residents.",
        description_es: "Exámenes de salud gratuitos que incluyen presión arterial, glucosa e IMC. Abierto a todos los residentes de Esperanza.",
        location_name: "Esperanza Community Center",
        latitude: 32.7767,
        longitude: -96.7970,
        start_time: "2026-03-15T09:00:00Z",
        end_time: "2026-03-15T13:00:00Z",
        provider_id: "user-010",
        status: "APPROVED",
        category: "Health",
        created_at: "2026-02-20T08:00:00Z",
    },
    {
        id: "evt-002",
        title_en: "Job Fair & Resume Workshop",
        title_es: "Feria de Empleo y Taller de Currículum",
        description_en: "Connect with local employers and get professional resume help. Bring your current resume or we'll help create one.",
        description_es: "Conéctese con empleadores locales y obtenga ayuda profesional con su currículum.",
        location_name: "Esperanza Community Center - Main Hall",
        latitude: 32.7767,
        longitude: -96.7970,
        start_time: "2026-03-20T10:00:00Z",
        end_time: "2026-03-20T15:00:00Z",
        provider_id: "user-011",
        status: "APPROVED",
        category: "Employment",
        created_at: "2026-02-22T09:30:00Z",
    },
    {
        id: "evt-003",
        title_en: "Senior Wellness Yoga",
        title_es: "Yoga de Bienestar para Personas Mayores",
        description_en: "Gentle yoga class designed for residents 65+. No experience needed. Mats provided.",
        description_es: "Clase de yoga suave diseñada para residentes de 65+ años. No se necesita experiencia.",
        location_name: "Esperanza Park Pavilion",
        latitude: 32.7780,
        longitude: -96.7955,
        start_time: "2026-03-22T08:00:00Z",
        end_time: "2026-03-22T09:30:00Z",
        provider_id: "user-010",
        status: "APPROVED",
        category: "Recreation",
        created_at: "2026-02-25T11:00:00Z",
    },
    {
        id: "evt-004",
        title_en: "Children's Reading Hour",
        title_es: "Hora de Lectura para Niños",
        description_en: "Bilingual storytime for children ages 3–8. Books, activities, and snacks provided.",
        description_es: "Hora de cuentos bilingüe para niños de 3 a 8 años. Se proporcionan libros, actividades y bocadillos.",
        location_name: "Esperanza Community Center - Room 102",
        latitude: 32.7767,
        longitude: -96.7970,
        start_time: "2026-03-25T15:00:00Z",
        end_time: "2026-03-25T16:30:00Z",
        provider_id: "user-012",
        status: "APPROVED",
        category: "Education",
        created_at: "2026-03-01T14:00:00Z",
    },
    {
        id: "evt-005",
        title_en: "DART Transit Info Session",
        title_es: "Sesión Informativa de Tránsito DART",
        description_en: "Learn about DART bus routes, schedules, and reduced fare programs in your area.",
        description_es: "Conozca las rutas de autobús de DART, horarios y programas de tarifas reducidas en su área.",
        location_name: "Esperanza Community Center",
        latitude: 32.7767,
        longitude: -96.7970,
        start_time: "2026-04-02T11:00:00Z",
        end_time: "2026-04-02T12:30:00Z",
        provider_id: "user-013",
        status: "PENDING",
        category: "Transit",
        created_at: "2026-03-05T10:00:00Z",
    },
    {
        id: "evt-006",
        title_en: "Community Garden Volunteer Day",
        title_es: "Día de Voluntariado en el Jardín Comunitario",
        description_en: "Help plant and maintain the Esperanza community garden. Tools and water provided.",
        description_es: "Ayude a plantar y mantener el jardín comunitario de Esperanza. Se proporcionan herramientas y agua.",
        location_name: "Esperanza Community Garden",
        latitude: 32.7790,
        longitude: -96.7940,
        start_time: "2026-04-05T09:00:00Z",
        end_time: "2026-04-05T12:00:00Z",
        provider_id: "user-011",
        status: "APPROVED",
        category: "Recreation",
        created_at: "2026-03-08T07:00:00Z",
    },
];

export const mock_rsvps: RSVP[] = [
    { user_id: "user-001", event_id: "evt-001", created_at: "2026-03-10T12:00:00Z" },
    { user_id: "user-001", event_id: "evt-003", created_at: "2026-03-11T09:00:00Z" },
];

// ---- mock services ----

export const mock_services: Service[] = [
    {
        id: "svc-001",
        name_en: "Food Pantry",
        name_es: "Despensa de Alimentos",
        description_en: "Weekly food distribution for Esperanza residents. No ID required.",
        description_es: "Distribución semanal de alimentos para residentes de Esperanza. No se requiere identificación.",
        category: "Food",
        eligibility: "All residents",
        location: "Esperanza Community Center",
        phone: "(214) 555-0101",
        hours: "Tue & Thu, 9 AM – 12 PM",
    },
    {
        id: "svc-002",
        name_en: "Senior Services",
        name_es: "Servicios para Personas Mayores",
        description_en: "Programs and resources for residents age 65+, including meal delivery, wellness checks, and social activities.",
        description_es: "Programas y recursos para residentes de 65+ años, incluyendo entrega de comidas y actividades sociales.",
        category: "Senior",
        eligibility: "Age 65+",
        location: "Esperanza Community Center - Suite 200",
        phone: "(214) 555-0102",
        hours: "Mon – Fri, 8 AM – 5 PM",
    },
    {
        id: "svc-003",
        name_en: "Employment Assistance",
        name_es: "Asistencia de Empleo",
        description_en: "Job search help, resume building, and interview preparation. Bilingual staff available.",
        description_es: "Ayuda con búsqueda de empleo, creación de currículum y preparación para entrevistas. Personal bilingüe disponible.",
        category: "Employment",
        eligibility: "All residents",
        location: "Esperanza Community Center - Room 105",
        phone: "(214) 555-0103",
        hours: "Mon, Wed, Fri, 10 AM – 3 PM",
    },
    {
        id: "svc-004",
        name_en: "Childcare Resources",
        name_es: "Recursos de Cuidado Infantil",
        description_en: "Information about subsidized childcare, pre-K programs, and after-school care in the Esperanza area.",
        description_es: "Información sobre cuidado infantil subsidiado, programas pre-K y cuidado después de la escuela.",
        category: "Childcare",
        eligibility: "Families with children under 18",
        location: "Esperanza Community Center - Room 110",
        phone: "(214) 555-0104",
        hours: "Mon – Fri, 9 AM – 4 PM",
    },
    {
        id: "svc-005",
        name_en: "Transit Assistance",
        name_es: "Asistencia de Transporte",
        description_en: "Help navigating DART routes, applying for reduced fare cards, and planning trips.",
        description_es: "Ayuda para navegar rutas de DART, solicitar tarjetas de tarifa reducida y planificar viajes.",
        category: "Transit",
        eligibility: "All residents",
        location: "Esperanza Community Center - Front Desk",
        phone: "(214) 555-0105",
        hours: "Mon – Fri, 8 AM – 6 PM",
    },
];

// ---- mock announcements ----

export const mock_announcements: Announcement[] = [
    {
        id: "ann-001",
        title_en: "Community Center Extended Hours",
        title_es: "Horario Extendido del Centro Comunitario",
        body_en: "Starting March 1st, the Esperanza Community Center will be open until 8 PM on weekdays. Come visit us!",
        body_es: "A partir del 1 de marzo, el Centro Comunitario Esperanza estará abierto hasta las 8 PM entre semana. ¡Visítenos!",
        author_id: "user-020",
        target_role: "ALL",
        created_at: "2026-02-28T10:00:00Z",
    },
    {
        id: "ann-002",
        title_en: "New Walking Trail Open",
        title_es: "Nuevo Sendero para Caminar Abierto",
        body_en: "The new half-mile walking trail along Esperanza Creek is now open. Enjoy the spring weather and explore!",
        body_es: "El nuevo sendero de media milla a lo largo del arroyo Esperanza ya está abierto. ¡Disfrute del clima primaveral!",
        author_id: "user-020",
        target_role: "ALL",
        created_at: "2026-03-05T14:00:00Z",
    },
];

// ---- mock helpers ----

export function get_event_by_id(id: string): AppEvent | undefined {
    return mock_events.find((e) => e.id === id);
}

export function get_approved_events(): AppEvent[] {
    return mock_events.filter((e) => e.status === "APPROVED");
}

export function get_pending_events(): AppEvent[] {
    return mock_events.filter((e) => e.status === "PENDING");
}

export function is_user_rsvped(user_id: string, event_id: string): boolean {
    return mock_rsvps.some((r) => r.user_id === user_id && r.event_id === event_id);
}

export function get_user_rsvps(user_id: string): RSVP[] {
    return mock_rsvps.filter((r) => r.user_id === user_id);
}

export function format_date(iso: string, locale: string = "en"): string {
    const date = new Date(iso);
    return date.toLocaleDateString(locale === "es" ? "es-US" : "en-US", {
        weekday: "short",
        year: "numeric",
        month: "short",
        day: "numeric",
    });
}

export function format_time(iso: string, locale: string = "en"): string {
    const date = new Date(iso);
    return date.toLocaleTimeString(locale === "es" ? "es-US" : "en-US", {
        hour: "numeric",
        minute: "2-digit",
    });
}

// mock auth functions
export function mock_login(email: string, password: string): User | null {
    if (email && password) {
        return mock_current_user;
    }
    return null;
}

export function mock_register(data: Record<string, string>): User {
    return {
        id: "user-" + Math.random().toString(36).substring(2, 8),
        email: data.email || "",
        role: "USER",
        language_pref: (data.language_pref as "en" | "es") || "en",
        created_at: new Date().toISOString(),
    };
}

// demographic dropdown options (Census-aligned)
export const RACE_OPTIONS = [
    "White",
    "Black or African American",
    "American Indian or Alaska Native",
    "Asian",
    "Native Hawaiian or Other Pacific Islander",
    "Two or More Races",
    "Other",
];

export const GENDER_OPTIONS = ["Male", "Female", "Non-binary", "Prefer not to say"];

export const INCOME_BRACKETS = [
    "Less than $15,000",
    "$15,000 – $24,999",
    "$25,000 – $34,999",
    "$35,000 – $49,999",
    "$50,000 – $74,999",
    "$75,000 – $99,999",
    "$100,000 or more",
    "Prefer not to say",
];

export const COUNTY_OPTIONS = [
    "Dallas County",
    "Tarrant County",
    "Collin County",
    "Denton County",
    "Ellis County",
    "Kaufman County",
    "Rockwall County",
    "Other",
];

export const EDUCATION_OPTIONS = [
    "Less than high school",
    "High school diploma or GED",
    "Some college, no degree",
    "Associate's degree",
    "Bachelor's degree",
    "Graduate or professional degree",
];

export const INDUSTRY_OPTIONS = [
    "Agriculture",
    "Construction",
    "Manufacturing",
    "Retail Trade",
    "Transportation & Warehousing",
    "Information & Technology",
    "Finance & Insurance",
    "Healthcare & Social Assistance",
    "Education",
    "Food Service & Hospitality",
    "Government",
    "Other",
    "Not employed",
];

export const EVENT_CATEGORIES = [
    "Health",
    "Employment",
    "Education",
    "Recreation",
    "Transit",
    "Senior",
    "Childcare",
    "Community",
    "Other",
];
