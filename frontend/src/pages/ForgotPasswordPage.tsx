import { useState } from "react";
import { Link } from "react-router-dom";
import api from "@/lib/api";
import { useTheme } from "@/context/ThemeContext";
import { GraduationCap, Mail, Loader2, ArrowLeft, Sun, Moon, CheckCircle } from "lucide-react";

export default function ForgotPasswordPage() {
  const { theme, toggleTheme } = useTheme();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await api.post("/auth/forgot-password", { email });
      setSent(true);
    } catch (err: any) {
      setError(err.response?.data?.message || "Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-canvas dark:bg-canvas-dark p-4">
      <div className="w-full max-w-sm">
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <Link
            to="/login"
            className="flex items-center gap-1.5 text-sm text-ink-muted dark:text-ink-muted-dark hover:text-ink dark:hover:text-ink-dark transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Kembali ke Login
          </Link>
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg text-ink-muted dark:text-ink-muted-dark hover:bg-surface-2 dark:hover:bg-surface-dark-2 transition-colors"
          >
            {theme === "light" ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
          </button>
        </div>

        {/* Card */}
        <div className="bg-surface-1 dark:bg-surface-dark-1 rounded-xl shadow-card p-8">
          <div className="flex flex-col items-center mb-8">
            <div className="w-14 h-14 bg-primary rounded-xl flex items-center justify-center mb-4">
              <GraduationCap className="w-8 h-8 text-on-primary" />
            </div>
            <h1 className="text-2xl font-bold">Lupa Password?</h1>
            <p className="text-sm text-ink-muted dark:text-ink-muted-dark mt-1 text-center">
              Masukkan email Anda dan kami akan mengirimkan link untuk reset password.
            </p>
          </div>

          {sent ? (
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
              </div>
              <h2 className="font-semibold mb-2">Email Terkirim!</h2>
              <p className="text-sm text-ink-muted dark:text-ink-muted-dark mb-6">
                Jika <strong>{email}</strong> terdaftar, Anda akan menerima email dengan link reset password. Periksa kotak masuk (inbox) dan folder spam Anda.
              </p>
              <Link
                to="/login"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-on-primary rounded-lg hover:bg-primary-hover transition-colors text-sm font-medium"
              >
                Kembali ke Login
              </Link>
            </div>
          ) : (
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
                  placeholder="nama@email.com"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-2.5 bg-primary text-on-primary rounded-lg hover:bg-primary-hover transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Mengirim...
                  </>
                ) : (
                  "Kirim Link Reset"
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
