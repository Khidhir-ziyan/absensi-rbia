import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import Layout from "@/components/Layout";
import LoadingSpinner from "@/components/LoadingSpinner";
import LoginPage from "@/pages/LoginPage";
import RegisterPage from "@/pages/RegisterPage";
import ForgotPasswordPage from "@/pages/ForgotPasswordPage";
import ResetPasswordPage from "@/pages/ResetPasswordPage";
import KelasListPage from "@/pages/KelasListPage";
import KelasDetailPage from "@/pages/KelasDetailPage";
import MapelDetailPage from "@/pages/MapelDetailPage";
import AbsensiPage from "@/pages/AbsensiPage";
import RekapPage from "@/pages/RekapPage";
import JadwalPage from "@/pages/JadwalPage";
import ProfilePage from "@/pages/ProfilePage";
import PanduanPage from "@/pages/PanduanPage";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <LoadingSpinner />;
  if (!user) return <Navigate to="/login" replace />;
  return <Layout>{children}</Layout>;
}

export default function App() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />

      {/* Protected routes */}
      <Route path="/" element={<ProtectedRoute><KelasListPage /></ProtectedRoute>} />
      <Route path="/classes/:id" element={<ProtectedRoute><KelasDetailPage /></ProtectedRoute>} />
      <Route path="/subjects/:id" element={<ProtectedRoute><MapelDetailPage /></ProtectedRoute>} />
      <Route path="/sessions/:id/attendance" element={<ProtectedRoute><AbsensiPage /></ProtectedRoute>} />
      <Route path="/rekap" element={<ProtectedRoute><RekapPage /></ProtectedRoute>} />
      <Route path="/jadwal" element={<ProtectedRoute><JadwalPage /></ProtectedRoute>} />
      <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
      <Route path="/panduan" element={<ProtectedRoute><PanduanPage /></ProtectedRoute>} />
    </Routes>
  );
}
