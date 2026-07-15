import React, { useState, useEffect } from "react";
import { useAuth } from "../AuthContext";
import { checkPasswordStrength } from "../authService";
import {
  Heart, MapPin, Eye, EyeOff, Shield, Building2, User,
  Lock, Mail, AlertCircle, CheckCircle, Loader2, RefreshCw,
} from "lucide-react";

interface LoginPageProps {
  onClose?: () => void;
}

export function LoginPage({ onClose }: LoginPageProps) {
  const { login, register } = useAuth();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [role, setRole] = useState<"user" | "health_unit">("user");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [lockoutSeconds, setLockoutSeconds] = useState(0);

  // Countdown for lockout
  useEffect(() => {
    if (lockoutSeconds <= 0) return;
    const t = setInterval(() => setLockoutSeconds((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(t);
  }, [lockoutSeconds]);

  const strength = password ? checkPasswordStrength(password) : null;

  const demoAccounts = [
    { label: "Admin", email: "admin@mapssaude.com", role: "admin" as const, icon: <Shield size={14} />, color: "#7c3aed" },
    { label: "Unidade", email: "hc@mapssaude.com", role: "health_unit" as const, icon: <Building2 size={14} />, color: "#0891b2" },
    { label: "Usuário", email: "maria@email.com", role: "user" as const, icon: <User size={14} />, color: "#059669" },
  ];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (loading || lockoutSeconds > 0) return;
    setError("");
    setLoading(true);

    try {
      if (mode === "login") {
        const result = await login(email, password, rememberMe);
        if (result.success) {
          onClose?.();
        } else {
          setError(result.error ?? "Erro ao fazer login.");
          if (result.lockoutSeconds) setLockoutSeconds(result.lockoutSeconds);
        }
      } else {
        if (password !== confirmPassword) {
          setError("As senhas não coincidem.");
          setLoading(false);
          return;
        }
        const result = await register(name, email, password, role);
        if (result.success) {
          onClose?.();
        } else {
          setError(result.error ?? "Erro ao cadastrar.");
        }
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleDemo(demoEmail: string) {
    setError("");
    setLoading(true);
    const result = await login(demoEmail, "demo123", true);
    setLoading(false);
    if (result.success) onClose?.();
    else setError(result.error ?? "Erro no acesso demo.");
  }

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-emerald-50 via-white to-teal-50 z-[3000] flex items-center justify-center p-4">
      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-emerald-600 rounded-2xl mb-3 shadow-lg">
            <Heart size={28} className="text-white" />
          </div>
          <h1 className="text-2xl text-emerald-800" style={{ fontWeight: 700 }}>MapsSaúde</h1>
          <p className="text-gray-500 text-sm mt-0.5 flex items-center justify-center gap-1">
            <MapPin size={13} /> Localizador de Unidades de Saúde
          </p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100">

          {/* Tabs */}
          <div className="flex rounded-t-2xl overflow-hidden border-b border-gray-100">
            <button
              onClick={() => { setMode("login"); setError(""); }}
              className={`flex-1 py-3.5 text-sm transition-all ${mode === "login" ? "bg-emerald-600 text-white" : "text-gray-500 hover:bg-gray-50"}`}
              style={{ fontWeight: 600 }}
            >
              Entrar
            </button>
            <button
              onClick={() => { setMode("register"); setError(""); }}
              className={`flex-1 py-3.5 text-sm transition-all ${mode === "register" ? "bg-emerald-600 text-white" : "text-gray-500 hover:bg-gray-50"}`}
              style={{ fontWeight: 600 }}
            >
              Criar conta
            </button>
          </div>

          <div className="p-6">
            <form onSubmit={handleSubmit} className="space-y-4">

              {/* Name (register only) */}
              {mode === "register" && (
                <div>
                  <label className="block text-xs text-gray-600 mb-1.5" style={{ fontWeight: 600 }}>Nome completo</label>
                  <div className="relative">
                    <User size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Seu nome completo"
                      className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-400 bg-gray-50 text-sm"
                      required
                      minLength={3}
                    />
                  </div>
                </div>
              )}

              {/* Account type (register only) */}
              {mode === "register" && (
                <div>
                  <label className="block text-xs text-gray-600 mb-1.5" style={{ fontWeight: 600 }}>Tipo de conta</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button type="button" onClick={() => setRole("user")}
                      className={`flex items-center justify-center gap-2 py-2.5 rounded-lg border text-sm transition-all ${role === "user" ? "border-emerald-500 bg-emerald-50 text-emerald-700" : "border-gray-200 text-gray-600 hover:border-gray-300"}`}
                    >
                      <User size={15} /> Usuário
                    </button>
                    <button type="button" onClick={() => setRole("health_unit")}
                      className={`flex items-center justify-center gap-2 py-2.5 rounded-lg border text-sm transition-all ${role === "health_unit" ? "border-emerald-500 bg-emerald-50 text-emerald-700" : "border-gray-200 text-gray-600 hover:border-gray-300"}`}
                    >
                      <Building2 size={15} /> Unidade
                    </button>
                  </div>
                </div>
              )}

              {/* Email */}
              <div>
                <label className="block text-xs text-gray-600 mb-1.5" style={{ fontWeight: 600 }}>E-mail</label>
                <div className="relative">
                  <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="seu@email.com"
                    className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-400 bg-gray-50 text-sm"
                    required
                    autoComplete="email"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs text-gray-600 mb-1.5" style={{ fontWeight: 600 }}>Senha</label>
                <div className="relative">
                  <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-10 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-400 bg-gray-50 text-sm"
                    required
                    autoComplete={mode === "login" ? "current-password" : "new-password"}
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>

                {/* Password strength (register only) */}
                {mode === "register" && strength && (
                  <div className="mt-2">
                    <div className="flex gap-1 mb-1">
                      {[0, 1, 2, 3].map((i) => (
                        <div key={i} className="flex-1 h-1 rounded-full transition-all"
                          style={{ background: i < strength.score ? strength.color : "#e2e8f0" }} />
                      ))}
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs" style={{ color: strength.color, fontWeight: 600 }}>{strength.label}</span>
                      {strength.hints[0] && (
                        <span className="text-xs text-gray-400">{strength.hints[0]}</span>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Confirm password (register only) */}
              {mode === "register" && (
                <div>
                  <label className="block text-xs text-gray-600 mb-1.5" style={{ fontWeight: 600 }}>Confirmar senha</label>
                  <div className="relative">
                    <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type={showPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className={`w-full pl-9 pr-10 py-2.5 rounded-lg border focus:outline-none focus:ring-2 focus:ring-emerald-400 bg-gray-50 text-sm ${
                        confirmPassword && confirmPassword !== password ? "border-red-300" : "border-gray-200"
                      }`}
                      required
                      autoComplete="new-password"
                    />
                    {confirmPassword && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        {confirmPassword === password
                          ? <CheckCircle size={15} className="text-emerald-500" />
                          : <AlertCircle size={15} className="text-red-400" />}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Remember me (login only) */}
              {mode === "login" && (
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 accent-emerald-600 rounded" />
                  <span className="text-sm text-gray-600">Manter conectado por 7 dias</span>
                </label>
              )}

              {/* Error */}
              {error && (
                <div className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2.5 rounded-lg">
                  <AlertCircle size={15} className="flex-shrink-0 mt-0.5" />
                  <span>{error}</span>
                  {lockoutSeconds > 0 && (
                    <span className="ml-auto flex items-center gap-1 text-xs bg-red-100 px-2 py-0.5 rounded-full whitespace-nowrap">
                      <RefreshCw size={10} /> {lockoutSeconds}s
                    </span>
                  )}
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={loading || lockoutSeconds > 0}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 disabled:cursor-not-allowed text-white rounded-lg transition-colors shadow-md flex items-center justify-center gap-2"
                style={{ fontWeight: 600 }}
              >
                {loading
                  ? <><Loader2 size={16} className="animate-spin" /> Processando...</>
                  : lockoutSeconds > 0
                  ? `Aguarde ${lockoutSeconds}s`
                  : mode === "login" ? "Entrar com segurança" : "Criar minha conta"}
              </button>
            </form>

            {/* Security badge */}
            <div className="flex items-center justify-center gap-2 mt-4 text-xs text-gray-400">
              <Shield size={11} />
              <span>Senha protegida com SHA-256 • Sessão criptografada</span>
            </div>

            {/* Demo accounts */}
            <div className="mt-5 pt-5 border-t border-gray-100">
              <p className="text-xs text-gray-400 text-center mb-3" style={{ fontWeight: 500 }}>
                ACESSO RÁPIDO — DEMONSTRAÇÃO
              </p>
              <div className="grid grid-cols-3 gap-2">
                {demoAccounts.map((acc) => (
                  <button key={acc.email} onClick={() => handleDemo(acc.email)}
                    disabled={loading}
                    className="flex flex-col items-center gap-1.5 py-2.5 rounded-xl border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all text-xs text-gray-600 disabled:opacity-50">
                    <span style={{ color: acc.color }}>{acc.icon}</span>
                    <span style={{ fontWeight: 500 }}>{acc.label}</span>
                  </button>
                ))}
              </div>
              <p className="text-xs text-gray-400 text-center mt-2">Senha de todos: <code className="bg-gray-100 px-1 rounded">demo123</code></p>
            </div>
          </div>
        </div>

        {/* Continue without login */}
        {onClose && (
          <div className="text-center mt-4">
            <button onClick={onClose} className="text-sm text-gray-500 hover:text-gray-700">
              Continuar sem fazer login →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
