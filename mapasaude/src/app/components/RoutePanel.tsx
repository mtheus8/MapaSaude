import React, { useState, useEffect, useRef } from "react";
import {
  X, MapPin, Navigation, Loader2, ChevronDown, ChevronUp,
  RotateCcw, Search, AlertTriangle, Clock, Ruler,
} from "lucide-react";
import { HealthUnit } from "../types";
import { categoryColors, categoryIcons } from "../mockData";
import {
  TransportMode, RouteResult, MODE_CONFIG,
  fetchRoute, geocodeAddress, GeocodedPlace,
  formatDuration, formatDistance,
} from "../routingService";

interface RoutePanelProps {
  unit: HealthUnit;
  userLocation: [number, number] | null;
  onClose: () => void;
  onRouteChange: (result: RouteResult | null, origin: [number, number] | null) => void;
}

type OriginType = "my-location" | "custom";

export function RoutePanel({ unit, userLocation, onClose, onRouteChange }: RoutePanelProps) {
  const [mode, setMode] = useState<TransportMode>("driving");
  const [originType, setOriginType] = useState<OriginType>("my-location");
  const [customOrigin, setCustomOrigin] = useState<[number, number] | null>(null);
  const [addressQuery, setAddressQuery] = useState("");
  const [addressResults, setAddressResults] = useState<GeocodedPlace[]>([]);
  const [addressLoading, setAddressLoading] = useState(false);
  const [showAddressDrop, setShowAddressDrop] = useState(false);

  // Route state per mode
  const [routeMap, setRouteMap] = useState<Partial<Record<TransportMode, RouteResult | null>>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [stepsOpen, setStepsOpen] = useState(false);

  // Cache ref avoids stale-closure issues — always readable without re-rendering
  const cacheRef = useRef<Partial<Record<TransportMode, RouteResult | null>>>({});
  const cancelRef = useRef<(() => void) | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dropRef = useRef<HTMLDivElement>(null);

  const origin: [number, number] | null =
    originType === "my-location" ? userLocation : customOrigin;

  // ── Main fetch effect ─────────────────────────────────────────────────────
  useEffect(() => {
    if (!origin) {
      onRouteChange(null, null);
      return;
    }

    // Check cache (ref, never stale)
    if (cacheRef.current[mode] !== undefined) {
      const cached = cacheRef.current[mode]!;
      onRouteChange(cached, origin);
      setRouteMap((prev) => ({ ...prev, [mode]: cached }));
      return;
    }

    // Cancel any in-flight fetch
    let cancelled = false;
    cancelRef.current = () => { cancelled = true; };

    setLoading(true);
    setError("");

    fetchRoute(origin, [unit.lat, unit.lng], mode).then((result) => {
      if (cancelled) return;
      cacheRef.current[mode] = result;
      setRouteMap((prev) => ({ ...prev, [mode]: result }));
      if (!result) {
        setError("Não foi possível calcular a rota. Verifique a conexão e tente novamente.");
        onRouteChange(null, null);
      } else {
        onRouteChange(result, origin);
      }
      setLoading(false);
    });

    return () => { cancelled = true; };
    // origin must be serialised so the effect sees coordinate changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, origin?.[0], origin?.[1], unit.id]);

  // ── When origin changes, clear cache ────────────────────────────────────
  useEffect(() => {
    cacheRef.current = {};
    setRouteMap({});
    setError("");
  }, [origin?.[0], origin?.[1]]);

  // ── Background pre-fetch the other two modes ─────────────────────────────
  useEffect(() => {
    if (!origin) return;
    const modes: TransportMode[] = ["driving", "walking", "cycling"];
    modes.forEach((m) => {
      if (m === mode) return;
      if (cacheRef.current[m] !== undefined) return;
      fetchRoute(origin, [unit.lat, unit.lng], m).then((r) => {
        if (cacheRef.current[m] !== undefined) return; // already populated
        cacheRef.current[m] = r;
        setRouteMap((prev) => ({ ...prev, [m]: r ?? undefined }));
      });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [origin?.[0], origin?.[1], unit.id]);

  // ── Address search ────────────────────────────────────────────────────────
  function handleAddressInput(val: string) {
    setAddressQuery(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (val.trim().length < 3) { setAddressResults([]); setShowAddressDrop(false); return; }
    setAddressLoading(true);
    debounceRef.current = setTimeout(async () => {
      const res = await geocodeAddress(val);
      setAddressResults(res);
      setShowAddressDrop(res.length > 0);
      setAddressLoading(false);
    }, 400);
  }

  function handleAddressSelect(place: GeocodedPlace) {
    const lat = parseFloat(place.lat);
    const lng = parseFloat(place.lon);
    setCustomOrigin([lat, lng]);
    const label = place.display_name.split(",").slice(0, 2).join(",").trim();
    setAddressQuery(label);
    setShowAddressDrop(false);
    setOriginType("custom");
  }

  // Close dropdown on outside click
  useEffect(() => {
    function h(e: MouseEvent) {
      if (dropRef.current && !dropRef.current.contains(e.target as Node)) setShowAddressDrop(false);
    }
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  function switchToMyLocation() {
    setOriginType("my-location");
    setCustomOrigin(null);
    setAddressQuery("");
  }

  function retryFetch() {
    if (!origin) return;
    cacheRef.current = {};
    setRouteMap({});
    setError("");
    // The effect will re-run because we need to force it — bump a retry counter
    setRetryCount((c) => c + 1);
  }
  const [retryCount, setRetryCount] = useState(0);

  // When retry counter bumps, the effect needs to re-run even if deps are the same.
  // We do this by including retryCount in the effect deps via a separate effect.
  useEffect(() => {
    if (retryCount === 0 || !origin) return;
    let cancelled = false;
    setLoading(true);
    setError("");
    fetchRoute(origin, [unit.lat, unit.lng], mode).then((result) => {
      if (cancelled) return;
      cacheRef.current[mode] = result;
      setRouteMap((prev) => ({ ...prev, [mode]: result }));
      if (!result) {
        setError("Não foi possível calcular a rota. Tente novamente.");
        onRouteChange(null, null);
      } else {
        onRouteChange(result, origin);
      }
      setLoading(false);
    });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [retryCount]);

  const currentRoute = routeMap[mode] ?? null;
  const unitColor = categoryColors[unit.category];

  return (
    <div className="flex flex-col h-full bg-white overflow-hidden">

      {/* ── Header ────────────────────────────────────────────────────────── */}
      <div className="px-4 pt-4 pb-3 border-b border-gray-100">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Navigation size={16} className="text-emerald-600" />
            <span className="text-sm" style={{ fontWeight: 700 }}>Traçar Rota</span>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg transition">
            <X size={16} className="text-gray-500" />
          </button>
        </div>

        {/* Origin */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs text-gray-400 mb-1">
            <div className="w-2 h-2 rounded-full bg-emerald-500" />
            <span style={{ fontWeight: 600 }}>PARTIDA</span>
          </div>

          <div className="flex gap-2">
            <button
              onClick={switchToMyLocation}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs border transition-all ${
                originType === "my-location" && userLocation
                  ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                  : "border-gray-200 text-gray-500 hover:border-gray-300"
              }`}
              disabled={!userLocation}
            >
              <MapPin size={12} />
              {userLocation ? "Minha localização" : "Localização indisponível"}
            </button>
          </div>

          {/* Custom address search */}
          <div className="relative" ref={dropRef}>
            <div className="relative">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Ou busque um endereço de partida..."
                value={addressQuery}
                onChange={(e) => handleAddressInput(e.target.value)}
                onFocus={() => addressResults.length > 0 && setShowAddressDrop(true)}
                className={`w-full pl-8 pr-8 py-2 text-xs bg-gray-50 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-400 transition ${
                  originType === "custom" ? "border-emerald-400 bg-emerald-50" : "border-gray-200"
                }`}
              />
              {addressLoading ? (
                <Loader2 size={12} className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-gray-400" />
              ) : addressQuery ? (
                <button
                  onClick={() => { setAddressQuery(""); setAddressResults([]); setShowAddressDrop(false); }}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                >
                  <X size={12} className="text-gray-400" />
                </button>
              ) : null}
            </div>

            {showAddressDrop && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-xl z-50 overflow-hidden max-h-48 overflow-y-auto">
                {addressResults.map((r) => (
                  <button
                    key={r.place_id}
                    onClick={() => handleAddressSelect(r)}
                    className="w-full text-left px-3 py-2 hover:bg-emerald-50 transition border-b border-gray-50 last:border-0"
                  >
                    <div className="flex items-start gap-2">
                      <MapPin size={11} className="text-emerald-500 mt-0.5 flex-shrink-0" />
                      <p className="text-xs text-gray-700 leading-tight">
                        {r.display_name.split(",").slice(0, 3).join(",")}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Destination row */}
          <div className="flex items-center gap-2 mt-1">
            <div className="w-2 h-2 rounded-full" style={{ background: unitColor }} />
            <span className="text-sm">{categoryIcons[unit.category]}</span>
            <p className="text-xs text-gray-700 truncate flex-1" style={{ fontWeight: 500 }}>{unit.name}</p>
          </div>
        </div>
      </div>

      {/* ── Transport mode tabs ──────────────────────────────────────────── */}
      <div className="px-4 py-3 border-b border-gray-100">
        <div className="grid grid-cols-3 gap-2">
          {(Object.entries(MODE_CONFIG) as [TransportMode, typeof MODE_CONFIG.driving][]).map(([m, cfg]) => {
            const r = routeMap[m];
            const isActive = mode === m;
            return (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`flex flex-col items-center gap-1 py-2.5 rounded-xl border transition-all ${
                  isActive ? "border-2" : "border-gray-200 hover:border-gray-300"
                }`}
                style={{
                  borderColor: isActive ? cfg.color : undefined,
                  background: isActive ? `${cfg.color}10` : undefined,
                }}
              >
                <span className="text-xl">{cfg.icon}</span>
                <span className="text-xs" style={{ fontWeight: 600, color: isActive ? cfg.color : "#64748b" }}>
                  {cfg.label}
                </span>
                {r != null ? (
                  <span className="text-xs" style={{ color: cfg.color, fontWeight: 500 }}>
                    {formatDuration(r.duration)}
                  </span>
                ) : m === mode && loading ? (
                  <Loader2 size={10} className="animate-spin text-gray-400" />
                ) : (
                  <span className="text-xs text-gray-300">—</span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Content ──────────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto">

        {/* No origin */}
        {!origin && (
          <div className="flex flex-col items-center justify-center h-40 text-gray-400 px-4 text-center">
            <MapPin size={28} className="mb-2 opacity-40" />
            <p className="text-sm">Ative sua localização ou busque um endereço de partida</p>
          </div>
        )}

        {/* Loading */}
        {origin && loading && !currentRoute && (
          <div className="flex flex-col items-center justify-center h-40 gap-3">
            <Loader2 size={28} className="animate-spin text-emerald-500" />
            <p className="text-sm text-gray-500">Calculando melhor rota...</p>
          </div>
        )}

        {/* Error */}
        {error && !loading && (
          <div className="mx-4 mt-4 flex flex-col items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl">
            <AlertTriangle size={22} className="text-red-400" />
            <p className="text-sm text-red-700 text-center">{error}</p>
            <button
              onClick={retryFetch}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg text-xs hover:bg-red-700 transition"
              style={{ fontWeight: 600 }}
            >
              <RotateCcw size={12} /> Tentar novamente
            </button>
          </div>
        )}

        {/* Route result */}
        {origin && currentRoute && !loading && (
          <div className="p-4 space-y-4">
            {/* Summary card */}
            <div
              className="rounded-2xl p-4 border-2"
              style={{ borderColor: MODE_CONFIG[mode].color, background: `${MODE_CONFIG[mode].color}08` }}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{MODE_CONFIG[mode].icon}</span>
                  <div>
                    <p className="text-xs text-gray-500">Modo</p>
                    <p className="text-sm" style={{ fontWeight: 700, color: MODE_CONFIG[mode].color }}>
                      {MODE_CONFIG[mode].label}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-400">Estimativa</p>
                  <p className="text-lg" style={{ fontWeight: 800, color: MODE_CONFIG[mode].color }}>
                    {formatDuration(currentRoute.duration)}
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="flex items-center gap-2 flex-1 bg-white/70 rounded-xl px-3 py-2">
                  <Ruler size={14} style={{ color: MODE_CONFIG[mode].color }} />
                  <div>
                    <p className="text-xs text-gray-400">Distância</p>
                    <p className="text-sm" style={{ fontWeight: 700 }}>{formatDistance(currentRoute.distance)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-1 bg-white/70 rounded-xl px-3 py-2">
                  <Clock size={14} style={{ color: MODE_CONFIG[mode].color }} />
                  <div>
                    <p className="text-xs text-gray-400">Tempo</p>
                    <p className="text-sm" style={{ fontWeight: 700 }}>{formatDuration(currentRoute.duration)}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Compare other modes */}
            {(Object.entries(routeMap) as [TransportMode, RouteResult | null][]).filter(([m, r]) => m !== mode && r != null).length > 0 && (
              <div>
                <p className="text-xs text-gray-400 mb-2" style={{ fontWeight: 600 }}>COMPARAR MODAIS</p>
                <div className="space-y-2">
                  {(Object.entries(routeMap) as [TransportMode, RouteResult | null][])
                    .filter(([m, r]) => m !== mode && r != null)
                    .map(([m, r]) => {
                      const cfg = MODE_CONFIG[m];
                      return (
                        <button
                          key={m}
                          onClick={() => setMode(m)}
                          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition text-left"
                        >
                          <span className="text-lg">{cfg.icon}</span>
                          <span className="text-sm flex-1 text-gray-600">{cfg.label}</span>
                          <div className="text-right">
                            <p className="text-xs" style={{ fontWeight: 700, color: cfg.color }}>{formatDuration(r!.duration)}</p>
                            <p className="text-xs text-gray-400">{formatDistance(r!.distance)}</p>
                          </div>
                        </button>
                      );
                    })}
                </div>
              </div>
            )}

            {/* Step-by-step */}
            <div>
              <button
                onClick={() => setStepsOpen(!stepsOpen)}
                className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition"
              >
                <span className="text-sm" style={{ fontWeight: 600 }}>
                  Instruções passo a passo ({currentRoute.steps.length})
                </span>
                {stepsOpen
                  ? <ChevronUp size={16} className="text-gray-400" />
                  : <ChevronDown size={16} className="text-gray-400" />}
              </button>

              {stepsOpen && (
                <div className="mt-2 space-y-1">
                  {currentRoute.steps.map((step, i) => (
                    <div key={i} className="flex items-start gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-50 transition">
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-base"
                        style={{ background: `${MODE_CONFIG[mode].color}15` }}
                      >
                        {step.maneuver}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-gray-700 leading-snug" style={{ fontWeight: 500 }}>
                          {step.instruction}
                        </p>
                        {step.distance > 0 && (
                          <p className="text-xs text-gray-400 mt-0.5">{formatDistance(step.distance)}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── Footer ───────────────────────────────────────────────────────── */}
      <div className="px-4 py-2.5 border-t border-gray-100 bg-gray-50 flex items-center justify-center">
        <span className="text-xs text-gray-400">Rota calculada via OSRM + OpenStreetMap</span>
      </div>
    </div>
  );
}
