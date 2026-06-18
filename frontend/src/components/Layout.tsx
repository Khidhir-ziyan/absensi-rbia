import { ReactNode, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  GraduationCap,
  LayoutDashboard,
  BarChart3,
  User,
  HelpCircle,
  Sun,
  Moon,
  LogOut,
  Menu,
  X,
  Calendar,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";

interface LayoutProps {
  children: ReactNode;
}

const navItems = [
  { to: "/", label: "Kelas", icon: LayoutDashboard, description: "Kelola kelas & siswa" },
  { to: "/jadwal", label: "Jadwal", icon: Calendar, description: "Jadwal mengajar" },
  { to: "/rekap", label: "Rekap", icon: BarChart3, description: "Lihat rekap absensi" },
  { to: "/profile", label: "Profil", icon: User, description: "Pengaturan akun" },
  { to: "/panduan", label: "Panduan", icon: HelpCircle, description: "Cara menggunakan" },
];

export default function Layout({ children }: LayoutProps) {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="h-screen flex overflow-hidden bg-canvas dark:bg-canvas-dark">
      {/* ── Desktop Sidebar ── */}
      <aside className="hidden lg:flex lg:flex-col lg:w-64 bg-surface-1 dark:bg-surface-dark-1 border-r border-border dark:border-border-dark fixed inset-y-0 left-0 z-30">
        {/* Logo */}
        <div className="flex items-center gap-3 px-6 h-16 border-b border-border dark:border-border-dark flex-shrink-0">
          <div className="w-9 h-9 bg-primary rounded-lg flex items-center justify-center">
            <GraduationCap className="w-5 h-5 text-on-primary" />
          </div>
          <div>
            <h1 className="font-bold text-base leading-tight">Absensi RBIA</h1>
            <p className="text-[11px] text-ink-muted dark:text-ink-muted-dark leading-tight">Sistem Absensi Kelas</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.to;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all ${
                  isActive
                    ? "bg-primary/10 text-primary font-medium"
                    : "text-ink-muted dark:text-ink-muted-dark hover:bg-surface-2 dark:hover:bg-surface-dark-2 hover:text-ink dark:hover:text-ink-dark"
                }`}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Bottom Section */}
        <div className="flex-shrink-0 border-t border-border dark:border-border-dark">
          {/* User Info */}
          <div className="px-4 py-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                <User className="w-4 h-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{user?.name}</p>
                <p className="text-[11px] text-ink-muted dark:text-ink-muted-dark truncate">{user?.email}</p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="px-3 pb-3 flex gap-1">
            <button
              onClick={toggleTheme}
              className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs text-ink-muted dark:text-ink-muted-dark hover:bg-surface-2 dark:hover:bg-surface-dark-2 transition-colors"
              title={theme === "light" ? "Mode Gelap" : "Mode Terang"}
            >
              {theme === "light" ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
              {theme === "light" ? "Gelap" : "Terang"}
            </button>
            <button
              onClick={logout}
              className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Keluar
            </button>
          </div>
        </div>
      </aside>

      {/* ── Main Content Area ── */}
      <div className="flex-1 flex flex-col lg:ml-64 min-h-screen">
        {/* Mobile Header */}
        <header className="lg:hidden sticky top-0 z-20 flex items-center justify-between h-14 px-4 bg-surface-1 dark:bg-surface-dark-1 border-b border-border dark:border-border-dark backdrop-blur-sm bg-opacity-90 dark:bg-opacity-90">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-on-primary" />
            </div>
            <span className="font-bold text-sm">Absensi RBIA</span>
          </Link>
          <div className="flex items-center gap-1">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg text-ink-muted dark:text-ink-muted-dark hover:bg-surface-2 dark:hover:bg-surface-dark-2"
            >
              {theme === "light" ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
            </button>
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 rounded-lg text-ink-muted dark:text-ink-muted-dark hover:bg-surface-2 dark:hover:bg-surface-dark-2"
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* Scrollable Content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>

      {/* ── Mobile Sidebar Overlay ── */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setSidebarOpen(false)}
          />
          {/* Drawer */}
          <div className="absolute inset-y-0 left-0 w-72 bg-surface-1 dark:bg-surface-dark-1 shadow-xl flex flex-col animate-fade-in">
            {/* Header */}
            <div className="flex items-center justify-between px-4 h-14 border-b border-border dark:border-border-dark flex-shrink-0">
              <Link to="/" className="flex items-center gap-2" onClick={() => setSidebarOpen(false)}>
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                  <GraduationCap className="w-5 h-5 text-on-primary" />
                </div>
                <span className="font-bold text-sm">Absensi RBIA</span>
              </Link>
              <button
                onClick={() => setSidebarOpen(false)}
                className="p-2 rounded-lg hover:bg-surface-2 dark:hover:bg-surface-dark-2"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Nav */}
            <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.to;
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    onClick={() => setSidebarOpen(false)}
                    className={`flex items-center gap-3 px-3 py-3 rounded-lg text-sm transition-all ${
                      isActive
                        ? "bg-primary/10 text-primary font-medium"
                        : "text-ink-muted dark:text-ink-muted-dark hover:bg-surface-2 dark:hover:bg-surface-dark-2"
                    }`}
                  >
                    <Icon className="w-5 h-5 flex-shrink-0" />
                    <div>
                      <span>{item.label}</span>
                      <span className="block text-[11px] opacity-70">{item.description}</span>
                    </div>
                  </Link>
                );
              })}
            </nav>

            {/* Bottom */}
            <div className="flex-shrink-0 border-t border-border dark:border-border-dark p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-9 h-9 bg-primary/10 rounded-full flex items-center justify-center">
                  <User className="w-4 h-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{user?.name}</p>
                  <p className="text-[11px] text-ink-muted dark:text-ink-muted-dark truncate">{user?.email}</p>
                </div>
              </div>
              <button
                onClick={() => { logout(); setSidebarOpen(false); }}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Keluar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
