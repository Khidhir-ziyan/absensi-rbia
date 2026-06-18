import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "@/lib/api";
import {
  ATTENDANCE_STATUS,
  ATTENDANCE_LABELS,
  AttendanceStatus,
} from "@/lib/constants";
import {
  ArrowLeft,
  Save,
  CheckCircle,
  AlertCircle,
  User,
  Loader2,
} from "lucide-react";
import LoadingSpinner from "@/components/LoadingSpinner";

interface StudentAttendance {
  id: string;
  name: string;
  studentId: string | null;
  attendanceStatus: AttendanceStatus | null;
}

interface SessionData {
  id: string;
  topic: string;
  date: string;
  status: string;
  subject: { id: string; name: string; classId: string };
  students: StudentAttendance[];
}

const statusColors: Record<AttendanceStatus, string> = {
  PRESENT: "bg-green-500 text-white",
  SICK: "bg-yellow-500 text-white",
  EXCUSED: "bg-blue-500 text-white",
  ABSENT: "bg-red-500 text-white",
};

const statusIcons: Record<AttendanceStatus, string> = {
  PRESENT: "✓",
  SICK: "🤒",
  EXCUSED: "📋",
  ABSENT: "✗",
};

export default function AbsensiPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [session, setSession] = useState<SessionData | null>(null);
  const [attendance, setAttendance] = useState<
    Record<string, AttendanceStatus>
  >({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [finishing, setFinishing] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!id) return;
    api.get(`/sessions/${id}`).then((res) => {
      const data = res.data.data;
      setSession(data);
      const initial: Record<string, AttendanceStatus> = {};
      for (const student of data.students) {
        if (student.attendanceStatus) {
          initial[student.id] = student.attendanceStatus;
        }
      }
      setAttendance(initial);
      setLoading(false);
    });
  }, [id]);

  const setStatus = (studentId: string, status: AttendanceStatus) => {
    setAttendance((prev) => ({ ...prev, [studentId]: status }));
    setSaved(false);
  };

  const handleSave = async () => {
    if (!id) return;
    setSaving(true);
    try {
      const records = Object.entries(attendance).map(
        ([studentId, status]) => ({ studentId, status })
      );
      await api.put(`/sessions/${id}/attendance`, { records });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err: any) {
      alert(err.response?.data?.message || "Gagal menyimpan absensi");
    } finally {
      setSaving(false);
    }
  };

  const handleFinish = async () => {
    if (!id) return;
    const unfilled =
      session?.students.filter((s) => !attendance[s.id]) || [];
    if (unfilled.length > 0) {
      const names = unfilled.map((s) => s.name).join(", ");
      if (
        !confirm(
          `Siswa berikut belum diisi: ${names}\n\nMereka akan otomatis ditandai ALPA. Lanjutkan?`
        )
      )
        return;
    }

    setFinishing(true);
    try {
      const records = Object.entries(attendance).map(
        ([studentId, status]) => ({ studentId, status })
      );
      await api.put(`/sessions/${id}/attendance`, { records });
      await api.put(`/sessions/${id}/finish`);
      navigate(-1);
    } catch (err: any) {
      alert(err.response?.data?.message || "Gagal menyelesaikan sesi");
    } finally {
      setFinishing(false);
    }
  };

  if (loading) return <LoadingSpinner />;
  if (!session) return <div className="p-8">Sesi tidak ditemukan</div>;

  const filledCount = Object.keys(attendance).length;
  const totalCount = session.students.length;
  const progress = totalCount > 0 ? (filledCount / totalCount) * 100 : 0;

  return (
    <div className="max-w-content mx-auto p-6">
      {/* Back Button */}
      <button
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-2 text-sm text-ink-muted dark:text-ink-muted-dark hover:text-ink dark:hover:text-ink-dark mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Kembali
      </button>

      {/* Session Header */}
      <div className="bg-surface-1 dark:bg-surface-dark-1 rounded-xl shadow-card p-5 mb-6">
        <h1 className="text-xl font-bold mb-1">{session.topic}</h1>
        <p className="text-sm text-ink-muted dark:text-ink-muted-dark">
          {session.subject.name} ·{" "}
          {new Date(session.date).toLocaleDateString("id-ID", {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric",
          })}
        </p>
      </div>

      {/* Progress & Actions */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="flex-1 w-32 h-2 bg-surface-2 dark:bg-surface-dark-2 rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="text-sm text-ink-muted dark:text-ink-muted-dark">
            {filledCount}/{totalCount}
          </span>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2.5 border border-border dark:border-border-dark rounded-lg text-sm hover:bg-surface-2 dark:hover:bg-surface-dark-2 transition-colors disabled:opacity-50"
          >
            {saved ? (
              <>
                <CheckCircle className="w-4 h-4 text-green-500" />
                Tersimpan
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                {saving ? "Menyimpan..." : "Simpan"}
              </>
            )}
          </button>
          <button
            onClick={handleFinish}
            disabled={finishing}
            className="flex items-center gap-2 px-4 py-2.5 bg-primary text-on-primary rounded-lg hover:bg-primary-hover transition-colors text-sm font-medium disabled:opacity-50"
          >
            {finishing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Menyelesaikan...
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4" />
                Selesai
              </>
            )}
          </button>
        </div>
      </div>

      {/* Student List */}
      <div className="space-y-2">
        {session.students.map((student) => {
          const status = attendance[student.id];
          return (
            <div
              key={student.id}
              className={`bg-surface-1 dark:bg-surface-dark-1 rounded-xl shadow-card p-4 transition-all ${
                status ? "ring-1 ring-primary/20" : ""
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${
                      status
                        ? statusColors[status].replace("text-white", "") + "/20"
                        : "bg-surface-2 dark:bg-surface-dark-2"
                    }`}
                  >
                    <User
                      className={`w-5 h-5 ${
                        status
                          ? status === ATTENDANCE_STATUS.PRESENT
                            ? "text-green-500"
                            : status === ATTENDANCE_STATUS.SICK
                            ? "text-yellow-500"
                            : status === ATTENDANCE_STATUS.EXCUSED
                            ? "text-blue-500"
                            : "text-red-500"
                          : "text-ink-muted dark:text-ink-muted-dark"
                      }`}
                    />
                  </div>
                  <div>
                    <p className="font-medium">{student.name}</p>
                    {student.studentId && (
                      <p className="text-xs text-ink-muted dark:text-ink-muted-dark">
                        NIS: {student.studentId}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex gap-1.5">
                  {(
                    Object.entries(ATTENDANCE_LABELS) as [
                      AttendanceStatus,
                      string
                    ][]
                  ).map(([statusKey, label]) => (
                    <button
                      key={statusKey}
                      onClick={() => setStatus(student.id, statusKey)}
                      className={`px-3 py-2 text-xs rounded-lg font-medium transition-all ${
                        status === statusKey
                          ? statusColors[statusKey] + " shadow-sm"
                          : "bg-surface-2 dark:bg-surface-dark-2 hover:bg-border dark:hover:bg-border-dark"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Unfilled Warning */}
      {filledCount < totalCount && (
        <div className="mt-4 flex items-center gap-2 px-4 py-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg text-yellow-700 dark:text-yellow-400 text-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {totalCount - filledCount} siswa belum diisi. Mereka akan otomatis
          ditandai ALPA saat diselesaikan.
        </div>
      )}
    </div>
  );
}
