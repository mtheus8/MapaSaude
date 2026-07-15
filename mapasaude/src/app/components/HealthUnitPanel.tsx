import React, { useState } from "react";
import { X, Plus, Save, Trash2, Edit3, User, Stethoscope } from "lucide-react";
import { HealthUnit, Professional, UnitCategory } from "../types";
import { categoryLabels } from "../mockData";

interface HealthUnitPanelProps {
  unit: HealthUnit | null;
  onClose: () => void;
  onSave: (unit: HealthUnit) => void;
}

export function HealthUnitPanel({ unit, onClose, onSave }: HealthUnitPanelProps) {
  const [form, setForm] = useState<Partial<HealthUnit>>(
    unit ?? {
      id: `u${Date.now()}`,
      name: "",
      category: "clinic",
      address: "",
      neighborhood: "",
      city: "",
      state: "",
      zipCode: "",
      lat: -12.1388,
      lng: -38.4228,
      phone: "",
      whatsapp: "",
      email: "",
      hours: "",
      specialties: [],
      professionals: [],
      reviews: [],
      rating: 0,
      totalReviews: 0,
      approved: false,
      locationVerified: false,
      locationVotes: 0,
    }
  );

  const [specialtyInput, setSpecialtyInput] = useState("");
  const [profForm, setProfForm] = useState({ name: "", role: "doctor" as Professional["role"], specialty: "", crm: "", crf: "" });
  const [showProfForm, setShowProfForm] = useState(false);
  const [saved, setSaved] = useState(false);

  function update(field: string, value: unknown) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function addSpecialty() {
    if (!specialtyInput.trim()) return;
    update("specialties", [...(form.specialties ?? []), specialtyInput.trim()]);
    setSpecialtyInput("");
  }

  function removeSpecialty(s: string) {
    update("specialties", (form.specialties ?? []).filter((x) => x !== s));
  }

  function addProfessional() {
    if (!profForm.name.trim()) return;
    const prof: Professional = {
      id: `p${Date.now()}`,
      name: profForm.name,
      role: profForm.role,
      specialty: profForm.specialty || undefined,
      crm: profForm.crm || undefined,
      crf: profForm.crf || undefined,
    };
    update("professionals", [...(form.professionals ?? []), prof]);
    setProfForm({ name: "", role: "doctor", specialty: "", crm: "", crf: "" });
    setShowProfForm(false);
  }

  function removeProfessional(id: string) {
    update("professionals", (form.professionals ?? []).filter((p) => p.id !== id));
  }

  function handleSave() {
    if (!form.name || !form.address || !form.phone) return;
    onSave(form as HealthUnit);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  const isNew = !unit;

  return (
    <div className="fixed inset-0 bg-black/50 z-[2000] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-700 to-teal-600 text-white p-5 rounded-t-2xl flex items-center justify-between">
          <div>
            <h2 style={{ fontWeight: 700 }}>{isNew ? "Cadastrar Unidade de Saúde" : "Editar Unidade"}</h2>
            <p className="text-emerald-100 text-sm mt-0.5">Preencha todas as informações corretamente</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg transition">
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Basic info */}
          <Section title="Informações Básicas">
            <Field label="Nome da Unidade *">
              <input value={form.name ?? ""} onChange={(e) => update("name", e.target.value)} className="input-field" placeholder="Ex: Hospital Municipal de..." />
            </Field>
            <Field label="Categoria *">
              <select value={form.category ?? "clinic"} onChange={(e) => update("category", e.target.value as UnitCategory)} className="input-field">
                {(Object.entries(categoryLabels) as Array<[string, string]>).filter(([k]) => k !== "all").map(([v, l]) => (
                  <option key={v} value={v}>{l}</option>
                ))}
              </select>
            </Field>
          </Section>

          {/* Contact */}
          <Section title="Contato">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Telefone *">
                <input value={form.phone ?? ""} onChange={(e) => update("phone", e.target.value)} className="input-field" placeholder="(11) 99999-9999" />
              </Field>
              <Field label="WhatsApp">
                <input value={form.whatsapp ?? ""} onChange={(e) => update("whatsapp", e.target.value)} className="input-field" placeholder="(11) 99999-9999" />
              </Field>
            </div>
            <Field label="E-mail">
              <input type="email" value={form.email ?? ""} onChange={(e) => update("email", e.target.value)} className="input-field" placeholder="contato@unidade.com.br" />
            </Field>
            <Field label="Horário de Funcionamento *">
              <input value={form.hours ?? ""} onChange={(e) => update("hours", e.target.value)} className="input-field" placeholder="Ex: Seg-Sex: 08:00-18:00 | Sáb: 08:00-13:00" />
            </Field>
          </Section>

          {/* Address */}
          <Section title="Endereço">
            <Field label="Endereço *">
              <input value={form.address ?? ""} onChange={(e) => update("address", e.target.value)} className="input-field" placeholder="Rua, número" />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Bairro">
                <input value={form.neighborhood ?? ""} onChange={(e) => update("neighborhood", e.target.value)} className="input-field" />
              </Field>
              <Field label="CEP">
                <input value={form.zipCode ?? ""} onChange={(e) => update("zipCode", e.target.value)} className="input-field" placeholder="00000-000" />
              </Field>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <Field label="Cidade" className="col-span-2">
                <input value={form.city ?? ""} onChange={(e) => update("city", e.target.value)} className="input-field" />
              </Field>
              <Field label="Estado">
                <input value={form.state ?? ""} onChange={(e) => update("state", e.target.value)} className="input-field" placeholder="SP" maxLength={2} />
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Latitude">
                <input type="number" step="any" value={form.lat ?? ""} onChange={(e) => update("lat", parseFloat(e.target.value))} className="input-field" placeholder="-23.5505" />
              </Field>
              <Field label="Longitude">
                <input type="number" step="any" value={form.lng ?? ""} onChange={(e) => update("lng", parseFloat(e.target.value))} className="input-field" placeholder="-46.6333" />
              </Field>
            </div>
          </Section>

          {/* Specialties */}
          <Section title="Especialidades">
            <div className="flex gap-2">
              <input
                value={specialtyInput}
                onChange={(e) => setSpecialtyInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addSpecialty())}
                className="flex-1 input-field"
                placeholder="Ex: Cardiologia"
              />
              <button onClick={addSpecialty} className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm hover:bg-emerald-700 transition">
                <Plus size={16} />
              </button>
            </div>
            <div className="flex flex-wrap gap-1.5 mt-2">
              {(form.specialties ?? []).map((s) => (
                <span key={s} className="flex items-center gap-1 px-2.5 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs">
                  {s}
                  <button onClick={() => removeSpecialty(s)} className="hover:text-red-500">
                    <X size={10} />
                  </button>
                </span>
              ))}
            </div>
          </Section>

          {/* Professionals */}
          <Section title="Profissionais">
            {(form.professionals ?? []).map((prof) => (
              <div key={prof.id} className="flex items-center gap-2 p-2.5 bg-gray-50 rounded-lg">
                {prof.role === "pharmacist" ? <Stethoscope size={14} className="text-emerald-500" /> : <User size={14} className="text-blue-500" />}
                <div className="flex-1 text-sm">
                  <span style={{ fontWeight: 500 }}>{prof.name}</span>
                  {prof.specialty && <span className="text-gray-500"> • {prof.specialty}</span>}
                </div>
                <button onClick={() => removeProfessional(prof.id)} className="text-red-400 hover:text-red-600">
                  <Trash2 size={14} />
                </button>
              </div>
            ))}

            {showProfForm ? (
              <div className="border border-emerald-200 rounded-xl p-3 space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <input value={profForm.name} onChange={(e) => setProfForm((p) => ({ ...p, name: e.target.value }))} className="input-field text-sm" placeholder="Nome do profissional" />
                  <select value={profForm.role} onChange={(e) => setProfForm((p) => ({ ...p, role: e.target.value as Professional["role"] }))} className="input-field text-sm">
                    <option value="doctor">Médico(a)</option>
                    <option value="pharmacist">Farmacêutico(a)</option>
                    <option value="nurse">Enfermeiro(a)</option>
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <input value={profForm.specialty} onChange={(e) => setProfForm((p) => ({ ...p, specialty: e.target.value }))} className="input-field text-sm" placeholder="Especialidade" />
                  <input value={profForm.role === "pharmacist" ? profForm.crf : profForm.crm} onChange={(e) => setProfForm((p) => profForm.role === "pharmacist" ? { ...p, crf: e.target.value } : { ...p, crm: e.target.value })} className="input-field text-sm" placeholder={profForm.role === "pharmacist" ? "CRF" : "CRM"} />
                </div>
                <div className="flex gap-2">
                  <button onClick={addProfessional} className="flex-1 py-1.5 bg-emerald-600 text-white rounded-lg text-sm hover:bg-emerald-700 transition" style={{ fontWeight: 500 }}>Adicionar</button>
                  <button onClick={() => setShowProfForm(false)} className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm hover:bg-gray-50 transition">Cancelar</button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setShowProfForm(true)}
                className="flex items-center gap-2 text-sm text-emerald-600 hover:text-emerald-700 border border-dashed border-emerald-300 rounded-lg px-3 py-2 w-full hover:bg-emerald-50 transition"
              >
                <Plus size={14} /> Adicionar profissional
              </button>
            )}
          </Section>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-100 flex gap-3">
          <button onClick={onClose} className="px-5 py-2.5 border border-gray-200 text-gray-600 rounded-xl text-sm hover:bg-gray-50 transition">
            Cancelar
          </button>
          <button
            onClick={handleSave}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm text-white transition ${saved ? "bg-green-500" : "bg-emerald-600 hover:bg-emerald-700"}`}
            style={{ fontWeight: 600 }}
          >
            {saved ? (
              <><Edit3 size={16} /> Salvo com sucesso!</>
            ) : (
              <><Save size={16} /> {isNew ? "Cadastrar Unidade" : "Salvar Alterações"}</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-sm text-emerald-700 mb-3 pb-1 border-b border-emerald-100" style={{ fontWeight: 600 }}>{title}</p>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function Field({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={className}>
      <label className="block text-xs text-gray-500 mb-1" style={{ fontWeight: 500 }}>{label}</label>
      {children}
    </div>
  );
}
