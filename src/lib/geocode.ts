// Address geocoding for the event location picker.
//
// Uses Geoapify (fast, managed; free tier is ample for occasional event creation)
// when NEXT_PUBLIC_GEOAPIFY_KEY is set, and falls back to Photon (free, keyless,
// but the public instance is slow) otherwise — so dev works with no key.
// Both are OpenStreetMap-based. Results are hard-scoped to GEOCODE_BBOX.

import { GEOCODE_BBOX } from "@/lib/map";

export interface GeoResult {
    /** Short place name, e.g. "Kidd Springs Park" or "711 W Canty St". */
    name: string;
    /** Full formatted address for display. */
    label: string;
    lat: number;
    lon: number;
}

const GEOAPIFY_KEY = process.env.NEXT_PUBLIC_GEOAPIFY_KEY;
const PHOTON = process.env.NEXT_PUBLIC_PHOTON_URL || "https://photon.komoot.io";

// Small in-memory cache so backspacing/retyping is instant and skips the network.
const CACHE_MAX = 50;
const search_cache = new Map<string, GeoResult[]>();
function cache_set(key: string, value: GeoResult[]) {
    if (search_cache.size >= CACHE_MAX) {
        const oldest = search_cache.keys().next().value;
        if (oldest !== undefined) search_cache.delete(oldest);
    }
    search_cache.set(key, value);
}

// ── Geoapify ──
type GeoapifyFeature = { properties: Record<string, string | number | undefined> };
function geoapify_format(f: GeoapifyFeature): GeoResult {
    const p = f.properties;
    return {
        name: String(p.name || p.address_line1 || p.formatted || ""),
        label: String(p.formatted || p.address_line1 || p.name || ""),
        lat: Number(p.lat),
        lon: Number(p.lon),
    };
}
async function geoapify_search(
    q: string,
    proximity: [number, number],
    signal: AbortSignal | undefined,
    limit: number,
): Promise<GeoResult[]> {
    const [minLon, minLat, maxLon, maxLat] = GEOCODE_BBOX;
    const url =
        `https://api.geoapify.com/v1/geocode/autocomplete?text=${encodeURIComponent(q)}` +
        `&limit=${limit}&lang=en` +
        `&bias=proximity:${proximity[0]},${proximity[1]}` +
        `&filter=rect:${minLon},${minLat},${maxLon},${maxLat}` +
        `&apiKey=${GEOAPIFY_KEY}`;
    const res = await fetch(url, { signal });
    if (!res.ok) return [];
    const data = (await res.json()) as { features?: GeoapifyFeature[] };
    return (data.features ?? []).map(geoapify_format).filter((r) => !Number.isNaN(r.lat));
}
async function geoapify_reverse(lat: number, lon: number): Promise<string | null> {
    const url =
        `https://api.geoapify.com/v1/geocode/reverse?lat=${lat}&lon=${lon}` +
        `&lang=en&apiKey=${GEOAPIFY_KEY}`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = (await res.json()) as { features?: GeoapifyFeature[] };
    const f = data.features?.[0];
    return f ? geoapify_format(f).label : null;
}

// ── Photon (keyless fallback) ──
type PhotonFeature = {
    geometry: { coordinates: [number, number] };
    properties: Record<string, string | undefined>;
};
function photon_format(feature: PhotonFeature): GeoResult {
    const p = feature.properties;
    const [lon, lat] = feature.geometry.coordinates;
    const street_line =
        [p.housenumber, p.street].filter(Boolean).join(" ") || p.name || "";
    const name = p.name || street_line || p.city || "Selected location";
    const label = [street_line, p.city, p.state, p.postcode]
        .filter((x) => x && x.length > 0)
        .join(", ");
    return { name, label: label || name, lat, lon };
}
async function photon_search(
    q: string,
    proximity: [number, number],
    signal: AbortSignal | undefined,
    limit: number,
): Promise<GeoResult[]> {
    const url =
        `${PHOTON}/api/?q=${encodeURIComponent(q)}` +
        `&limit=${limit}&lang=en&lon=${proximity[0]}&lat=${proximity[1]}` +
        `&bbox=${GEOCODE_BBOX.join(",")}&location_bias_scale=0.4&zoom=12`;
    const res = await fetch(url, { signal });
    if (!res.ok) return [];
    const data = (await res.json()) as { features?: PhotonFeature[] };
    return (data.features ?? []).map(photon_format);
}
async function photon_reverse(lat: number, lon: number): Promise<string | null> {
    const res = await fetch(`${PHOTON}/reverse?lat=${lat}&lon=${lon}&lang=en`);
    if (!res.ok) return null;
    const data = (await res.json()) as { features?: PhotonFeature[] };
    const f = data.features?.[0];
    return f ? photon_format(f).label : null;
}

// ── Public API (provider-agnostic) ──

/** Forward autocomplete search, scoped + biased to the local region. */
export async function geocode_search(
    query: string,
    proximity: [number, number],
    signal?: AbortSignal,
    limit = 5,
): Promise<GeoResult[]> {
    const q = query.trim();
    if (q.length < 3) return [];

    const key = `${q.toLowerCase()}|${proximity[0]},${proximity[1]}`;
    const cached = search_cache.get(key);
    if (cached) return cached;

    try {
        const results = GEOAPIFY_KEY
            ? await geoapify_search(q, proximity, signal, limit)
            : await photon_search(q, proximity, signal, limit);
        cache_set(key, results);
        return results;
    } catch {
        // Aborted (stale keystroke) or network error — caller ignores aborted ones.
        return [];
    }
}

/** Reverse geocode a dropped/dragged pin to a human label. */
export async function geocode_reverse(lat: number, lon: number): Promise<string | null> {
    try {
        return GEOAPIFY_KEY
            ? await geoapify_reverse(lat, lon)
            : await photon_reverse(lat, lon);
    } catch {
        return null;
    }
}
