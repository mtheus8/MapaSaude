import { useEffect, useRef } from "react";
import L from "leaflet";
import { HealthUnit } from "../types";
import { categoryColors, categoryIcons } from "../mockData";
import { RouteResult, MODE_CONFIG } from "../routingService";

export interface ActiveRoute {
  result: RouteResult;
  originLatLng: [number, number];
}

interface MapComponentProps {
  units: HealthUnit[];
  selectedUnit: HealthUnit | null;
  userLocation: [number, number] | null;
  onSelectUnit: (unit: HealthUnit) => void;
  mapCenter: [number, number];
  activeRoute: ActiveRoute | null;
  onMapClick?: (lat: number, lng: number) => void;
}

// ─── Icon factories ────────────────────────────────────────────────────────────
function createPinIcon(category: string, selected: boolean) {
  const color = categoryColors[category] || "#64748b";
  const icon = categoryIcons[category] || "🏥";
  const size = selected ? 48 : 40;
  const shadow = selected
    ? `box-shadow:0 0 0 4px ${color}55,0 4px 14px rgba(0,0,0,0.35)`
    : "box-shadow:0 2px 8px rgba(0,0,0,0.3)";
  return L.divIcon({
    className: "",
    html: `<div style="width:${size}px;height:${size}px;background:${color};border:3px solid white;border-radius:50% 50% 50% 0;transform:rotate(-45deg);${shadow};display:flex;align-items:center;justify-content:center;transition:all .15s">
      <span style="transform:rotate(45deg);font-size:${selected ? 20 : 17}px;line-height:1">${icon}</span>
    </div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size],
    popupAnchor: [0, -size],
  });
}

function createUserIcon() {
  return L.divIcon({
    className: "",
    html: `<div style="position:relative;width:22px;height:22px">
      <div style="position:absolute;inset:-6px;border-radius:50%;background:rgba(37,99,235,0.2);animation:pulse 1.8s ease-in-out infinite"></div>
      <div style="position:absolute;inset:0;border-radius:50%;background:#2563eb;border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.4)"></div>
    </div>
    <style>@keyframes pulse{0%,100%{transform:scale(1);opacity:.6}50%{transform:scale(1.8);opacity:0}}</style>`,
    iconSize: [22, 22],
    iconAnchor: [11, 11],
  });
}

function createRouteOriginIcon(color: string) {
  return L.divIcon({
    className: "",
    html: `<div style="width:18px;height:18px;background:${color};border:3px solid white;border-radius:50%;box-shadow:0 2px 8px rgba(0,0,0,0.35)"></div>`,
    iconSize: [18, 18],
    iconAnchor: [9, 9],
  });
}

function createRouteDestIcon(color: string) {
  return L.divIcon({
    className: "",
    html: `<div style="width:32px;height:32px;background:${color};border:3px solid white;border-radius:50% 50% 50% 0;transform:rotate(-45deg);box-shadow:0 2px 8px rgba(0,0,0,0.35);display:flex;align-items:center;justify-content:center">
      <span style="transform:rotate(45deg);font-size:14px">🏁</span>
    </div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
  });
}

// ─── Component ─────────────────────────────────────────────────────────────────
export function MapComponent({
  units, selectedUnit, userLocation, onSelectUnit,
  mapCenter, activeRoute, onMapClick,
}: MapComponentProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<Map<string, L.Marker>>(new Map());
  const userMarkerRef = useRef<L.Marker | null>(null);
  const userCircleRef = useRef<L.Circle | null>(null);
  const routeCasingRef = useRef<L.Polyline | null>(null);
  const routeLayerRef = useRef<L.Polyline | null>(null);
  const routeOriginMarkerRef = useRef<L.Marker | null>(null);
  const routeDestMarkerRef = useRef<L.Marker | null>(null);
  const routeStepMarkersRef = useRef<L.CircleMarker[]>([]);
  const initializedRef = useRef(false);
  // Always holds the latest onSelectUnit without stale closure issues
  const onSelectUnitRef = useRef(onSelectUnit);
  useEffect(() => { onSelectUnitRef.current = onSelectUnit; });

  // Init map once
  useEffect(() => {
    if (!containerRef.current || initializedRef.current) return;
    initializedRef.current = true;

    const map = L.map(containerRef.current, { center: mapCenter, zoom: 14, zoomControl: true });
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(map);

    map.on("click", (e) => onMapClick?.(e.latlng.lat, e.latlng.lng));

    mapRef.current = map;
    return () => {
      map.remove();
      mapRef.current = null;
      initializedRef.current = false;
      // Clear marker cache so they get re-added to the new map instance
      markersRef.current.clear();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Center map
  useEffect(() => {
    const map = mapRef.current;
    if (!map || activeRoute) return; // don't override when routing
    map.setView(mapCenter, map.getZoom(), { animate: true });
  }, [mapCenter, activeRoute]);

  // Sync unit markers — onSelectUnit via ref to avoid stale closures
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const existing = markersRef.current;
    const currentIds = new Set(units.map((u) => u.id));

    existing.forEach((marker, id) => {
      if (!currentIds.has(id)) { marker.remove(); existing.delete(id); }
    });

    units.forEach((unit) => {
      const isSelected = selectedUnit?.id === unit.id;
      const color = categoryColors[unit.category];

      if (existing.has(unit.id)) {
        existing.get(unit.id)!.setIcon(createPinIcon(unit.category, isSelected));
        return;
      }

      const marker = L.marker([unit.lat, unit.lng], { icon: createPinIcon(unit.category, isSelected) });
      const popupHtml = `
        <div style="min-width:190px;font-family:system-ui,sans-serif">
          <p style="font-weight:700;font-size:13px;color:${color};margin:0 0 4px">${categoryIcons[unit.category]} ${unit.name}</p>
          <p style="font-size:11px;color:#64748b;margin:0 0 4px">${unit.address}, ${unit.neighborhood}</p>
          <p style="font-size:11px;margin:0 0 8px">⭐ ${unit.rating} (${unit.totalReviews} avaliações)</p>
          <p style="font-size:11px;color:#475569;margin:0 0 8px">🕐 ${unit.hours}</p>
          <button id="detail-btn-${unit.id}" style="background:${color};color:white;border:none;border-radius:6px;padding:6px 0;font-size:12px;font-weight:600;cursor:pointer;width:100%">Ver detalhes →</button>
        </div>`;

      marker.bindPopup(L.popup({ closeButton: true, maxWidth: 240 }).setContent(popupHtml));
      // Use ref so the handler always calls the latest onSelectUnit
      marker.on("popupopen", () => {
        setTimeout(() => {
          const btn = document.getElementById(`detail-btn-${unit.id}`);
          if (btn) btn.onclick = () => { onSelectUnitRef.current(unit); marker.closePopup(); };
        }, 50);
      });
      marker.on("click", () => onSelectUnitRef.current(unit));
      marker.addTo(map);
      existing.set(unit.id, marker);
    });
  // onSelectUnit intentionally excluded — handled via ref above
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [units, selectedUnit]);

  // Update selected marker icons
  useEffect(() => {
    markersRef.current.forEach((marker, id) => {
      const unit = units.find((u) => u.id === id);
      if (unit) marker.setIcon(createPinIcon(unit.category, selectedUnit?.id === id));
    });
  }, [selectedUnit, units]);

  // User location
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    userMarkerRef.current?.remove(); userMarkerRef.current = null;
    userCircleRef.current?.remove(); userCircleRef.current = null;

    if (userLocation) {
      userCircleRef.current = L.circle(userLocation, {
        radius: 150, color: "#2563eb", fillColor: "#2563eb", fillOpacity: 0.12, weight: 1,
      }).addTo(map);
      userMarkerRef.current = L.marker(userLocation, { icon: createUserIcon() })
        .bindPopup("<b>📍 Sua localização</b>").addTo(map);
    }
  }, [userLocation]);

  // ── Route polyline ────────────────────────────────────────────────────────────
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Clear previous route
    routeCasingRef.current?.remove(); routeCasingRef.current = null;
    routeLayerRef.current?.remove(); routeLayerRef.current = null;
    routeOriginMarkerRef.current?.remove(); routeOriginMarkerRef.current = null;
    routeDestMarkerRef.current?.remove(); routeDestMarkerRef.current = null;
    routeStepMarkersRef.current.forEach((m) => m.remove());
    routeStepMarkersRef.current = [];

    if (!activeRoute) return;

    const { result, originLatLng } = activeRoute;
    const { lineColor, color } = MODE_CONFIG[result.mode];

    // White casing polyline (border effect)
    routeCasingRef.current = L.polyline(result.coordinates, {
      color: "white", weight: 8, opacity: 0.6, lineJoin: "round", lineCap: "round",
    }).addTo(map);

    routeLayerRef.current = L.polyline(result.coordinates, {
      color: lineColor, weight: 5, opacity: 0.95, lineJoin: "round", lineCap: "round",
    }).addTo(map);

    // Origin marker
    routeOriginMarkerRef.current = L.marker(originLatLng, { icon: createRouteOriginIcon(color) })
      .bindPopup("<b>📍 Ponto de partida</b>").addTo(map);

    // Destination marker (last coordinate)
    const dest = result.coordinates[result.coordinates.length - 1];
    routeDestMarkerRef.current = L.marker(dest, { icon: createRouteDestIcon(color) })
      .bindPopup("<b>🏁 Destino</b>").addTo(map);

    // Draw small dots at each turn
    result.steps.slice(1, -1).forEach((step) => {
      const dot = L.circleMarker(step.coordinates, {
        radius: 4, color: "white", fillColor: lineColor,
        fillOpacity: 1, weight: 2,
      }).addTo(map);
      routeStepMarkersRef.current.push(dot);
    });

    // Fit bounds to show full route
    const bounds = L.latLngBounds(result.coordinates);
    map.fitBounds(bounds, { padding: [60, 60], animate: true });

  }, [activeRoute]);

  return (
    <div className="relative w-full h-full">
      <div ref={containerRef} style={{ width: "100%", height: "100%" }} />
    </div>
  );
}
