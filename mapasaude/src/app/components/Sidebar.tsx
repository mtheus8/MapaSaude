import { useState, useRef, useEffect } from "react";
import {
  Search, Filter, MapPin, Star, Clock, ChevronRight, X,
  SlidersHorizontal, Globe, Loader2, Lock,
} from "lucide-react";
import { HealthUnit, FilterState, UnitCategory } from "../types";
import { categoryColors, categoryIcons, categoryLabels, calculateDistance } from "../mockData";
import { useAuth } from "../AuthContext";

// ─── City Search via Nominatim ────────────────────────────────────────────────
interface CityResult {
  place_id: string;
  display_name: string;
  lat: string;
  lon: string;
  address?: { city?: string; town?: string; state?: string };
}

async function searchCities(query: string): Promise<CityResult[]> {
  if (query.trim().length < 2) return [];
  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("q", query);
  url.searchParams.set("countrycodes", "br");
  url.searchParams.set("addressdetails", "1");
  url.searchParams.set("format", "json");
  url.searchParams.set("limit", "6");
  url.searchParams.set("featuretype", "city");
  url.searchParams.set("accept-language", "pt-BR");
  const res = await fetch(url.toString(), {
    headers: { "Accept-Language": "pt-BR,pt;q=0.9" },
  });
  if (!res.ok) return [];
  return res.json();
}

function getCityLabel(r: CityResult): string {
  const parts = r.display_name.split(",");
  // Show first 2-3 meaningful parts
  return parts.slice(0, 3).map((s) => s.trim()).join(", ");
}

// ─── Types ────────────────────────────────────────────────────────────────────
interface SidebarProps {
  units: HealthUnit[];
  filters: FilterState;
  onFilterChange: (f: Partial<FilterState>) => void;
  selectedUnit: HealthUnit | null;
  onSelectUnit: (unit: HealthUnit) => void;
  userLocation: [number, number] | null;
  onCitySelect: (lat: number, lng: number, name: string) => void;
  onRequireLogin?: () => void;
}

const categories: Array<{ value: UnitCategory | "all"; label: string }> = [
  { value: "all", label: "Todas" },
  { value: "hospital", label: "Hospitais" },
  { value: "clinic", label: "Clínicas" },
  { value: "pharmacy", label: "Farmácias" },
  { value: "upa", label: "UPAs" },
  { value: "laboratory", label: "Laboratórios" },
];

export function Sidebar({
  units, filters, onFilterChange, selectedUnit,
  onSelectUnit, userLocation, onCitySelect, onRequireLogin,
}: SidebarProps) {
  const { currentUser } = useAuth();
  const [showFilters, setShowFilters] = useState(false);
  const [cityQuery, setCityQuery] = useState("");
  const [cityResults, setCityResults] = useState<CityResult[]>([]);
  const [cityLoading, setCityLoading] = useState(false);
  const [cityDropOpen, setCityDropOpen] = useState(false);
  const [activeCity, setActiveCity] = useState("");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cityRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (cityRef.current && !cityRef.current.contains(e.target as Node)) {
        setCityDropOpen(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Debounced city search
  function handleCityInput(value: string) {
    setCityQuery(value);
    setActiveCity("");
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (value.trim().length < 2) { setCityResults([]); setCityDropOpen(false); return; }
    setCityLoading(true);
    debounceRef.current = setTimeout(async () => {
      const results = await searchCities(value);
      setCityResults(results);
      setCityDropOpen(results.length > 0);
      setCityLoading(false);
    }, 400);
  }

  function handleCitySelect(r: CityResult) {
    const label = getCityLabel(r);
    setActiveCity(label);
    setCityQuery(label);
    setCityDropOpen(false);
    onCitySelect(parseFloat(r.lat), parseFloat(r.lon), label);
  }

  function clearCity() {
    setCityQuery("");
    setActiveCity("");
    setCityResults([]);
    setCityDropOpen(false);
  }

  // Filter units
  const filteredUnits = units
    .filter((u) => {
      if (filters.category !== "all" && u.category !== filters.category) return false;
      if (filters.searchQuery) {
        const q = filters.searchQuery.toLowerCase();
        if (
          !u.name.toLowerCase().includes(q) &&
          !u.neighborhood.toLowerCase().includes(q) &&
          !u.city.toLowerCase().includes(q) &&
          !u.specialties.some((s) => s.toLowerCase().includes(q))
        ) return false;
      }
      if (filters.specialty) {
        if (!u.specialties.some((s) => s.toLowerCase().includes(filters.specialty.toLowerCase()))) return false;
      }
      if (userLocation && filters.maxDistance < 50) {
        const d = calculateDistance(userLocation[0], userLocation[1], u.lat, u.lng);
        if (d > filters.maxDistance) return false;
      }
      return true;
    })
    .sort((a, b) => {
      if (!userLocation) return b.rating - a.rating;
      const da = calculateDistance(userLocation[0], userLocation[1], a.lat, a.lng);
      const db = calculateDistance(userLocation[0], userLocation[1], b.lat, b.lng);
      return da - db;
    });

  return (
    <div className="flex flex-col h-full bg-white">

      {/* ── City Search ──────────────────────────────────────────────────────── */}
      <div className="px-3 pt-3 pb-2 border-b border-gray-100" ref={cityRef}>
        <p className="text-xs text-gray-400 mb-1.5 flex items-center gap-1" style={{ fontWeight: 600 }}>
          <Globe size={11} /> BUSCAR CIDADE
        </p>
        <div className="relative">
          <MapPin size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-500" />
          <input
            type="text"
            value={cityQuery}
            onChange={(e) => handleCityInput(e.target.value)}
            onFocus={() => cityResults.length > 0 && setCityDropOpen(true)}
            placeholder="Ex: Alagoinhas, Salvador..."
            className="w-full pl-9 pr-8 py-2 text-sm bg-emerald-50 border border-emerald-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-400"
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            {cityLoading
              ? <Loader2 size={14} className="animate-spin text-emerald-400" />
              : cityQuery
              ? <button onClick={clearCity}><X size={14} className="text-gray-400 hover:text-gray-600" /></button>
              : null}
          </div>

          {/* Dropdown */}
          {cityDropOpen && cityResults.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-xl z-50 overflow-hidden">
              {cityResults.map((r) => (
                <button
                  key={r.place_id}
                  onClick={() => handleCitySelect(r)}
                  className="w-full text-left px-3 py-2.5 hover:bg-emerald-50 transition-colors border-b border-gray-50 last:border-0"
                >
                  <div className="flex items-start gap-2">
                    <MapPin size={13} className="text-emerald-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm text-gray-800">{getCityLabel(r)}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
        {activeCity && (
          <p className="text-xs text-emerald-600 mt-1 flex items-center gap-1">
            <MapPin size={10} /> Mostrando: <span style={{ fontWeight: 600 }}>{activeCity}</span>
          </p>
        )}
      </div>

      {/* ── Unit Search ──────────────────────────────────────────────────────── */}
      <div className="p-3 border-b border-gray-100">
        <p className="text-xs text-gray-400 mb-1.5 flex items-center gap-1" style={{ fontWeight: 600 }}>
          <Search size={11} /> BUSCAR UNIDADE
        </p>
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Nome, bairro ou especialidade..."
              value={filters.searchQuery}
              onChange={(e) => onFilterChange({ searchQuery: e.target.value })}
              className="w-full pl-9 pr-7 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-400"
            />
            {filters.searchQuery && (
              <button onClick={() => onFilterChange({ searchQuery: "" })}
                className="absolute right-2 top-1/2 -translate-y-1/2">
                <X size={13} className="text-gray-400 hover:text-gray-600" />
              </button>
            )}
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`p-2 rounded-lg border transition-colors ${showFilters ? "border-emerald-500 bg-emerald-50 text-emerald-600" : "border-gray-200 text-gray-500 hover:bg-gray-50"}`}
            title="Filtros avançados"
          >
            <SlidersHorizontal size={15} />
          </button>
        </div>

        {/* Advanced filters */}
        {showFilters && (
          <div className="mt-3 space-y-3 bg-gray-50 rounded-xl p-3">
            <div>
              <p className="text-xs text-gray-500 mb-1.5" style={{ fontWeight: 600 }}>Especialidade</p>
              <input
                type="text"
                placeholder="Ex: Cardiologia, Pediatria..."
                value={filters.specialty}
                onChange={(e) => onFilterChange({ specialty: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-400"
              />
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1.5" style={{ fontWeight: 600 }}>
                Distância máxima: {filters.maxDistance >= 50 ? "Sem limite" : `${filters.maxDistance} km`}
              </p>
              <input
                type="range" min={1} max={50} value={filters.maxDistance}
                onChange={(e) => onFilterChange({ maxDistance: Number(e.target.value) })}
                className="w-full accent-emerald-600"
              />
              <div className="flex justify-between text-xs text-gray-400 mt-0.5">
                <span>1 km</span><span>Sem limite</span>
              </div>
            </div>
            {!userLocation && (
              <p className="text-xs text-amber-600 flex items-center gap-1">
                <MapPin size={10} /> Ative sua localização para filtrar por distância
              </p>
            )}
          </div>
        )}
      </div>

      {/* ── Category chips ───────────────────────────────────────────────────── */}
      <div className="px-3 py-2 border-b border-gray-100 flex gap-1.5 overflow-x-auto scrollbar-hide">
        {categories.map((cat) => {
          const active = filters.category === cat.value;
          const color = cat.value !== "all" ? categoryColors[cat.value] : "#059669";
          return (
            <button key={cat.value} onClick={() => onFilterChange({ category: cat.value })}
              className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs whitespace-nowrap transition-all border"
              style={{
                background: active ? color : "transparent",
                color: active ? "white" : "#64748b",
                borderColor: active ? color : "#e2e8f0",
                fontWeight: active ? 600 : 400,
              }}>
              {cat.value !== "all" && <span>{categoryIcons[cat.value]}</span>}
              {cat.label}
            </button>
          );
        })}
      </div>

      {/* ── Results count ────────────────────────────────────────────────────── */}
      <div className="px-3 py-2 border-b border-gray-50 flex items-center justify-between">
        <p className="text-xs text-gray-500">
          <span style={{ fontWeight: 700 }}>{filteredUnits.length}</span> unidade{filteredUnits.length !== 1 ? "s" : ""}
        </p>
        {(filters.category !== "all" || filters.specialty || filters.searchQuery || filters.maxDistance < 50) && (
          <button
            onClick={() => onFilterChange({ category: "all", specialty: "", searchQuery: "", maxDistance: 50 })}
            className="text-xs text-emerald-600 hover:underline flex items-center gap-1"
          >
            <X size={10} /> Limpar filtros
          </button>
        )}
      </div>

      {/* ── Auth banner ──────────────────────────────────────────────────────── */}
      {!currentUser && (
        <div className="mx-3 mt-2 mb-0">
          <button
            onClick={onRequireLogin}
            className="w-full flex items-center gap-2 px-3 py-2.5 bg-amber-50 border border-amber-200 rounded-xl hover:bg-amber-100 transition text-left"
          >
            <Lock size={14} className="text-amber-500 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-amber-700" style={{ fontWeight: 600 }}>Login necessário</p>
              <p className="text-xs text-amber-600 leading-tight">Faça login para ver detalhes e traçar rotas</p>
            </div>
            <ChevronRight size={13} className="text-amber-400 flex-shrink-0" />
          </button>
        </div>
      )}

      {/* ── Unit list ────────────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto mt-2">
        {filteredUnits.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-gray-400">
            <Filter size={28} className="mb-2 opacity-30" />
            <p className="text-sm">Nenhuma unidade encontrada</p>
          </div>
        ) : (
          filteredUnits.map((unit) => {
            const dist = userLocation
              ? calculateDistance(userLocation[0], userLocation[1], unit.lat, unit.lng)
              : null;
            const isSelected = selectedUnit?.id === unit.id;
            const color = categoryColors[unit.category];
            return (
              <button key={unit.id} onClick={() => onSelectUnit(unit)}
                className={`w-full text-left p-3 border-b border-gray-50 hover:bg-gray-50 transition-colors ${isSelected ? "bg-emerald-50" : ""}`}
                style={{ borderLeft: isSelected ? `3px solid ${color}` : "3px solid transparent" }}
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-lg"
                    style={{ background: `${color}15` }}>
                    {categoryIcons[unit.category]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm truncate" style={{ fontWeight: 600 }}>{unit.name}</p>
                    <p className="text-xs text-gray-500 truncate">{unit.neighborhood} · {unit.city}</p>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <span className="text-xs px-1.5 py-0.5 rounded-full"
                        style={{ background: `${color}15`, color, fontWeight: 500 }}>
                        {categoryLabels[unit.category]}
                      </span>
                      <span className="flex items-center gap-0.5 text-xs text-gray-500">
                        <Star size={10} className="text-yellow-400 fill-yellow-400" />
                        {unit.rating}
                      </span>
                      {dist !== null && (
                        <span className="flex items-center gap-0.5 text-xs text-gray-400">
                          <MapPin size={10} />
                          {dist < 1 ? `${Math.round(dist * 1000)}m` : `${dist.toFixed(1)}km`}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1 mt-0.5 text-xs text-gray-400">
                      <Clock size={10} />
                      <span className="truncate">{unit.hours.length > 32 ? unit.hours.slice(0, 32) + "…" : unit.hours}</span>
                    </div>
                  </div>
                  <ChevronRight size={14} className="text-gray-300 flex-shrink-0 mt-2" />
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
