export type MockUser = {
    id: string;
    email: string;
    role: "USER" | "PROVIDER" | "ADMIN";
    language_pref: string;
    created_at: string;
};

export type MockEvent = {
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
    provider_email: string;
    status: "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED";
    category: string;
    image_url: string | null;
    created_at: string;
    rsvp_count: number;
};

export const mock_users: MockUser[] = [
    {
        id: "user-admin-001",
        email: "admin@esperanzadallas.org",
        role: "ADMIN",
        language_pref: "en",
        created_at: "2024-01-15T10:00:00.000Z"
    },
    {
        id: "user-provider-001",
        email: "maria.garcia@vickerymeadow.org",
        role: "PROVIDER",
        language_pref: "es",
        created_at: "2024-02-01T14:30:00.000Z"
    },
    {
        id: "user-provider-002",
        email: "john.smith@bachmanlake.org",
        role: "PROVIDER",
        language_pref: "en",
        created_at: "2024-02-15T09:00:00.000Z"
    },
    {
        id: "user-regular-001",
        email: "carlos.rodriguez@email.com",
        role: "USER",
        language_pref: "es",
        created_at: "2024-03-01T11:20:00.000Z"
    },
    {
        id: "user-regular-002",
        email: "sarah.johnson@email.com",
        role: "USER",
        language_pref: "en",
        created_at: "2024-03-10T16:45:00.000Z"
    }
];

export const mock_events: MockEvent[] = [
    {
        id: "evt-pending-001",
        title_en: "Free Health Screening Day",
        title_es: "Día gratuito de chequeos de salud",
        description_en: "Blood pressure, glucose, and basic health screenings for adults.",
        description_es: "Presión arterial, glucosa y chequeos de salud básicos para adultos.",
        location_name: "Vickery Meadow Community Center",
        latitude: 32.8753,
        longitude: -96.7689,
        start_time: "2025-04-15T09:00:00.000Z",
        end_time: "2025-04-15T14:00:00.000Z",
        provider_id: "user-provider-001",
        provider_email: "maria.garcia@vickerymeadow.org",
        status: "PENDING",
        category: "Health",
        image_url: null,
        created_at: "2025-03-01T08:00:00.000Z",
        rsvp_count: 0
    },
    {
        id: "evt-pending-002",
        title_en: "Job Readiness Workshop",
        title_es: "Taller de preparación laboral",
        description_en: "Resume building, interview skills, and job search strategies.",
        description_es: "Creación de currículum, habilidades de entrevista y estrategias de búsqueda de empleo.",
        location_name: "Bachman Lake Library",
        latitude: 32.8521,
        longitude: -96.8802,
        start_time: "2025-04-22T10:00:00.000Z",
        end_time: "2025-04-22T12:30:00.000Z",
        provider_id: "user-provider-002",
        provider_email: "john.smith@bachmanlake.org",
        status: "PENDING",
        category: "Employment",
        image_url: null,
        created_at: "2025-03-05T14:00:00.000Z",
        rsvp_count: 3
    },
    {
        id: "evt-pending-003",
        title_en: "ESL Conversation Circle",
        title_es: "Círculo de conversación en inglés",
        description_en: "Practice English in a relaxed setting with other learners.",
        description_es: "Practica inglés en un ambiente relajado con otros estudiantes.",
        location_name: "Oak Lawn Library",
        latitude: 32.8156,
        longitude: -96.8004,
        start_time: "2025-04-10T18:00:00.000Z",
        end_time: "2025-04-10T19:30:00.000Z",
        provider_id: "user-provider-001",
        provider_email: "maria.garcia@vickerymeadow.org",
        status: "PENDING",
        category: "Education",
        image_url: null,
        created_at: "2025-03-08T09:30:00.000Z",
        rsvp_count: 5
    },
    {
        id: "evt-approved-001",
        title_en: "Senior Social Hour",
        title_es: "Hora social para personas mayores",
        description_en: "Coffee, pastries, and fellowship for seniors 55+.",
        description_es: "Café, pasteles y compañerismo para personas mayores de 55 años.",
        location_name: "Lake Highlands Recreation Center",
        latitude: 32.8512,
        longitude: -96.7215,
        start_time: "2025-04-08T14:00:00.000Z",
        end_time: "2025-04-08T16:00:00.000Z",
        provider_id: "user-provider-001",
        provider_email: "maria.garcia@vickerymeadow.org",
        status: "APPROVED",
        category: "Senior",
        image_url: null,
        created_at: "2025-02-20T11:00:00.000Z",
        rsvp_count: 12
    },
    {
        id: "evt-approved-002",
        title_en: "Family Fun Day at Kiest Park",
        title_es: "Día familiar en Parque Kiest",
        description_en: "Games, face painting, and outdoor activities for families.",
        description_es: "Juegos, pintacaritas y actividades al aire libre para familias.",
        location_name: "Kiest Park Pavilion",
        latitude: 32.6823,
        longitude: -96.8534,
        start_time: "2025-04-19T11:00:00.000Z",
        end_time: "2025-04-19T15:00:00.000Z",
        provider_id: "user-provider-002",
        provider_email: "john.smith@bachmanlake.org",
        status: "APPROVED",
        category: "Recreation",
        image_url: null,
        created_at: "2025-02-28T09:00:00.000Z",
        rsvp_count: 24
    },
    {
        id: "evt-approved-003",
        title_en: "DART Pass Assistance",
        title_es: "Asistencia para pase DART",
        description_en: "Help applying for reduced-fare and free DART transit passes.",
        description_es: "Ayuda para solicitar pases DART reducidos y gratuitos.",
        location_name: "West Dallas Multipurpose Center",
        latitude: 32.7801,
        longitude: -96.8923,
        start_time: "2025-04-12T13:00:00.000Z",
        end_time: "2025-04-12T16:00:00.000Z",
        provider_id: "user-provider-001",
        provider_email: "maria.garcia@vickerymeadow.org",
        status: "APPROVED",
        category: "Transit",
        image_url: null,
        created_at: "2025-03-01T10:00:00.000Z",
        rsvp_count: 8
    },
    {
        id: "evt-rejected-001",
        title_en: "Childcare Provider Meetup",
        title_es: "Encuentro de proveedores de cuidado infantil",
        description_en: "Networking event for licensed childcare providers in Dallas County.",
        description_es: "Evento de networking para proveedores de cuidado infantil con licencia en el condado de Dallas.",
        location_name: "Dallas Public Library - Central Branch",
        latitude: 32.7795,
        longitude: -96.8022,
        start_time: "2025-04-25T09:00:00.000Z",
        end_time: "2025-04-25T11:00:00.000Z",
        provider_id: "user-provider-002",
        provider_email: "john.smith@bachmanlake.org",
        status: "REJECTED",
        category: "Childcare",
        image_url: null,
        created_at: "2025-03-03T16:00:00.000Z",
        rsvp_count: 0
    }
];

export const EVENT_CATEGORIES = [
    "Health",
    "Employment",
    "Education",
    "Recreation",
    "Transit",
    "Senior",
    "Childcare",
    "Community"
] as const;

export function filter_events_by_status(events: MockEvent[], status: MockEvent["status"]): MockEvent[] {
    return events.filter((evt) => evt.status === status);
}

export function filter_events_by_provider(events: MockEvent[], provider_id: string): MockEvent[] {
    return events.filter((evt) => evt.provider_id === provider_id);
}
