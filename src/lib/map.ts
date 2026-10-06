// Free, keyless vector map style from OpenFreeMap (same provider abide-connect uses).
// No access token, no usage limits; self-hostable if we ever want to.
export const MAP_STYLE_URL = "https://tiles.openfreemap.org/styles/liberty";

// Default map centre — Dallas metro [lng, lat].
export const DALLAS_CENTER: [number, number] = [-96.797, 32.7767];

// Hard geographic scope for address search: [minLon, minLat, maxLon, maxLat].
// Default covers the DFW metroplex (Fort Worth → Dallas → Plano/McKinney, incl. UTD).
// Widen without a rebuild via NEXT_PUBLIC_GEOCODE_BBOX="minLon,minLat,maxLon,maxLat"
// (e.g. all of Texas: "-106.7,25.8,-93.5,36.6").
function parse_bbox(): [number, number, number, number] {
    const raw = process.env.NEXT_PUBLIC_GEOCODE_BBOX;
    if (raw) {
        const p = raw.split(",").map(Number);
        if (p.length === 4 && p.every((n) => !Number.isNaN(n))) {
            return p as [number, number, number, number];
        }
    }
    return [-97.8, 32.3, -96.0, 33.5];
}
export const GEOCODE_BBOX = parse_bbox();
