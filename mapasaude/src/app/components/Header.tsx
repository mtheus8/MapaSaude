import { Heart, LogIn, LogOut, Shield, Building2, Plus, Menu, X, MapPin } from "lucide-react";
import { useAuth } from "../AuthContext";
import { useState } from "react";

interface HeaderProps {
  onLogin: () => void;
  onAdminPanel: () => void;
  onAddUnit: () => void;
  onLocateMe: () => void;
  onRegisterBusiness: () => void;
}

export function Header({ onLogin, onAdminPanel, onAddUnit, onLocateMe, onRegisterBusiness }: HeaderProps) {
  const { currentUser, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  const roleLabel = currentUser?.role === "admin"
    ? "Administrador"
    : currentUser?.role === "health_unit"
    ? "Unidade de Saúde"
    : "Usuário";

  return (
    <header className="h-14 bg-emerald-700 text-white flex items-center px-4 gap-3 relative z-[1500] shadow-md flex-shrink-0">

      {/* Logo */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <div className="bg-white/20 rounded-lg p-1.5">
          <Heart size={18} className="text-white" />
        </div>
        <div className="hidden sm:block">
          <span className="text-base" style={{ fontWeight: 700 }}>MapsSaúde</span>
          <span className="text-emerald-200 text-xs ml-1.5 hidden lg:inline">Localizador de Saúde</span>
        </div>
      </div>

      <div className="flex-1" />

      {/* Desktop actions */}
      <div className="hidden sm:flex items-center gap-2">

        {/* Locate me */}
        <button onClick={onLocateMe}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-sm transition">
          <MapPin size={14} /> Minha localização
        </button>

        {/* Register business — visible to all */}
        <button onClick={onRegisterBusiness}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 rounded-lg text-sm transition shadow-sm"
          style={{ fontWeight: 600 }}>
          <Building2 size={14} /> Cadastrar empresa
        </button>

        {currentUser ? (
          <div className="flex items-center gap-2 pl-2 border-l border-white/20">
            {/* Admin panel */}
            {currentUser.role === "admin" && (
              <button onClick={onAdminPanel}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-sm transition">
                <Shield size={14} /> Admin
              </button>
            )}
            {/* Manage own unit */}
            {(currentUser.role === "health_unit" || currentUser.role === "admin") && (
              <button onClick={onAddUnit}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-sm transition">
                <Plus size={14} /> {currentUser.role === "admin" ? "Nova unidade" : "Minha unidade"}
              </button>
            )}
            {/* User info */}
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-sm" style={{ fontWeight: 700 }}>
                {currentUser.name[0].toUpperCase()}
              </div>
              <div className="text-right hidden lg:block">
                <p className="text-xs leading-tight" style={{ fontWeight: 600 }}>{currentUser.name.split(" ")[0]}</p>
                <p className="text-xs text-emerald-200 leading-tight">{roleLabel}</p>
              </div>
              <button onClick={logout} className="p-1.5 hover:bg-white/20 rounded-lg transition" title="Sair">
                <LogOut size={15} />
              </button>
            </div>
          </div>
        ) : (
          <button onClick={onLogin}
            className="flex items-center gap-2 px-4 py-1.5 bg-white text-emerald-700 rounded-lg text-sm hover:bg-emerald-50 transition shadow"
            style={{ fontWeight: 600 }}>
            <LogIn size={14} /> Entrar
          </button>
        )}
      </div>

      {/* Mobile menu button */}
      <button onClick={() => setMenuOpen(!menuOpen)}
        className="sm:hidden p-1.5 hover:bg-white/20 rounded-lg transition">
        {menuOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Mobile dropdown */}
      {menuOpen && (
        <div className="absolute top-14 right-0 left-0 sm:left-auto sm:w-72 bg-white shadow-xl z-50 border-t border-gray-100">
          <div className="p-3 space-y-1">
            <MobileItem icon={<MapPin size={15} className="text-emerald-500" />} label="Minha localização" onClick={() => { onLocateMe(); setMenuOpen(false); }} />
            <MobileItem
              icon={<Building2 size={15} className="text-emerald-600" />}
              label="Cadastrar empresa"
              onClick={() => { onRegisterBusiness(); setMenuOpen(false); }}
              highlight
            />
            {currentUser ? (
              <>
                <div className="px-3 py-2 bg-emerald-50 rounded-lg flex items-center gap-2 my-1">
                  <div className="w-8 h-8 rounded-full bg-emerald-200 flex items-center justify-center text-emerald-700" style={{ fontWeight: 700 }}>
                    {currentUser.name[0].toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm text-gray-800" style={{ fontWeight: 600 }}>{currentUser.name}</p>
                    <p className="text-xs text-gray-500">{roleLabel}</p>
                  </div>
                </div>
                {currentUser.role === "admin" && (
                  <MobileItem icon={<Shield size={15} className="text-violet-500" />} label="Painel Admin" onClick={() => { onAdminPanel(); setMenuOpen(false); }} />
                )}
                {(currentUser.role === "health_unit" || currentUser.role === "admin") && (
                  <MobileItem icon={<Plus size={15} className="text-blue-500" />} label={currentUser.role === "admin" ? "Nova unidade" : "Minha unidade"} onClick={() => { onAddUnit(); setMenuOpen(false); }} />
                )}
                <button onClick={() => { logout(); setMenuOpen(false); }}
                  className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-red-600 hover:bg-red-50 rounded-lg transition">
                  <LogOut size={15} /> Sair
                </button>
              </>
            ) : (
              <MobileItem icon={<LogIn size={15} className="text-emerald-600" />} label="Entrar / Criar conta" onClick={() => { onLogin(); setMenuOpen(false); }} highlight />
            )}
          </div>
        </div>
      )}
    </header>
  );
}

function MobileItem({ icon, label, onClick, highlight }: { icon: React.ReactNode; label: string; onClick: () => void; highlight?: boolean }) {
  return (
    <button onClick={onClick}
      className={`w-full flex items-center gap-2 px-3 py-2.5 text-sm rounded-lg transition ${highlight ? "text-emerald-700 hover:bg-emerald-50" : "text-gray-700 hover:bg-gray-50"}`}
      style={{ fontWeight: highlight ? 600 : 400 }}>
      {icon} {label}
    </button>
  );
}
