import React, { useState } from "react";
import {
  X, Building2, Phone, Mail, Clock, MapPin, Plus, Trash2,
  Send, CheckCircle, AlertCircle, Loader2, ChevronRight, ChevronLeft,
} from "lucide-react";
import { UnitCategory } from "../types";
import { categoryLabels, categoryIcons } from "../mockData";

interface FormData {
  // Step 1 – Basic info
  name: string;
  category: UnitCategory;
  cnpj: string;
  // Step 2 – Contact
  phone: string;
  whatsapp: string;
  email: string;
  hours: string;
  website: string;
  // Step 3 – Address
  address: string;
  neighborhood: string;
  city: string;
  state: string;
  zipCode: string;
  // Step 4 – Services
  specialties: string[];
  description: string;
  // Step 5 – Responsible
  responsibleName: string;
  responsibleEmail: string;
  responsiblePhone: string;
  responsibleRole: string;
  acceptTerms: boolean;
}

const EMPTY: FormData = {
  name: "", category: "clinic", cnpj: "",
  phone: "", whatsapp: "", email: "", hours: "", website: "",
  address: "", neighborhood: "", city: "", state: "", zipCode: "",
  specialties: [], description: "",
  responsibleName: "", responsibleEmail: "", responsiblePhone: "", responsibleRole: "",
  acceptTerms: false,
};

const CATEGORIES: Array<{ value: UnitCategory; label: string; desc: string }> = [
  { value: "hospital", label: "Hospital", desc: "Atendimento integral, internações e cirurgias" },
  { value: "clinic", label: "Clínica", desc: "Consultas especializadas e atendimento ambulatorial" },
  { value: "pharmacy", label: "Farmácia / Drogaria", desc: "Venda de medicamentos e produtos de saúde" },
  { value: "upa", label: "UPA / Pronto-Atendimento", desc: "Urgências e emergências médicas" },
  { value: "laboratory", label: "Laboratório", desc: "Exames clínicos e diagnósticos" },
];

const SPECIALTY_SUGGESTIONS: Record<UnitCategory, string[]> = {
  hospital: ["Clínica Médica", "Cirurgia Geral", "Pediatria", "Ortopedia", "UTI", "Ginecologia"],
  clinic: ["Clínica Geral", "Dermatologia", "Cardiologia", "Nutrição", "Psicologia", "Fisioterapia"],
  pharmacy: ["Medicamentos", "Genéricos", "Manipulação", "Dermocosméticos", "Vacinas"],
  upa: ["Pronto-Atendimento", "Emergência", "Pediatria", "Sutura", "Hidratação"],
  laboratory: ["Análises Clínicas", "Exames de Sangue", "Imagem", "Microbiologia", "Hormônios"],
};

const STEPS = ["Identificação", "Contato", "Endereço", "Serviços", "Responsável"];

interface RegisterUnitModalProps {
  onClose: () => void;
  onSubmit: (data: FormData) => void;
}

export function RegisterUnitModal({ onClose, onSubmit }: RegisterUnitModalProps) {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormData>({ ...EMPTY });
  const [specInput, setSpecInput] = useState("");
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  function set(field: keyof FormData, value: unknown) {
    setForm((p) => ({ ...p, [field]: value }));
    setErrors((p) => { const n = { ...p }; delete n[field]; return n; });
  }

  function addSpecialty(s: string) {
    const v = s.trim();
    if (!v || form.specialties.includes(v)) return;
    set("specialties", [...form.specialties, v]);
    setSpecInput("");
  }

  function removeSpecialty(s: string) {
    set("specialties", form.specialties.filter((x) => x !== s));
  }

  function validateStep(): boolean {
    const e: Partial<Record<keyof FormData, string>> = {};
    if (step === 0) {
      if (!form.name.trim()) e.name = "Nome obrigatório";
      if (form.cnpj && !/^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/.test(form.cnpj) && !/^\d{14}$/.test(form.cnpj.replace(/\D/g, ""))) {
        e.cnpj = "CNPJ inválido";
      }
    }
    if (step === 1) {
      if (!form.phone.trim()) e.phone = "Telefone obrigatório";
      if (!form.hours.trim()) e.hours = "Horário obrigatório";
      if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = "E-mail inválido";
    }
    if (step === 2) {
      if (!form.address.trim()) e.address = "Endereço obrigatório";
      if (!form.neighborhood.trim()) e.neighborhood = "Bairro obrigatório";
      if (!form.city.trim()) e.city = "Cidade obrigatória";
      if (!form.state.trim()) e.state = "Estado obrigatório";
    }
    if (step === 4) {
      if (!form.responsibleName.trim()) e.responsibleName = "Nome obrigatório";
      if (!form.responsibleEmail.trim()) e.responsibleEmail = "E-mail obrigatório";
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.responsibleEmail)) e.responsibleEmail = "E-mail inválido";
      if (!form.responsiblePhone.trim()) e.responsiblePhone = "Telefone obrigatório";
      if (!form.acceptTerms) e.acceptTerms = "Aceite os termos para continuar";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function next() {
    if (!validateStep()) return;
    setStep((s) => Math.min(STEPS.length - 1, s + 1));
  }

  async function handleSubmit() {
    if (!validateStep()) return;
    setLoading(true);
    await new Promise((r) => setTimeout(r, 1200)); // simulate network
    onSubmit(form);
    setLoading(false);
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div className="fixed inset-0 bg-black/60 z-[3000] flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-8 max-w-sm w-full text-center shadow-2xl">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle size={32} className="text-emerald-600" />
          </div>
          <h2 className="text-xl text-gray-800 mb-2" style={{ fontWeight: 700 }}>Solicitação enviada!</h2>
          <p className="text-gray-500 text-sm mb-2">
            O cadastro de <strong>{form.name}</strong> foi recebido e está em análise pela nossa equipe.
          </p>
          <p className="text-gray-400 text-xs mb-6">
            Em até 2 dias úteis você receberá uma resposta no e-mail <strong>{form.responsibleEmail}</strong>.
          </p>
          <button onClick={onClose}
            className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm transition"
            style={{ fontWeight: 600 }}>
            Fechar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/60 z-[3000] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-xl max-h-[92vh] flex flex-col shadow-2xl">

        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-700 to-teal-600 text-white p-5 rounded-t-2xl">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Building2 size={18} />
                <h2 style={{ fontWeight: 700 }}>Cadastrar Estabelecimento</h2>
              </div>
              <p className="text-emerald-100 text-sm">Registre sua unidade de saúde no MapsSaúde</p>
            </div>
            <button onClick={onClose} className="p-1.5 hover:bg-white/20 rounded-lg transition flex-shrink-0">
              <X size={18} />
            </button>
          </div>

          {/* Step indicator */}
          <div className="flex items-center gap-1 mt-4">
            {STEPS.map((label, i) => (
              <React.Fragment key={i}>
                <div className="flex flex-col items-center">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs transition-all ${
                    i < step ? "bg-white text-emerald-700" : i === step ? "bg-white/90 text-emerald-700 ring-2 ring-white/40" : "bg-white/20 text-white/70"
                  }`} style={{ fontWeight: 700 }}>
                    {i < step ? <CheckCircle size={14} /> : i + 1}
                  </div>
                  <span className={`text-xs mt-0.5 hidden sm:block ${i === step ? "text-white" : "text-white/50"}`} style={{ fontWeight: i === step ? 600 : 400 }}>
                    {label}
                  </span>
                </div>
                {i < STEPS.length - 1 && (
                  <div className={`flex-1 h-0.5 mb-3 rounded ${i < step ? "bg-white" : "bg-white/20"}`} />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5">

          {/* Step 0 – Identification */}
          {step === 0 && (
            <div className="space-y-4">
              <p className="text-sm text-gray-500 mb-4">Informações básicas do estabelecimento</p>
              <F label="Nome do estabelecimento *" error={errors.name}>
                <input value={form.name} onChange={(e) => set("name", e.target.value)}
                  placeholder="Ex: Clínica Saúde Total" className="input-field" />
              </F>
              <div>
                <p className="text-xs text-gray-500 mb-2" style={{ fontWeight: 600 }}>Categoria *</p>
                <div className="grid grid-cols-1 gap-2">
                  {CATEGORIES.map((cat) => (
                    <button key={cat.value} type="button" onClick={() => set("category", cat.value)}
                      className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${
                        form.category === cat.value ? "border-emerald-500 bg-emerald-50" : "border-gray-200 hover:border-gray-300"
                      }`}>
                      <span className="text-2xl">{categoryIcons[cat.value]}</span>
                      <div>
                        <p className="text-sm" style={{ fontWeight: form.category === cat.value ? 600 : 400 }}>{cat.label}</p>
                        <p className="text-xs text-gray-400">{cat.desc}</p>
                      </div>
                      {form.category === cat.value && <CheckCircle size={16} className="text-emerald-500 ml-auto flex-shrink-0" />}
                    </button>
                  ))}
                </div>
              </div>
              <F label="CNPJ">
                <input value={form.cnpj} onChange={(e) => set("cnpj", e.target.value)}
                  placeholder="00.000.000/0000-00" className="input-field" maxLength={18} />
                {errors.cnpj && <p className="text-xs text-red-500 mt-1">{errors.cnpj}</p>}
              </F>
            </div>
          )}

          {/* Step 1 – Contact */}
          {step === 1 && (
            <div className="space-y-4">
              <p className="text-sm text-gray-500 mb-4">Como os pacientes podem entrar em contato</p>
              <div className="grid grid-cols-2 gap-3">
                <F label="Telefone *" error={errors.phone}>
                  <div className="relative">
                    <Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input value={form.phone} onChange={(e) => set("phone", e.target.value)}
                      placeholder="(75) 3000-0000" className="input-field pl-9" />
                  </div>
                </F>
                <F label="WhatsApp">
                  <div className="relative">
                    <Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-green-500" />
                    <input value={form.whatsapp} onChange={(e) => set("whatsapp", e.target.value)}
                      placeholder="(75) 99000-0000" className="input-field pl-9" />
                  </div>
                </F>
              </div>
              <F label="E-mail" error={errors.email}>
                <div className="relative">
                  <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input type="email" value={form.email} onChange={(e) => set("email", e.target.value)}
                    placeholder="contato@suaclinica.com.br" className="input-field pl-9" />
                </div>
              </F>
              <F label="Site / Redes sociais">
                <input value={form.website} onChange={(e) => set("website", e.target.value)}
                  placeholder="www.suaclinica.com.br ou @instagram" className="input-field" />
              </F>
              <F label="Horário de funcionamento *" error={errors.hours}>
                <div className="relative">
                  <Clock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input value={form.hours} onChange={(e) => set("hours", e.target.value)}
                    placeholder="Seg-Sex: 08:00-18:00 | Sáb: 08:00-12:00" className="input-field pl-9" />
                </div>
              </F>
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-xs text-blue-700">
                💡 Seja específico no horário. Ex: "24 horas" ou "Seg-Sex: 07:00-19:00 | Sáb: 07:00-13:00 | Não abre domingos"
              </div>
            </div>
          )}

          {/* Step 2 – Address */}
          {step === 2 && (
            <div className="space-y-4">
              <p className="text-sm text-gray-500 mb-4">Localização do estabelecimento</p>
              <F label="Endereço completo *" error={errors.address}>
                <div className="relative">
                  <MapPin size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input value={form.address} onChange={(e) => set("address", e.target.value)}
                    placeholder="Rua, número, complemento" className="input-field pl-9" />
                </div>
              </F>
              <div className="grid grid-cols-2 gap-3">
                <F label="Bairro *" error={errors.neighborhood}>
                  <input value={form.neighborhood} onChange={(e) => set("neighborhood", e.target.value)}
                    placeholder="Bairro" className="input-field" />
                </F>
                <F label="CEP">
                  <input value={form.zipCode} onChange={(e) => set("zipCode", e.target.value)}
                    placeholder="00000-000" className="input-field" maxLength={9} />
                </F>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <F label="Cidade *" error={errors.city}>
                    <input value={form.city} onChange={(e) => set("city", e.target.value)}
                      placeholder="Cidade" className="input-field" />
                  </F>
                </div>
                <F label="Estado *" error={errors.state}>
                  <input value={form.state} onChange={(e) => set("state", e.target.value.toUpperCase())}
                    placeholder="BA" className="input-field" maxLength={2} />
                </F>
              </div>
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-700">
                📍 Após aprovação, nossa equipe confirmará as coordenadas geográficas no mapa com base no endereço informado.
              </div>
            </div>
          )}

          {/* Step 3 – Services */}
          {step === 3 && (
            <div className="space-y-4">
              <p className="text-sm text-gray-500 mb-4">Serviços e especialidades oferecidos</p>
              <div>
                <p className="text-xs text-gray-500 mb-2" style={{ fontWeight: 600 }}>Especialidades</p>
                <div className="flex gap-2 mb-2">
                  <input
                    value={specInput}
                    onChange={(e) => setSpecInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addSpecialty(specInput))}
                    placeholder="Digite e pressione Enter ou clique +"
                    className="flex-1 input-field"
                  />
                  <button type="button" onClick={() => addSpecialty(specInput)}
                    className="px-3 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition">
                    <Plus size={16} />
                  </button>
                </div>

                {/* Suggestions */}
                <p className="text-xs text-gray-400 mb-1.5">Sugestões para {categoryLabels[form.category]}:</p>
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {SPECIALTY_SUGGESTIONS[form.category]
                    .filter((s) => !form.specialties.includes(s))
                    .map((s) => (
                      <button key={s} type="button" onClick={() => addSpecialty(s)}
                        className="px-2.5 py-1 text-xs border border-dashed border-gray-300 rounded-full text-gray-500 hover:border-emerald-400 hover:text-emerald-600 hover:bg-emerald-50 transition">
                        + {s}
                      </button>
                    ))}
                </div>

                {/* Added specialties */}
                {form.specialties.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {form.specialties.map((s) => (
                      <span key={s} className="flex items-center gap-1 px-2.5 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs">
                        {s}
                        <button onClick={() => removeSpecialty(s)} className="hover:text-red-500">
                          <X size={10} />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <F label="Descrição do estabelecimento">
                <textarea value={form.description} onChange={(e) => set("description", e.target.value)}
                  placeholder="Descreva brevemente o estabelecimento, diferenciais, estrutura, etc."
                  className="input-field resize-none" rows={4} />
              </F>
            </div>
          )}

          {/* Step 4 – Responsible */}
          {step === 4 && (
            <div className="space-y-4">
              <p className="text-sm text-gray-500 mb-4">Dados do responsável pelo cadastro</p>
              <F label="Nome completo *" error={errors.responsibleName}>
                <input value={form.responsibleName} onChange={(e) => set("responsibleName", e.target.value)}
                  placeholder="Nome do responsável" className="input-field" />
              </F>
              <F label="Cargo / Função">
                <input value={form.responsibleRole} onChange={(e) => set("responsibleRole", e.target.value)}
                  placeholder="Ex: Diretor, Gerente, Proprietário" className="input-field" />
              </F>
              <div className="grid grid-cols-2 gap-3">
                <F label="E-mail de contato *" error={errors.responsibleEmail}>
                  <input type="email" value={form.responsibleEmail} onChange={(e) => set("responsibleEmail", e.target.value)}
                    placeholder="responsavel@email.com" className="input-field" />
                </F>
                <F label="Telefone *" error={errors.responsiblePhone}>
                  <input value={form.responsiblePhone} onChange={(e) => set("responsiblePhone", e.target.value)}
                    placeholder="(75) 99000-0000" className="input-field" />
                </F>
              </div>

              {/* Summary */}
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-200 space-y-2">
                <p className="text-xs text-gray-500" style={{ fontWeight: 700 }}>RESUMO DO CADASTRO</p>
                <Row label="Estabelecimento" value={form.name} />
                <Row label="Categoria" value={categoryLabels[form.category]} />
                <Row label="Cidade" value={`${form.city}${form.state ? " - " + form.state : ""}`} />
                <Row label="Telefone" value={form.phone} />
                {form.specialties.length > 0 && (
                  <Row label="Especialidades" value={form.specialties.slice(0, 3).join(", ") + (form.specialties.length > 3 ? "..." : "")} />
                )}
              </div>

              {/* Terms */}
              <label className={`flex items-start gap-2 cursor-pointer p-3 rounded-xl border ${errors.acceptTerms ? "border-red-300 bg-red-50" : "border-gray-200 hover:border-emerald-300"} transition`}>
                <input type="checkbox" checked={form.acceptTerms} onChange={(e) => set("acceptTerms", e.target.checked)}
                  className="w-4 h-4 accent-emerald-600 mt-0.5 flex-shrink-0" />
                <span className="text-xs text-gray-600">
                  Declaro que as informações fornecidas são verdadeiras e que tenho autorização para cadastrar este estabelecimento no MapsSaúde. Estou ciente de que dados falsos podem resultar no cancelamento do cadastro.
                </span>
              </label>
              {errors.acceptTerms && (
                <p className="text-xs text-red-500 flex items-center gap-1 -mt-2">
                  <AlertCircle size={12} /> {errors.acceptTerms}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-100 flex gap-3">
          <button
            onClick={step === 0 ? onClose : () => setStep((s) => s - 1)}
            className="flex items-center gap-1.5 px-4 py-2.5 border border-gray-200 text-gray-600 rounded-xl text-sm hover:bg-gray-50 transition"
          >
            <ChevronLeft size={15} />
            {step === 0 ? "Cancelar" : "Voltar"}
          </button>
          <button
            onClick={step === STEPS.length - 1 ? handleSubmit : next}
            disabled={loading}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white rounded-xl text-sm transition"
            style={{ fontWeight: 600 }}
          >
            {loading ? (
              <><Loader2 size={15} className="animate-spin" /> Enviando...</>
            ) : step === STEPS.length - 1 ? (
              <><Send size={15} /> Enviar para análise</>
            ) : (
              <>Próximo <ChevronRight size={15} /></>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

function F({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs text-gray-500 mb-1.5" style={{ fontWeight: 600 }}>{label}</label>
      {children}
      {error && (
        <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
          <AlertCircle size={11} /> {error}
        </p>
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  if (!value) return null;
  return (
    <div className="flex justify-between text-xs">
      <span className="text-gray-400">{label}</span>
      <span className="text-gray-700 text-right" style={{ fontWeight: 500 }}>{value}</span>
    </div>
  );
}
