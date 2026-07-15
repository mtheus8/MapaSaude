import React from "react";
import { X, Navigation, Clock, MapPin, Car, PersonStanding, Bike } from "lucide-react";
import { HealthUnit } from "../types";
import { categoryColors, categoryIcons, calculateDistance } from "../mockData";

interface RouteModalProps {
  unit: HealthUnit;
  userLocation: [number, number] | null;
  onClose: () => void;
}

export function RouteModal({ unit, userLocation, onClose }: RouteModalProps) {
  const distance = userLocation
    ? calculateDistance(userLocation[0], userLocation[1], unit.lat, unit.lng)
    : null;

  const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${unit.lat},${unit.lng}&travelmode=driving`;

  const times = distance
    ? {
        car: Math.ceil((distance / 40) * 60),
        walk: Math.ceil((distance / 5) * 60),
        bike: Math.ceil((distance / 15) * 60),
      }
    : null;

  const color = categoryColors[unit.category];

  return (
    <div className="fixed inset-0 bg-black/50 z-[2000] flex items-end sm:items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <h3 style={{ fontWeight: 700 }}>Traçar rota</h3>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg transition">
            <X size={18} />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* Destination */}
          <div className="flex items-start gap-3 p-3 rounded-xl" style={{ background: `${color}10` }}>
            <span className="text-2xl">{categoryIcons[unit.category]}</span>
            <div>
              <p className="text-sm" style={{ fontWeight: 600 }}>{unit.name}</p>
              <p className="text-xs text-gray-500">{unit.address}, {unit.neighborhood}</p>
              {distance && (
                <p className="text-xs mt-1" style={{ color, fontWeight: 500 }}>
                  {distance < 1 ? `${Math.round(distance * 1000)} metros` : `${distance.toFixed(2)} km de distância`}
                </p>
              )}
            </div>
          </div>

          {/* Transport options */}
          {times && (
            <div className="grid grid-cols-3 gap-2">
              <TransportCard icon={<Car size={18} />} label="Carro" time={times.car} color={color} />
              <TransportCard icon={<PersonStanding size={18} />} label="A pé" time={times.walk} color={color} />
              <TransportCard icon={<Bike size={18} />} label="Bicicleta" time={times.bike} color={color} />
            </div>
          )}

          {!userLocation && (
            <div className="flex items-center gap-2 p-3 bg-amber-50 rounded-xl text-amber-700 text-sm">
              <MapPin size={16} />
              <span>Ative sua localização para ver o tempo estimado</span>
            </div>
          )}

          {/* Open in Maps */}
          <a
            href={mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full py-3 text-white rounded-xl transition shadow-md"
            style={{ background: color, fontWeight: 600 }}
          >
            <Navigation size={18} /> Abrir no Google Maps
          </a>

          <p className="text-xs text-center text-gray-400">
            * Tempo estimado baseado nas condições médias de trânsito
          </p>
        </div>
      </div>
    </div>
  );
}

function TransportCard({ icon, label, time, color }: { icon: React.ReactNode; label: string; time: number; color: string }) {
  const hours = Math.floor(time / 60);
  const mins = time % 60;
  const display = hours > 0 ? `${hours}h ${mins}min` : `${mins}min`;

  return (
    <div className="flex flex-col items-center gap-1 p-2.5 border border-gray-100 rounded-xl hover:border-gray-200 transition">
      <div style={{ color }}>{icon}</div>
      <p className="text-xs text-gray-500">{label}</p>
      <div className="flex items-center gap-1 text-xs" style={{ color, fontWeight: 600 }}>
        <Clock size={10} /> {display}
      </div>
    </div>
  );
}
