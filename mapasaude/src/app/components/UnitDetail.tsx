import React, { useState } from "react";
import {
  X, Phone, Mail, Clock, MapPin, Star, Navigation, MessageCircle,
  ThumbsUp, AlertTriangle, ChevronRight, Stethoscope, FlaskConical, User
} from "lucide-react";
import { HealthUnit, Review } from "../types";
import { categoryColors, categoryIcons, categoryLabels } from "../mockData";
import { useAuth } from "../AuthContext";

interface UnitDetailProps {
  unit: HealthUnit;
  distance?: number;
  onClose: () => void;
  onRoute: (unit: HealthUnit) => void;
  onReviewAdded: (unitId: string, review: Review) => void;
  onLocationVerified: (unitId: string) => void;
  onRequireLogin: () => void;
}

function StarRating({ value, onChange }: { value: number; onChange?: (v: number) => void }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((s) => (
        <button
          key={s}
          type="button"
          onClick={() => onChange?.(s)}
          className={`transition-colors ${onChange ? "cursor-pointer" : "cursor-default"}`}
        >
          <Star
            size={20}
            className={s <= value ? "text-yellow-400 fill-yellow-400" : "text-gray-300"}
          />
        </button>
      ))}
    </div>
  );
}

export function UnitDetail({ unit, distance, onClose, onRoute, onReviewAdded, onLocationVerified, onRequireLogin }: UnitDetailProps) {
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState<"info" | "professionals" | "reviews">("info");
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewLocationCorrect, setReviewLocationCorrect] = useState(true);

  const color = categoryColors[unit.category];

  function handleWhatsApp() {
    if (unit.whatsapp) {
      const num = unit.whatsapp.replace(/\D/g, "");
      window.open(`https://wa.me/55${num}`, "_blank");
    }
  }

  function handleSubmitReview(e: React.FormEvent) {
    e.preventDefault();
    if (!currentUser) return;
    const review: Review = {
      id: `r${Date.now()}`,
      userId: currentUser.id,
      userName: currentUser.name,
      rating: reviewRating,
      comment: reviewComment,
      date: new Date().toISOString().split("T")[0],
      locationCorrect: reviewLocationCorrect,
    };
    onReviewAdded(unit.id, review);
    setShowReviewForm(false);
    setReviewComment("");
    setReviewRating(5);
    setActiveTab("reviews");
  }

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div style={{ background: color }} className="p-4 text-white relative">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 p-1 rounded-full bg-white/20 hover:bg-white/30 transition"
        >
          <X size={18} />
        </button>
        <div className="flex items-start gap-3 pr-8">
          <div className="text-3xl">{categoryIcons[unit.category]}</div>
          <div>
            <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full" style={{ fontWeight: 500 }}>
              {categoryLabels[unit.category]}
            </span>
            <h2 className="mt-1 leading-tight" style={{ fontWeight: 700 }}>{unit.name}</h2>
            <div className="flex items-center gap-2 mt-1">
              <div className="flex items-center gap-1">
                <Star size={14} className="fill-yellow-300 text-yellow-300" />
                <span className="text-sm" style={{ fontWeight: 600 }}>{unit.rating}</span>
                <span className="text-xs opacity-80">({unit.totalReviews})</span>
              </div>
              {distance !== undefined && (
                <>
                  <span className="opacity-50">•</span>
                  <span className="text-sm">{distance < 1 ? `${Math.round(distance * 1000)}m` : `${distance.toFixed(1)}km`}</span>
                </>
              )}
              {unit.locationVerified && (
                <>
                  <span className="opacity-50">•</span>
                  <span className="text-xs bg-white/20 px-1.5 py-0.5 rounded-full">📍 Verificado</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex gap-2 mt-3">
          <button
            onClick={() => onRoute(unit)}
            className="flex items-center gap-2 bg-white text-gray-800 px-3 py-1.5 rounded-lg text-sm hover:bg-gray-100 transition"
            style={{ fontWeight: 600 }}
          >
            <Navigation size={14} /> Rota
          </button>
          <a
            href={`tel:${unit.phone}`}
            className="flex items-center gap-2 bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-lg text-sm transition"
          >
            <Phone size={14} /> Ligar
          </a>
          {unit.whatsapp && (
            <button
              onClick={handleWhatsApp}
              className="flex items-center gap-2 bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-lg text-sm transition"
            >
              <MessageCircle size={14} /> WhatsApp
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-100">
        {(["info", "professionals", "reviews"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-3 text-sm transition-colors ${activeTab === tab ? "border-b-2 text-emerald-600" : "text-gray-500 hover:text-gray-700"}`}
            style={{ borderBottomColor: activeTab === tab ? color : "transparent", fontWeight: activeTab === tab ? 600 : 400 }}
          >
            {tab === "info" ? "Informações" : tab === "professionals" ? "Profissionais" : "Avaliações"}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {activeTab === "info" && (
          <div className="space-y-4">
            <InfoRow icon={<MapPin size={16} className="text-gray-400" />} label="Endereço">
              {unit.address}, {unit.neighborhood}, {unit.city} - {unit.state}, {unit.zipCode}
            </InfoRow>
            <InfoRow icon={<Clock size={16} className="text-gray-400" />} label="Horário">
              {unit.hours}
            </InfoRow>
            <InfoRow icon={<Phone size={16} className="text-gray-400" />} label="Telefone">
              {unit.phone}
            </InfoRow>
            {unit.whatsapp && (
              <InfoRow icon={<MessageCircle size={16} className="text-green-500" />} label="WhatsApp">
                {unit.whatsapp}
              </InfoRow>
            )}
            {unit.email && (
              <InfoRow icon={<Mail size={16} className="text-gray-400" />} label="E-mail">
                {unit.email}
              </InfoRow>
            )}

            <div>
              <p className="text-sm text-gray-500 mb-2" style={{ fontWeight: 600 }}>Especialidades</p>
              <div className="flex flex-wrap gap-1.5">
                {unit.specialties.map((spec) => (
                  <span
                    key={spec}
                    className="px-2.5 py-1 rounded-full text-xs"
                    style={{ background: `${color}15`, color }}
                  >
                    {spec}
                  </span>
                ))}
              </div>
            </div>

            {/* Location verification */}
            <div className="bg-gray-50 rounded-xl p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm" style={{ fontWeight: 600 }}>Localização correta?</p>
                  <p className="text-xs text-gray-500">{unit.locationVotes} pessoas confirmaram</p>
                </div>
                {currentUser ? (
                  <div className="flex gap-2">
                    <button
                      onClick={() => onLocationVerified(unit.id)}
                      className="flex items-center gap-1 px-3 py-1.5 bg-emerald-100 text-emerald-700 rounded-lg text-xs hover:bg-emerald-200 transition"
                    >
                      <ThumbsUp size={12} /> Sim
                    </button>
                    <button className="flex items-center gap-1 px-3 py-1.5 bg-red-50 text-red-600 rounded-lg text-xs hover:bg-red-100 transition">
                      <AlertTriangle size={12} /> Não
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={onRequireLogin}
                    className="flex items-center gap-1 px-3 py-1.5 bg-gray-200 text-gray-500 rounded-lg text-xs hover:bg-emerald-100 hover:text-emerald-700 transition"
                  >
                    🔒 Entrar para votar
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === "professionals" && (
          <div className="space-y-3">
            {unit.professionals.length === 0 ? (
              <p className="text-center text-gray-400 py-8">Nenhum profissional cadastrado</p>
            ) : (
              unit.professionals.map((prof) => (
                <div key={prof.id} className="flex items-start gap-3 p-3 rounded-xl border border-gray-100 hover:border-gray-200 transition">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: `${color}15` }}>
                    {prof.role === "pharmacist" ? <FlaskConical size={18} style={{ color }} /> :
                      prof.role === "nurse" ? <User size={18} style={{ color }} /> :
                        <Stethoscope size={18} style={{ color }} />}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm" style={{ fontWeight: 600 }}>{prof.name}</p>
                    {prof.specialty && <p className="text-xs text-gray-500">{prof.specialty}</p>}
                    <p className="text-xs text-gray-400 mt-0.5">
                      {prof.role === "doctor" ? `CRM: ${prof.crm}` :
                        prof.role === "pharmacist" ? `CRF: ${prof.crf}` : "Enfermeiro(a)"}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === "reviews" && (
          <div className="space-y-4">
            {/* Summary */}
            <div className="bg-gray-50 rounded-xl p-4 flex items-center gap-4">
              <div className="text-center">
                <p className="text-4xl" style={{ fontWeight: 700, color }}>{unit.rating}</p>
                <StarRating value={Math.round(unit.rating)} />
                <p className="text-xs text-gray-500 mt-1">{unit.totalReviews} avaliações</p>
              </div>
              <div className="flex-1">
                {[5, 4, 3, 2, 1].map((s) => {
                  const count = unit.reviews.filter((r) => r.rating === s).length;
                  const pct = unit.totalReviews > 0 ? (count / unit.totalReviews) * 100 : 0;
                  return (
                    <div key={s} className="flex items-center gap-2 mb-1">
                      <span className="text-xs text-gray-500 w-2">{s}</span>
                      <Star size={10} className="text-yellow-400 fill-yellow-400" />
                      <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Add review */}
            {currentUser ? (
              showReviewForm ? (
                <form onSubmit={handleSubmitReview} className="border border-emerald-200 rounded-xl p-4 space-y-3">
                  <p style={{ fontWeight: 600 }}>Sua avaliação</p>
                  <StarRating value={reviewRating} onChange={setReviewRating} />
                  <textarea
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    placeholder="Conte sua experiência..."
                    className="w-full border border-gray-200 rounded-lg p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-emerald-400"
                    rows={3}
                    required
                  />
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input
                      type="checkbox"
                      checked={reviewLocationCorrect}
                      onChange={(e) => setReviewLocationCorrect(e.target.checked)}
                      className="rounded"
                    />
                    A localização no mapa está correta
                  </label>
                  <div className="flex gap-2">
                    <button type="submit" className="flex-1 py-2 bg-emerald-600 text-white rounded-lg text-sm hover:bg-emerald-700 transition" style={{ fontWeight: 600 }}>
                      Enviar
                    </button>
                    <button type="button" onClick={() => setShowReviewForm(false)} className="px-4 py-2 border border-gray-200 rounded-lg text-sm hover:bg-gray-50 transition">
                      Cancelar
                    </button>
                  </div>
                </form>
              ) : (
                <button
                  onClick={() => setShowReviewForm(true)}
                  className="w-full flex items-center justify-between px-4 py-3 border border-dashed border-emerald-300 rounded-xl text-emerald-600 hover:bg-emerald-50 transition text-sm"
                >
                  <span style={{ fontWeight: 500 }}>Avaliar esta unidade</span>
                  <ChevronRight size={16} />
                </button>
              )
            ) : (
              <button
                onClick={onRequireLogin}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 border border-dashed border-gray-300 rounded-xl text-gray-500 hover:border-emerald-400 hover:text-emerald-600 hover:bg-emerald-50 transition text-sm"
              >
                🔒 <span style={{ fontWeight: 500 }}>Faça login para avaliar esta unidade</span>
              </button>
            )}

            {/* Reviews list */}
            {unit.reviews.length === 0 ? (
              <p className="text-center text-gray-400 py-4">Nenhuma avaliação ainda</p>
            ) : (
              unit.reviews.map((review) => (
                <div key={review.id} className="border border-gray-100 rounded-xl p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 text-xs" style={{ fontWeight: 700 }}>
                        {review.userName[0]}
                      </div>
                      <div>
                        <p className="text-sm" style={{ fontWeight: 600 }}>{review.userName}</p>
                        <p className="text-xs text-gray-400">{new Date(review.date).toLocaleDateString("pt-BR")}</p>
                      </div>
                    </div>
                    <StarRating value={review.rating} />
                  </div>
                  <p className="text-sm text-gray-600">{review.comment}</p>
                  {review.locationCorrect !== undefined && (
                    <p className="text-xs text-gray-400 mt-2">
                      📍 Localização: {review.locationCorrect ? "✓ Correta" : "✗ Incorreta"}
                    </p>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function InfoRow({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5">{icon}</div>
      <div>
        <p className="text-xs text-gray-400" style={{ fontWeight: 500 }}>{label}</p>
        <p className="text-sm text-gray-700">{children}</p>
      </div>
    </div>
  );
}
