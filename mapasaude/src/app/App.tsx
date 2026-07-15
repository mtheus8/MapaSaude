import { useState, useEffect, useCallback, useRef } from "react";
import { AuthProvider, useAuth } from "./AuthContext";
import { MapComponent, ActiveRoute } from "./components/MapComponent";
import { Sidebar } from "./components/Sidebar";
import { UnitDetail } from "./components/UnitDetail";
import { Header } from "./components/Header";
import { LoginPage } from "./components/LoginPage";
import { AdminPanel } from "./components/AdminPanel";
import { HealthUnitPanel } from "./components/HealthUnitPanel";
import { RoutePanel } from "./components/RoutePanel";
import { RegisterUnitModal } from "./components/RegisterUnitModal";
import { mockUnits, calculateDistance } from "./mockData";
import { HealthUnit, FilterState, Review } from "./types";
import { RouteResult } from "./routingService";
import { ChevronLeft, ChevronRight, List, Map } from "lucide-react";

const DEFAULT_CENTER: [number, number] = [-12.1388, -38.4228]; // Alagoinhas, BA

function AppContent() {
  const { currentUser, loading: authLoading } = useAuth();
  const [units, setUnits] = useState<HealthUnit[]>(mockUnits);
  const [selectedUnit, setSelectedUnit] = useState<HealthUnit | null>(null);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [mapCenter, setMapCenter] = useState<[number, number]>(DEFAULT_CENTER);
  const [filters, setFilters] = useState<FilterState>({
    category: "all",
    specialty: "",
    maxDistance: 50,
    searchQuery: "",
  });

  const [showLogin, setShowLogin] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);
  const [showUnitPanel, setShowUnitPanel] = useState(false);
  const [showRoute, setShowRoute] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileView, setMobileView] = useState<"map" | "list">("map");
  const [activeRoute, setActiveRoute] = useState<ActiveRoute | null>(null);
  const pendingActionRef = useRef<(() => void) | null>(null);
  const prevUserRef = useRef(currentUser);

  // Run queued action after successful login
  useEffect(() => {
    if (!prevUserRef.current && currentUser && pendingActionRef.current) {
      pendingActionRef.current();
      pendingActionRef.current = null;
    }
    prevUserRef.current = currentUser;
  }, [currentUser]);

  const requireAuthRef = useRef<(action: () => void) => void>(() => {});
  function requireAuth(action: () => void) {
    if (currentUser) {
      action();
    } else {
      pendingActionRef.current = action;
      setShowLogin(true);
    }
  }
  // Keep ref in sync so useCallback closures always call the latest version
  requireAuthRef.current = requireAuth;

  const locateUser = useCallback(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const loc: [number, number] = [pos.coords.latitude, pos.coords.longitude];
        setUserLocation(loc);
        setMapCenter(loc);
      },
      () => {
        const loc: [number, number] = [
          -12.1388 + (Math.random() - 0.5) * 0.01,
          -38.4228 + (Math.random() - 0.5) * 0.01,
        ];
        setUserLocation(loc);
        setMapCenter(loc);
      }
    );
  }, []);

  useEffect(() => { locateUser(); }, [locateUser]);

  function handleFilterChange(partial: Partial<FilterState>) {
    setFilters((prev) => ({ ...prev, ...partial }));
  }

  const handleSelectUnit = useCallback((unit: HealthUnit) => {
    requireAuthRef.current(() => {
      setSelectedUnit(unit);
      setMapCenter([unit.lat, unit.lng]);
      setShowRoute(false);
      setActiveRoute(null);
      if (window.innerWidth < 640) setMobileView("map");
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleRouteChange(result: RouteResult | null, origin: [number, number] | null) {
    if (result && origin) {
      setActiveRoute({ result, originLatLng: origin });
    } else {
      setActiveRoute(null);
    }
  }

  function handleCitySelect(lat: number, lng: number) {
    setMapCenter([lat, lng]);
  }

  function handleReviewAdded(unitId: string, review: Review) {
    setUnits((prev) =>
      prev.map((u) => {
        if (u.id !== unitId) return u;
        const reviews = [...u.reviews, review];
        const rating = Math.round((reviews.reduce((s, r) => s + r.rating, 0) / reviews.length) * 10) / 10;
        return { ...u, reviews, rating, totalReviews: u.totalReviews + 1 };
      })
    );
  }

  function handleLocationVerified(unitId: string) {
    setUnits((prev) =>
      prev.map((u) => u.id === unitId ? { ...u, locationVotes: u.locationVotes + 1, locationVerified: true } : u)
    );
  }

  function handleApprove(id: string) {
    setUnits((prev) => prev.map((u) => u.id === id ? { ...u, approved: true } : u));
  }

  function handleReject(id: string) {
    setUnits((prev) => prev.filter((u) => u.id !== id));
  }

  function handleSaveUnit(unit: HealthUnit) {
    setUnits((prev) => {
      const exists = prev.find((u) => u.id === unit.id);
      return exists ? prev.map((u) => u.id === unit.id ? unit : u) : [...prev, unit];
    });
    setShowUnitPanel(false);
  }

  // Public company registration → goes to pending queue
  function handleRegisterSubmit(data: { name: string; category: HealthUnit["category"]; phone: string; whatsapp?: string; email?: string; hours: string; address: string; neighborhood: string; city: string; state: string; zipCode: string; specialties: string[] }) {
    const newUnit: HealthUnit = {
      id: `pending_${Date.now()}`,
      name: data.name,
      category: data.category,
      address: data.address,
      neighborhood: data.neighborhood,
      city: data.city,
      state: data.state,
      zipCode: data.zipCode,
      lat: -12.1388,
      lng: -38.4228,
      phone: data.phone,
      whatsapp: data.whatsapp || undefined,
      email: data.email || undefined,
      hours: data.hours,
      specialties: data.specialties,
      professionals: [],
      reviews: [],
      rating: 0,
      totalReviews: 0,
      approved: false,
      locationVerified: false,
      locationVotes: 0,
    };
    setUnits((prev) => [...prev, newUnit]);
    setShowRegister(false);
  }

  const approvedUnits = units.filter((u) => u.approved);

  if (authLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-emerald-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-emerald-700 text-sm" style={{ fontWeight: 500 }}>Carregando MapsSaúde...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-gray-100">
      <Header
        onLogin={() => setShowLogin(true)}
        onAdminPanel={() => setShowAdmin(true)}
        onAddUnit={() => setShowUnitPanel(true)}
        onLocateMe={locateUser}
        onRegisterBusiness={() => setShowRegister(true)}
      />

      {/* Mobile view toggle */}
      <div className="sm:hidden flex border-b border-gray-200 bg-white flex-shrink-0">
        <button onClick={() => setMobileView("map")}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm transition-colors ${mobileView === "map" ? "text-emerald-600 border-b-2 border-emerald-600" : "text-gray-500"}`}
          style={{ fontWeight: mobileView === "map" ? 600 : 400 }}>
          <Map size={15} /> Mapa
        </button>
        <button onClick={() => setMobileView("list")}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm transition-colors ${mobileView === "list" ? "text-emerald-600 border-b-2 border-emerald-600" : "text-gray-500"}`}
          style={{ fontWeight: mobileView === "list" ? 600 : 400 }}>
          <List size={15} /> Lista
        </button>
      </div>

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden relative">

        {/* Sidebar — desktop */}
        <div className={`flex-shrink-0 border-r border-gray-200 bg-white transition-all duration-300 overflow-hidden hidden sm:block ${sidebarOpen ? "w-80" : "w-0"}`}>
          <Sidebar
            units={approvedUnits}
            filters={filters}
            onFilterChange={handleFilterChange}
            selectedUnit={selectedUnit}
            onSelectUnit={handleSelectUnit}
            userLocation={userLocation}
            onCitySelect={handleCitySelect}
            onRequireLogin={() => { pendingActionRef.current = null; setShowLogin(true); }}
          />
        </div>

        {/* Sidebar — mobile list view */}
        <div className={`sm:hidden absolute inset-0 bg-white z-10 flex-col ${mobileView === "list" ? "flex" : "hidden"}`}>
          <Sidebar
            units={approvedUnits}
            filters={filters}
            onFilterChange={handleFilterChange}
            selectedUnit={selectedUnit}
            onSelectUnit={handleSelectUnit}
            userLocation={userLocation}
            onCitySelect={handleCitySelect}
            onRequireLogin={() => { pendingActionRef.current = null; setShowLogin(true); }}
          />
        </div>

        {/* Toggle sidebar — desktop */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="hidden sm:flex absolute top-1/2 -translate-y-1/2 z-[1100] w-5 h-12 bg-white shadow-md rounded-r-lg items-center justify-center hover:bg-gray-50 transition"
          style={{ left: sidebarOpen ? "320px" : "0px" }}
        >
          {sidebarOpen
            ? <ChevronLeft size={13} className="text-gray-400" />
            : <ChevronRight size={13} className="text-gray-400" />}
        </button>

        {/* Map */}
        <div className={`flex-1 relative ${mobileView === "list" ? "hidden sm:block" : "block"}`}>
          <MapComponent
            units={approvedUnits}
            selectedUnit={selectedUnit}
            userLocation={userLocation}
            onSelectUnit={handleSelectUnit}
            mapCenter={mapCenter}
            activeRoute={activeRoute}
          />
        </div>

        {/* Unit Detail Panel */}
        {selectedUnit && !showRoute && (
          <div className="absolute right-0 top-0 bottom-0 w-full sm:w-96 bg-white shadow-2xl z-[1200] flex flex-col overflow-hidden">
            <UnitDetail
              unit={selectedUnit}
              distance={userLocation ? calculateDistance(userLocation[0], userLocation[1], selectedUnit.lat, selectedUnit.lng) : undefined}
              onClose={() => { setSelectedUnit(null); setActiveRoute(null); }}
              onRoute={(unit) => requireAuth(() => { setSelectedUnit(unit); setShowRoute(true); })}
              onReviewAdded={handleReviewAdded}
              onLocationVerified={(id) => requireAuth(() => handleLocationVerified(id))}
              onRequireLogin={() => { pendingActionRef.current = null; setShowLogin(true); }}
            />
          </div>
        )}

        {/* Route Panel — replaces the unit detail panel while routing */}
        {showRoute && selectedUnit && (
          <div className="absolute right-0 top-0 bottom-0 w-full sm:w-96 bg-white shadow-2xl z-[1200] flex flex-col overflow-hidden">
            <RoutePanel
              unit={selectedUnit}
              userLocation={userLocation}
              onClose={() => { setShowRoute(false); setActiveRoute(null); }}
              onRouteChange={handleRouteChange}
            />
          </div>
        )}
      </div>

      {/* ── Modals ───────────────────────────────────────────────────────────── */}
      {showLogin && <LoginPage onClose={() => { setShowLogin(false); if (!currentUser) pendingActionRef.current = null; }} />}

      {showRegister && (
        <RegisterUnitModal
          onClose={() => setShowRegister(false)}
          onSubmit={handleRegisterSubmit}
        />
      )}

      {showAdmin && currentUser?.role === "admin" && (
        <AdminPanel
          units={units}
          onClose={() => setShowAdmin(false)}
          onApprove={handleApprove}
          onReject={handleReject}
        />
      )}

      {showUnitPanel && (currentUser?.role === "health_unit" || currentUser?.role === "admin") && (
        <HealthUnitPanel
          unit={currentUser.role === "health_unit" && currentUser.unitId
            ? units.find((u) => u.id === currentUser.unitId) ?? null
            : null}
          onClose={() => setShowUnitPanel(false)}
          onSave={handleSaveUnit}
        />
      )}

    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
