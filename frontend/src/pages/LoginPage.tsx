import { useState, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { GraduationCap, Mail, Lock, Loader2, Sun, Moon } from "lucide-react";
import Turnstile from "@/components/Turnstile";

const TURNSTILE_SITE_KEY = "0x4AAAAAADnGYXCUZ9EcUGQT";

export default function LoginPage() {
  const { login } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState("");

  const handleTurnstileVerify = useCallback((token: string) => {
    setTurnstileToken(token);
  }, []);

  const handleTurnstileError = useCallback(() => {
    setTurnstileToken("");
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!turnstileToken) {
      setError("Mohon selesaikan verifikasi terlebih dahulu");
      return;
    }

    setLoading(true);
    try {
      await login(email, password, turnstileToken);
      navigate("/");
    } catch (err: any) {
      setError(err.response?.data?.message || "Login gagal");
      setTurnstileToken("");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-canvas dark:bg-canvas-dark p-4">
      <div className="w-full max-w-sm">
        {/* Theme Toggle */}
        <div className="flex justify-end mb-4">
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg text-ink-muted dark:text-ink-muted-dark hover:bg-surface-2 dark:hover:bg-surface-dark-2 transition-colors"
          >
            {theme === "light" ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
          </button>
        </div>

        {/* Login Card */}
        <div className="bg-surface-1 dark:bg-surface-dark-1 rounded-xl shadow-card p-8">
          {/* Logo */}
          <div className="flex flex-col items-center mb-8">
            <div className="w-14 h-14 bg-primary rounded-xl flex items-center justify-center mb-4">
              <GraduationCap className="w-8 h-8 text-on-primary" />
            </div>
            <h1 className="text-2xl font-bold">Absensi RBIA</h1>
            <p className="text-sm text-ink-muted dark:text-ink-muted-dark mt-1">
              Sistem Absensi Kelas
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="px-4 py-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400 text-sm">
                {error}
              </div>
            )}

            <div>
              <label className="flex items-center gap-2 text-sm font-medium mb-1.5">
                <Mail className="w-4 h-4 text-ink-muted dark:text-ink-muted-dark" />
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2.5 border border-border dark:border-border-dark rounded-lg bg-canvas dark:bg-canvas-dark focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-colors"
                placeholder="guru@rbia.com"
                required
              />
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm font-medium mb-1.5">
                <Lock className="w-4 h-4 text-ink-muted dark:text-ink-muted-dark" />
                <span className="flex-1">Password</span>
                <Link
                  to="/forgot-password"
                  className="text-xs text-primary hover:text-primary-hover transition-colors"
                >
                  Lupa password?
                </Link>
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2.5 border border-border dark:border-border-dark rounded-lg bg-canvas dark:bg-canvas-dark focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-colors"
                placeholder="••••••••"
                required
              />
            </div>

            {/* Turnstile CAPTCHA */}
            <Turnstile
              siteKey={TURNSTILE_SITE_KEY}
              onVerify={handleTurnstileVerify}
              onError={handleTurnstileError}
            />

            <button
              type="submit"
              disabled={loading || !turnstileToken}
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-primary text-on-primary rounded-lg hover:bg-primary-hover transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Masuk...
                </>
              ) : (
                "Masuk"
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-ink-muted dark:text-ink-muted-dark">
            Belum punya akun?{" "}
            <Link
              to="/register"
              className="text-primary hover:text-primary-hover font-medium transition-colors"
            >
              Daftar di sini
            </Link>
          </p>
        </div>

        <p className="text-center text-xs text-ink-muted dark:text-ink-muted-dark mt-6">
          © 2026 Absensi RBIA
        </p>
      </div>
    </div>
  );
}
