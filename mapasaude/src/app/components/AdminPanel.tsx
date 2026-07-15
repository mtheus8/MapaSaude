import React, { useState } from "react";
import { X, CheckCircle, XCircle, Building2, Users, MapPin, Star, AlertTriangle } from "lucide-react";
import { HealthUnit } from "../types";
import { categoryColors, categoryIcons, categoryLabels } from "../mockData";

interface AdminPanelProps {
  units: HealthUnit[];
  onClose: () => void;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
}

export function AdminPanel({ units, onClose, onApprove, onReject }: AdminPanelProps) {
  const [activeTab, setActiveTab] = useState<"dashboard" | "units" | "pending">("dashboard");

  const approved = units.filter((u) => u.approved);
  const pending = units.filter((u) => !u.approved);
  const totalReviews = units.reduce((sum, u) => sum + u.totalReviews, 0);
  const avgRating = units.length > 0 ? (units.reduce((sum, u) => sum + u.rating, 0) / units.length).toFixed(1) : "0";

  const byCategory = units.reduce((acc, u) => {
    acc[u.category] = (acc[u.category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="fixed inset-0 bg-black/50 z-[2000] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-800 to-slate-700 text-white p-5 rounded-t-2xl flex items-center justify-between">
          <div>
            <h2 style={{ fontWeight: 700 }}>Painel Administrativo</h2>
            <p className="text-slate-300 text-sm mt-0.5">MapsSaúde – Gestão do Sistema</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg transition">
            <X size={20} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-100">
          {([
            { key: "dashboard", label: "Dashboard" },
            { key: "units", label: "Unidades" },
            { key: "pending", label: `Pendentes ${pending.length > 0 ? `(${pending.length})` : ""}` },
          ] as const).map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 py-3 text-sm transition-colors ${activeTab === tab.key ? "border-b-2 border-slate-700 text-slate-800" : "text-gray-500 hover:text-gray-700"}`}
              style={{ fontWeight: activeTab === tab.key ? 600 : 400 }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5">
          {activeTab === "dashboard" && (
            <div className="space-y-4">
              {/* Stats */}
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <StatCard icon={<Building2 size={20} className="text-emerald-600" />} label="Total de Unidades" value={units.length} bg="bg-emerald-50" />
                <StatCard icon={<CheckCircle size={20} className="text-blue-600" />} label="Aprovadas" value={approved.length} bg="bg-blue-50" />
                <StatCard icon={<Star size={20} className="text-yellow-500" />} label="Avaliação Média" value={avgRating} bg="bg-yellow-50" />
                <StatCard icon={<Users size={20} className="text-purple-600" />} label="Total Avaliações" value={totalReviews} bg="bg-purple-50" />
              </div>

              {/* Category distribution */}
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-sm mb-3" style={{ fontWeight: 600 }}>Distribuição por Categoria</p>
                <div className="space-y-2">
                  {Object.entries(byCategory).map(([cat, count]) => {
                    const pct = Math.round((count / units.length) * 100);
                    const color = categoryColors[cat];
                    return (
                      <div key={cat}>
                        <div className="flex justify-between text-xs text-gray-600 mb-1">
                          <span>{categoryIcons[cat]} {categoryLabels[cat]}</span>
                          <span style={{ fontWeight: 600 }}>{count} ({pct}%)</span>
                        </div>
                        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Alerts */}
              {pending.length > 0 && (
                <div className="flex items-center gap-3 p-3 bg-amber-50 border border-amber-200 rounded-xl">
                  <AlertTriangle size={20} className="text-amber-500 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-amber-800" style={{ fontWeight: 600 }}>
                      {pending.length} unidade{pending.length > 1 ? "s" : ""} aguardando aprovação
                    </p>
                    <button
                      onClick={() => setActiveTab("pending")}
                      className="text-xs text-amber-600 underline mt-0.5"
                    >
                      Revisar agora
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === "units" && (
            <div className="space-y-2">
              {units.map((unit) => (
                <div key={unit.id} className="flex items-center gap-3 p-3 border border-gray-100 rounded-xl hover:border-gray-200 transition">
                  <span className="text-xl">{categoryIcons[unit.category]}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm truncate" style={{ fontWeight: 600 }}>{unit.name}</p>
                    <p className="text-xs text-gray-500">{unit.neighborhood} • {categoryLabels[unit.category]}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <Star size={12} className="text-yellow-400 fill-yellow-400" />
                      {unit.rating}
                    </div>
                    <div className="flex items-center gap-1 text-xs">
                      <MapPin size={12} className={unit.locationVerified ? "text-emerald-500" : "text-gray-400"} />
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${unit.approved ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
                      {unit.approved ? "Ativo" : "Pendente"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === "pending" && (
            <div className="space-y-3">
              {pending.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                  <CheckCircle size={40} className="mb-3 text-emerald-400" />
                  <p>Nenhuma unidade pendente de aprovação</p>
                </div>
              ) : (
                pending.map((unit) => (
                  <div key={unit.id} className="border border-amber-200 rounded-xl p-4">
                    <div className="flex items-start gap-3">
                      <span className="text-2xl">{categoryIcons[unit.category]}</span>
                      <div className="flex-1">
                        <p style={{ fontWeight: 600 }}>{unit.name}</p>
                        <p className="text-sm text-gray-500">{categoryLabels[unit.category]}</p>
                        <p className="text-sm text-gray-600 mt-1">{unit.address}, {unit.neighborhood}</p>
                        <p className="text-sm text-gray-600">{unit.phone}</p>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {unit.specialties.slice(0, 3).map((s) => (
                            <span key={s} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{s}</span>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2 mt-3">
                      <button
                        onClick={() => onApprove(unit.id)}
                        className="flex-1 flex items-center justify-center gap-2 py-2 bg-emerald-600 text-white rounded-lg text-sm hover:bg-emerald-700 transition"
                        style={{ fontWeight: 600 }}
                      >
                        <CheckCircle size={14} /> Aprovar
                      </button>
                      <button
                        onClick={() => onReject(unit.id)}
                        className="flex-1 flex items-center justify-center gap-2 py-2 bg-red-50 text-red-600 rounded-lg text-sm hover:bg-red-100 transition border border-red-200"
                      >
                        <XCircle size={14} /> Rejeitar
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, bg }: { icon: React.ReactNode; label: string; value: string | number; bg: string }) {
  return (
    <div className={`${bg} rounded-xl p-3`}>
      <div className="flex items-center gap-2 mb-1">{icon}<span className="text-xs text-gray-500">{label}</span></div>
      <p className="text-xl" style={{ fontWeight: 700 }}>{value}</p>
    </div>
  );
}
