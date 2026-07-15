export type TransportMode = "driving" | "walking" | "cycling";

export interface RouteStep {
  instruction: string;
  street: string;
  distance: number; // metres
  duration: number; // seconds
  maneuver: string;
  coordinates: [number, number]; // [lat, lng] of the step
}

export interface RouteResult {
  coordinates: [number, number][]; // [lat, lng] ordered
  distance: number;  // metres
  duration: number;  // seconds
  steps: RouteStep[];
  mode: TransportMode;
}

// ─── Portuguese maneuver translations ─────────────────────────────────────────
const TURN_MODIFIER: Record<string, string> = {
  uturn: "faça o retorno",
  "sharp right": "vire à direita acentuada",
  right: "vire à direita",
  "slight right": "vire levemente à direita",
  straight: "siga em frente",
  "slight left": "vire levemente à esquerda",
  left: "vire à esquerda",
  "sharp left": "vire à esquerda acentuada",
};

const MANEUVER_TYPE: Record<string, string> = {
  depart: "Saia",
  arrive: "Chegou ao destino",
  turn: "Vire",
  "new name": "Continue em",
  merge: "Incorpore na via",
  "on ramp": "Entre na rampa",
  "off ramp": "Saia pela rampa",
  fork: "Na bifurcação",
  "end of road": "Ao final da rua",
  roundabout: "Na rotatória",
  rotary: "Na rotatória",
  "roundabout turn": "Na rotatória",
  notification: "Continue",
  "use lane": "Use a faixa",
};

function buildInstruction(step: { maneuver: { type: string; modifier?: string }; name: string }): string {
  const { type, modifier } = step.maneuver;
  const street = step.name ? ` em ${step.name}` : "";

  if (type === "arrive") return "Chegou ao destino 🏁";
  if (type === "depart") return `Saia${street}`;

  const base = MANEUVER_TYPE[type] ?? "Continue";
  const mod = modifier ? ` ${TURN_MODIFIER[modifier] ?? modifier}` : "";
  return `${base}${mod}${street}`;
}

function formatDistance(m: number): string {
  return m < 1000 ? `${Math.round(m)} m` : `${(m / 1000).toFixed(1)} km`;
}

function getManeuverIcon(type: string, modifier?: string): string {
  if (type === "arrive") return "🏁";
  if (type === "depart") return "🚦";
  if (type === "roundabout" || type === "rotary") return "🔄";
  if (!modifier) return "⬆️";
  const icons: Record<string, string> = {
    uturn: "↩️", "sharp right": "↱", right: "➡️",
    "slight right": "↗️", straight: "⬆️",
    "slight left": "↖️", left: "⬅️", "sharp left": "↲",
  };
  return icons[modifier] ?? "⬆️";
}

// ─── OSRM API ─────────────────────────────────────────────────────────────────
const OSRM_BASE = "https://router.project-osrm.org/route/v1";

export async function fetchRoute(
  origin: [number, number],
  destination: [number, number],
  mode: TransportMode
): Promise<RouteResult | null> {
  const profile = mode; // driving | walking | cycling
  // OSRM expects lng,lat order
  const coords = `${origin[1]},${origin[0]};${destination[1]},${destination[0]}`;
  const url = `${OSRM_BASE}/${profile}/${coords}?overview=full&geometries=geojson&steps=true`;

  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`OSRM HTTP ${res.status}`);
    const data = await res.json();

    if (data.code !== "Ok" || !data.routes?.length) return null;

    const route = data.routes[0];

    // GeoJSON coords are [lng, lat] — flip to [lat, lng] for Leaflet
    const coordinates: [number, number][] = route.geometry.coordinates.map(
      ([lng, lat]: [number, number]) => [lat, lng]
    );

    // Flatten all steps from all legs
    const steps: RouteStep[] = [];
    for (const leg of route.legs) {
      for (const step of leg.steps) {
        steps.push({
          instruction: buildInstruction(step),
          street: step.name || "",
          distance: step.distance,
          duration: step.duration,
          maneuver: getManeuverIcon(step.maneuver.type, step.maneuver.modifier),
          coordinates: [
            step.maneuver.location[1], // lat
            step.maneuver.location[0], // lng
          ],
        });
      }
    }

    return {
      coordinates,
      distance: route.distance,
      duration: route.duration,
      steps,
      mode,
    };
  } catch (err) {
    console.warn("OSRM routing error:", err);
    return null;
  }
}

// ─── Nominatim address search (reused from Sidebar) ──────────────────────────
export interface GeocodedPlace {
  display_name: string;
  lat: string;
  lon: string;
  place_id: string;
}

export async function geocodeAddress(query: string): Promise<GeocodedPlace[]> {
  if (query.trim().length < 3) return [];
  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("q", query);
  url.searchParams.set("countrycodes", "br");
  url.searchParams.set("format", "json");
  url.searchParams.set("limit", "5");
  url.searchParams.set("accept-language", "pt-BR");
  try {
    const res = await fetch(url.toString());
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
export function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.ceil((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}min`;
  return `${m} min`;
}

export { formatDistance };

export const MODE_CONFIG: Record<TransportMode, { label: string; icon: string; color: string; lineColor: string }> = {
  driving: { label: "Carro", icon: "🚗", color: "#2563eb", lineColor: "#3b82f6" },
  walking: { label: "A pé", icon: "🚶", color: "#16a34a", lineColor: "#22c55e" },
  cycling: { label: "Bicicleta", icon: "🚲", color: "#d97706", lineColor: "#f59e0b" },
};
