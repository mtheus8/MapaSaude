import { User, UserRole } from "./types";

// ─── Internal stored type (never exposed to UI) ───────────────────────────────
interface StoredUser {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  unitId?: string;
  createdAt: string;
  active: boolean;
}

interface Session {
  userId: string;
  token: string;
  expiresAt: number; // epoch ms
}

// ─── Constants ────────────────────────────────────────────────────────────────
const STORAGE_USERS_KEY = "mapssaude:users";
const STORAGE_SESSION_KEY = "mapssaude:session";
const SALT = "MapsSaude@2026#secure";
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
const SESSION_TTL_SHORT_MS = 2 * 60 * 60 * 1000; // 2h (no remember-me)
const MAX_ATTEMPTS = 5;
const LOCKOUT_MS = 30_000; // 30 s

// In-memory rate limiter (resets on page reload — acceptable for client side)
const attemptTracker = new Map<string, { count: number; lockedUntil: number }>();

// ─── Crypto helpers ───────────────────────────────────────────────────────────
async function sha256(text: string): Promise<string> {
  const buf = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(text)
  );
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function hashPassword(password: string): Promise<string> {
  return sha256(SALT + password + SALT);
}

function generateToken(): string {
  const arr = new Uint8Array(32);
  crypto.getRandomValues(arr);
  return Array.from(arr).map((b) => b.toString(16).padStart(2, "0")).join("");
}

// ─── LocalStorage helpers ─────────────────────────────────────────────────────
function loadUsers(): StoredUser[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_USERS_KEY) ?? "[]");
  } catch {
    return [];
  }
}

function saveUsers(users: StoredUser[]) {
  localStorage.setItem(STORAGE_USERS_KEY, JSON.stringify(users));
}

function loadSession(): Session | null {
  try {
    const raw = localStorage.getItem(STORAGE_SESSION_KEY);
    if (!raw) return null;
    const s: Session = JSON.parse(raw);
    if (s.expiresAt < Date.now()) {
      localStorage.removeItem(STORAGE_SESSION_KEY);
      return null;
    }
    return s;
  } catch {
    return null;
  }
}

function saveSession(session: Session) {
  localStorage.setItem(STORAGE_SESSION_KEY, JSON.stringify(session));
}

function clearSession() {
  localStorage.removeItem(STORAGE_SESSION_KEY);
}

// ─── Seed default accounts on first load ─────────────────────────────────────
async function seedDefaultUsers() {
  const existing = loadUsers();
  if (existing.length > 0) return;

  const hash = await hashPassword("demo123");
  const defaults: StoredUser[] = [
    { id: "u1", name: "Admin Sistema", email: "admin@mapssaude.com", passwordHash: hash, role: "admin", createdAt: "2026-01-01T00:00:00Z", active: true },
    { id: "u2", name: "Hospital das Clínicas", email: "hc@mapssaude.com", passwordHash: hash, role: "health_unit", unitId: "1", createdAt: "2026-01-01T00:00:00Z", active: true },
    { id: "u3", name: "Maria Silva", email: "maria@email.com", passwordHash: hash, role: "user", createdAt: "2026-01-01T00:00:00Z", active: true },
    { id: "u4", name: "João Santos", email: "joao@email.com", passwordHash: hash, role: "user", createdAt: "2026-01-01T00:00:00Z", active: true },
  ];
  saveUsers(defaults);
}

// ─── Validation ───────────────────────────────────────────────────────────────
export interface PasswordStrength {
  score: number; // 0-4
  label: string;
  color: string;
  hints: string[];
}

export function checkPasswordStrength(password: string): PasswordStrength {
  const hints: string[] = [];
  let score = 0;

  if (password.length >= 8) score++; else hints.push("Mínimo 8 caracteres");
  if (/[A-Z]/.test(password)) score++; else hints.push("Adicione letras maiúsculas");
  if (/[0-9]/.test(password)) score++; else hints.push("Adicione números");
  if (/[^A-Za-z0-9]/.test(password)) score++; else hints.push("Adicione símbolos (!@#$...)");

  const labels = ["Muito fraca", "Fraca", "Razoável", "Boa", "Forte"];
  const colors = ["#ef4444", "#f97316", "#eab308", "#3b82f6", "#22c55e"];

  return { score, label: labels[score], color: colors[score], hints };
}

function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// ─── Public API ───────────────────────────────────────────────────────────────
export interface AuthResult {
  success: boolean;
  error?: string;
  user?: User;
  remainingAttempts?: number;
  lockoutSeconds?: number;
}

export async function authLogin(
  email: string,
  password: string,
  rememberMe: boolean
): Promise<AuthResult> {
  await seedDefaultUsers();

  const key = email.toLowerCase().trim();

  // Rate limit
  const attempts = attemptTracker.get(key);
  if (attempts && attempts.lockedUntil > Date.now()) {
    const secs = Math.ceil((attempts.lockedUntil - Date.now()) / 1000);
    return { success: false, error: `Conta temporariamente bloqueada. Aguarde ${secs}s.`, lockoutSeconds: secs };
  }

  if (!validateEmail(email)) {
    return { success: false, error: "Formato de e-mail inválido." };
  }
  if (!password) {
    return { success: false, error: "Informe a senha." };
  }

  const users = loadUsers();
  const stored = users.find((u) => u.email.toLowerCase() === key);

  if (!stored) {
    return { success: false, error: "E-mail não cadastrado." };
  }
  if (!stored.active) {
    return { success: false, error: "Conta desativada. Contate o suporte." };
  }

  const hash = await hashPassword(password);
  if (hash !== stored.passwordHash) {
    const rec = attempts ?? { count: 0, lockedUntil: 0 };
    rec.count += 1;
    if (rec.count >= MAX_ATTEMPTS) {
      rec.lockedUntil = Date.now() + LOCKOUT_MS;
      rec.count = 0;
      attemptTracker.set(key, rec);
      return { success: false, error: `Bloqueado por ${LOCKOUT_MS / 1000}s após ${MAX_ATTEMPTS} tentativas.`, lockoutSeconds: LOCKOUT_MS / 1000 };
    }
    attemptTracker.set(key, rec);
    const left = MAX_ATTEMPTS - rec.count;
    return { success: false, error: `Senha incorreta. ${left} tentativa(s) restante(s).`, remainingAttempts: left };
  }

  // Clear attempts
  attemptTracker.delete(key);

  // Create session
  const session: Session = {
    userId: stored.id,
    token: generateToken(),
    expiresAt: Date.now() + (rememberMe ? SESSION_TTL_MS : SESSION_TTL_SHORT_MS),
  };
  saveSession(session);

  const user: User = { id: stored.id, name: stored.name, email: stored.email, role: stored.role, unitId: stored.unitId };
  return { success: true, user };
}

export async function authRegister(
  name: string,
  email: string,
  password: string,
  role: "user" | "health_unit"
): Promise<AuthResult> {
  await seedDefaultUsers();

  if (!name.trim() || name.trim().length < 3) {
    return { success: false, error: "Nome deve ter pelo menos 3 caracteres." };
  }
  if (!validateEmail(email)) {
    return { success: false, error: "Formato de e-mail inválido." };
  }

  const strength = checkPasswordStrength(password);
  if (strength.score < 2) {
    return { success: false, error: `Senha muito fraca. ${strength.hints[0] ?? ""}` };
  }

  const users = loadUsers();
  if (users.find((u) => u.email.toLowerCase() === email.toLowerCase())) {
    return { success: false, error: "Este e-mail já está cadastrado." };
  }

  const hash = await hashPassword(password);
  const newUser: StoredUser = {
    id: `u${Date.now()}`,
    name: name.trim(),
    email: email.toLowerCase().trim(),
    passwordHash: hash,
    role,
    createdAt: new Date().toISOString(),
    active: true,
  };
  saveUsers([...users, newUser]);

  const session: Session = {
    userId: newUser.id,
    token: generateToken(),
    expiresAt: Date.now() + SESSION_TTL_MS,
  };
  saveSession(session);

  const user: User = { id: newUser.id, name: newUser.name, email: newUser.email, role: newUser.role };
  return { success: true, user };
}

export function authLogout() {
  clearSession();
}

export async function authRestoreSession(): Promise<User | null> {
  await seedDefaultUsers();
  const session = loadSession();
  if (!session) return null;
  const users = loadUsers();
  const stored = users.find((u) => u.id === session.userId);
  if (!stored || !stored.active) return null;
  return { id: stored.id, name: stored.name, email: stored.email, role: stored.role, unitId: stored.unitId };
}

export async function authChangePassword(
  userId: string,
  oldPassword: string,
  newPassword: string
): Promise<AuthResult> {
  const users = loadUsers();
  const stored = users.find((u) => u.id === userId);
  if (!stored) return { success: false, error: "Usuário não encontrado." };

  const oldHash = await hashPassword(oldPassword);
  if (oldHash !== stored.passwordHash) {
    return { success: false, error: "Senha atual incorreta." };
  }

  const strength = checkPasswordStrength(newPassword);
  if (strength.score < 2) {
    return { success: false, error: `Nova senha muito fraca. ${strength.hints[0] ?? ""}` };
  }

  const newHash = await hashPassword(newPassword);
  saveUsers(users.map((u) => u.id === userId ? { ...u, passwordHash: newHash } : u));
  return { success: true };
}
