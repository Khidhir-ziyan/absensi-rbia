import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import api from "@/lib/api";
import { SESSION_STATUS } from "@/lib/constants";
import {
  ArrowLeft,
  Plus,
  BookOpen,
  Calendar,
  Clock,
  CheckCircle,
  Loader2,
  Settings,
  Bell,
  BellOff,
  Save,
  X,
  FileText,
  Trash2,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import LoadingSpinner from "@/components/LoadingSpinner";
import EmptyState from "@/components/EmptyState";

const dayOptions = [
  { value: "", label: "Pilih hari" },
  { value: "monday", label: "Senin" },
  { value: "tuesday", label: "Selasa" },
  { value: "wednesday", label: "Rabu" },
  { value: "thursday", label: "Kamis" },
  { value: "friday", label: "Jumat" },
  { value: "saturday", label: "Sabtu" },
  { value: "sunday", label: "Minggu" },
];

interface Session {
  id: string;
  topic: string;
  date: string;
  status: string;
}

interface TestItem {
  id: string;
  name: string;
  createdAt: string;
  gradeCount: number;
  totalStudents: number;
}

interface TestStudent {
  id: string;
  name: string;
  studentId: string | null;
  score: number | null;
  gradeId: string | null;
}

interface TestDetail {
  id: string;
  name: string;
  subjectId: string;
  createdAt: string;
  students: TestStudent[];
}

interface SubjectData {
  id: string;
  name: string;
  description: string | null;
  classId: string;
  scheduleDay: string | null;
  scheduleTime: string | null;
  reminderMinutes: number | null;
  reminderEnabled: boolean | null;
  sessions: Session[];
}

export default function MapelDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [subject, setSubject] = useState<SubjectData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showStartForm, setShowStartForm] = useState(false);
  const [topic, setTopic] = useState("");
  const [starting, setStarting] = useState(false);

  // Test scores
  const [testsList, setTestsList] = useState<TestItem[]>([]);
  const [showTestForm, setShowTestForm] = useState(false);
  const [newTestName, setNewTestName] = useState("");
  const [creatingTest, setCreatingTest] = useState(false);
  const [expandedTest, setExpandedTest] = useState<string | null>(null);
  const [testDetail, setTestDetail] = useState<TestDetail | null>(null);
  const [loadingTest, setLoadingTest] = useState(false);
  const [grades, setGrades] = useState<Record<string, number>>({});
  const [savingGrades, setSavingGrades] = useState(false);
  const [deletingTest, setDeletingTest] = useState<string | null>(null);

  // Schedule edit form
  const [showScheduleForm, setShowScheduleForm] = useState(false);
  const [editScheduleDay, setEditScheduleDay] = useState("");
  const [editScheduleTime, setEditScheduleTime] = useState("");
  const [editReminderEnabled, setEditReminderEnabled] = useState(false);
  const [editReminderMinutes, setEditReminderMinutes] = useState(10);
  const [savingSchedule, setSavingSchedule] = useState(false);

  const loadSubject = async () => {
    if (!id) return;
    try {
      const res = await api.get(`/subjects/${id}`);
      const data = res.data.data;
      setSubject(data);
      // Initialize edit form
      setEditScheduleDay(data.scheduleDay || "");
      setEditScheduleTime(data.scheduleTime || "");
      setEditReminderEnabled(data.reminderEnabled || false);
      setEditReminderMinutes(data.reminderMinutes || 10);
    } catch {
      // ignore
    }
    setLoading(false);
  };

  useEffect(() => {
    loadSubject();
  }, [id]);

  const handleStartSession = async () => {
    if (!topic.trim() || !id) return;
    setStarting(true);
    try {
      const res = await api.post("/sessions/start", {
        subjectId: id,
        topic: topic.trim(),
      });
      navigate(`/sessions/${res.data.data.id}/attendance`);
    } catch (err: any) {
      alert(err.response?.data?.message || "Gagal memulai sesi");
    } finally {
      setStarting(false);
    }
  };

  const handleSaveSchedule = async () => {
    if (!id) return;
    setSavingSchedule(true);
    try {
      await api.put(`/subjects/${id}`, {
        scheduleDay: editScheduleDay || null,
        scheduleTime: editScheduleTime || null,
        reminderEnabled: editReminderEnabled,
        reminderMinutes: editReminderMinutes,
      });
      setShowScheduleForm(false);
      loadSubject();
    } catch (err: any) {
      alert(err.response?.data?.message || "Gagal menyimpan jadwal");
    } finally {
      setSavingSchedule(false);
    }
  };

  // Test functions
  const loadTests = async () => {
    if (!id) return;
    try {
      const res = await api.get(`/subjects/${id}/tests`);
      setTestsList(res.data.data);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    if (id) loadTests();
  }, [id]);

  const handleCreateTest = async () => {
    if (!newTestName.trim() || !id) return;
    setCreatingTest(true);
    try {
      await api.post(`/subjects/${id}/tests`, { name: newTestName.trim() });
      setNewTestName("");
      setShowTestForm(false);
      loadTests();
    } catch (err: any) {
      alert(err.response?.data?.message || "Gagal membuat tes");
    } finally {
      setCreatingTest(false);
    }
  };

  const loadTestDetail = async (testId: string) => {
    if (expandedTest === testId) {
      setExpandedTest(null);
      setTestDetail(null);
      return;
    }
    setExpandedTest(testId);
    setLoadingTest(true);
    try {
      const res = await api.get(`/tests/${testId}`);
      const data = res.data.data;
      setTestDetail(data);
      const initialGrades: Record<string, number> = {};
      for (const s of data.students) {
        if (s.score !== null) {
          initialGrades[s.id] = s.score;
        }
      }
      setGrades(initialGrades);
    } catch {
      // ignore
    }
    setLoadingTest(false);
  };

  const handleSaveGrades = async () => {
    if (!expandedTest) return;
    setSavingGrades(true);
    try {
      const gradesArray = Object.entries(grades).map(([studentId, score]) => ({
        studentId,
        score,
      }));
      await api.put(`/tests/${expandedTest}/grades`, { grades: gradesArray });
      loadTests();
      alert("Nilai berhasil disimpan");
    } catch (err: any) {
      alert(err.response?.data?.message || "Gagal menyimpan nilai");
    } finally {
      setSavingGrades(false);
    }
  };

  const handleDeleteTest = async (testId: string) => {
    if (!confirm("Hapus tes ini beserta semua nilai?")) return;
    setDeletingTest(testId);
    try {
      await api.delete(`/tests/${testId}`);
      if (expandedTest === testId) {
        setExpandedTest(null);
        setTestDetail(null);
      }
      loadTests();
    } catch (err: any) {
      alert(err.response?.data?.message || "Gagal menghapus tes");
    } finally {
      setDeletingTest(null);
    }
  };

  if (loading) return <LoadingSpinner />;
  if (!subject) return <div className="p-8">Mata pelajaran tidak ditemukan</div>;

  const dayLabel = dayOptions.find((d) => d.value === subject.scheduleDay)?.label;

  return (
    <div className="max-w-content mx-auto p-6">
      {/* Back Button */}
      <Link
        to={`/classes/${subject.classId}`}
        className="inline-flex items-center gap-2 text-sm text-ink-muted dark:text-ink-muted-dark hover:text-ink dark:hover:text-ink-dark mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Kembali ke Kelas
      </Link>

      {/* Subject Header */}
      <div className="bg-surface-1 dark:bg-surface-dark-1 rounded-xl shadow-card p-5 mb-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 bg-primary/10 rounded-lg flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold">{subject.name}</h1>
              {subject.description && (
                <p className="text-sm text-ink-muted dark:text-ink-muted-dark">
                  {subject.description}
                </p>
              )}
              {/* Schedule Info */}
              {subject.scheduleDay && subject.scheduleTime && (
                <div className="flex items-center gap-3 mt-2">
                  <span className="flex items-center gap-1.5 text-sm text-primary">
                    <Calendar className="w-4 h-4" />
                    {dayLabel}, {subject.scheduleTime}
                  </span>
                  {subject.reminderEnabled ? (
                    <span className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
                      <Bell className="w-3.5 h-3.5" />
                      Pengingat {subject.reminderMinutes}mnt
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-xs text-ink-muted dark:text-ink-muted-dark">
                      <BellOff className="w-3.5 h-3.5" />
                      Pengingat off
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
          <button
            onClick={() => setShowScheduleForm(true)}
            className="flex items-center gap-2 px-3 py-2 text-sm text-ink-muted dark:text-ink-muted-dark hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
          >
            <Settings className="w-4 h-4" />
            <span className="hidden sm:inline">Atur Jadwal</span>
          </button>
        </div>
      </div>

      {/* Schedule Edit Form */}
      {showScheduleForm && (
        <div className="mb-6 bg-surface-1 dark:bg-surface-dark-1 rounded-xl shadow-card p-5">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary" />
            Atur Jadwal & Pengingat
          </h3>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1.5">Hari</label>
                <select
                  value={editScheduleDay}
                  onChange={(e) => setEditScheduleDay(e.target.value)}
                  className="w-full px-4 py-2.5 border border-border dark:border-border-dark rounded-lg bg-canvas dark:bg-canvas-dark focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  {dayOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Jam</label>
                <input
                  type="time"
                  value={editScheduleTime}
                  onChange={(e) => setEditScheduleTime(e.target.value)}
                  className="w-full px-4 py-2.5 border border-border dark:border-border-dark rounded-lg bg-canvas dark:bg-canvas-dark focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
            </div>

            <div className="p-3 bg-primary/5 rounded-lg">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={editReminderEnabled}
                  onChange={(e) => setEditReminderEnabled(e.target.checked)}
                  className="w-4 h-4 text-primary rounded focus:ring-primary"
                />
                <div>
                  <span className="text-sm font-medium flex items-center gap-1.5">
                    <Bell className="w-4 h-4" />
                    Kirim pengingat email
                  </span>
                  <span className="block text-xs text-ink-muted dark:text-ink-muted-dark">
                    {editScheduleDay && editScheduleTime
                      ? "Ingatkan sebelum jadwal mengajar"
                      : "Atur hari dan jam terlebih dahulu"}
                  </span>
                </div>
              </label>
              {editReminderEnabled && (
                <div className="mt-2 ml-7">
                  <label className="block text-xs text-ink-muted dark:text-ink-muted-dark mb-1">
                    Kirim berapa menit sebelumnya?
                  </label>
                  <select
                    value={editReminderMinutes}
                    onChange={(e) => setEditReminderMinutes(Number(e.target.value))}
                    className="px-3 py-1.5 border border-border dark:border-border-dark rounded-lg bg-canvas dark:bg-canvas-dark text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value={5}>5 menit</option>
                    <option value={10}>10 menit</option>
                    <option value={15}>15 menit</option>
                    <option value={30}>30 menit</option>
                    <option value={60}>1 jam</option>
                  </select>
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleSaveSchedule}
                disabled={savingSchedule}
                className="flex items-center gap-2 px-4 py-2.5 bg-primary text-on-primary rounded-lg hover:bg-primary-hover transition-colors text-sm font-medium disabled:opacity-50"
              >
                {savingSchedule ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Menyimpan...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Simpan
                  </>
                )}
              </button>
              <button
                onClick={() => setShowScheduleForm(false)}
                className="flex items-center gap-2 px-4 py-2.5 border border-border dark:border-border-dark rounded-lg text-sm hover:bg-surface-2 dark:hover:bg-surface-dark-2 transition-colors"
              >
                <X className="w-4 h-4" />
                Batal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-semibold">Riwayat Pertemuan</h2>
          <span className="px-2 py-0.5 bg-surface-2 dark:bg-surface-dark-2 rounded-full text-xs text-ink-muted dark:text-ink-muted-dark">
            {subject.sessions.length}
          </span>
        </div>
        <button
          onClick={() => setShowStartForm(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-primary text-on-primary rounded-lg hover:bg-primary-hover transition-colors text-sm font-medium"
        >
          <Plus className="w-4 h-4" />
          Mulai Pertemuan
        </button>
      </div>

      {/* Start Session Form */}
      {showStartForm && (
        <div className="mb-6 bg-surface-1 dark:bg-surface-dark-1 rounded-xl shadow-card p-5">
          <h3 className="font-semibold mb-4">Pertemuan Baru</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">
                Topik / Materi Hari Ini
              </label>
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                className="w-full px-4 py-2.5 border border-border dark:border-border-dark rounded-lg bg-canvas dark:bg-canvas-dark focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="Contoh: Surah Al-Fatihah ayat 1-5"
                required
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleStartSession}
                disabled={starting || !topic.trim()}
                className="flex items-center gap-2 px-4 py-2.5 bg-primary text-on-primary rounded-lg hover:bg-primary-hover transition-colors text-sm font-medium disabled:opacity-50"
              >
                {starting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Memulai...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    Mulai
                  </>
                )}
              </button>
              <button
                onClick={() => setShowStartForm(false)}
                className="flex items-center gap-2 px-4 py-2.5 border border-border dark:border-border-dark rounded-lg text-sm hover:bg-surface-2 dark:hover:bg-surface-dark-2 transition-colors"
              >
                Batal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Session List */}
      {subject.sessions.length === 0 ? (
        <EmptyState
          icon={Calendar}
          title="Belum ada pertemuan"
          description="Mulai pertemuan pertama untuk mata pelajaran ini."
          action={
            <button
              onClick={() => setShowStartForm(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-primary text-on-primary rounded-lg hover:bg-primary-hover transition-colors text-sm font-medium"
            >
              <Plus className="w-4 h-4" />
              Mulai Pertemuan
            </button>
          }
        />
      ) : (
        <div className="space-y-3">
          {subject.sessions.map((session) => {
            const isCompleted = session.status === SESSION_STATUS.COMPLETED;
            return (
              <Link
                key={session.id}
                to={`/sessions/${session.id}/attendance`}
                className="group block bg-surface-1 dark:bg-surface-dark-1 rounded-xl shadow-card hover:shadow-elevated transition-all"
              >
                <div className="flex items-center p-4">
                  <div
                    className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      isCompleted
                        ? "bg-green-100 dark:bg-green-900/30"
                        : "bg-yellow-100 dark:bg-yellow-900/30"
                    }`}
                  >
                    {isCompleted ? (
                      <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                    ) : (
                      <Clock className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                    )}
                  </div>
                  <div className="flex-1 ml-3">
                    <h3 className="font-medium group-hover:text-primary transition-colors">
                      {session.topic}
                    </h3>
                    <p className="text-sm text-ink-muted dark:text-ink-muted-dark">
                      {new Date(session.date).toLocaleDateString("id-ID", {
                        weekday: "long",
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                  <span
                    className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                      isCompleted
                        ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                        : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
                    }`}
                  >
                    {isCompleted ? "Selesai" : "Berlangsung"}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {/* ── Tes Formatif ── */}
      <div className="mt-10">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold">Tes Formatif</h2>
            <span className="px-2 py-0.5 bg-surface-2 dark:bg-surface-dark-2 rounded-full text-xs text-ink-muted dark:text-ink-muted-dark">
              {testsList.length}
            </span>
          </div>
          <button
            onClick={() => setShowTestForm(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-primary text-on-primary rounded-lg hover:bg-primary-hover transition-colors text-sm font-medium"
          >
            <Plus className="w-4 h-4" />
            Tambah Tes
          </button>
        </div>

        {/* Create Test Form */}
        {showTestForm && (
          <div className="mb-6 bg-surface-1 dark:bg-surface-dark-1 rounded-xl shadow-card p-5">
            <h3 className="font-semibold mb-4">Tes Baru</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1.5">
                  Nama Tes
                </label>
                <input
                  type="text"
                  value={newTestName}
                  onChange={(e) => setNewTestName(e.target.value)}
                  className="w-full px-4 py-2.5 border border-border dark:border-border-dark rounded-lg bg-canvas dark:bg-canvas-dark focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="Contoh: Tes Formatif 1"
                  required
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleCreateTest}
                  disabled={creatingTest || !newTestName.trim()}
                  className="flex items-center gap-2 px-4 py-2.5 bg-primary text-on-primary rounded-lg hover:bg-primary-hover transition-colors text-sm font-medium disabled:opacity-50"
                >
                  {creatingTest ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Membuat...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      Buat Tes
                    </>
                  )}
                </button>
                <button
                  onClick={() => {
                    setShowTestForm(false);
                    setNewTestName("");
                  }}
                  className="flex items-center gap-2 px-4 py-2.5 border border-border dark:border-border-dark rounded-lg text-sm hover:bg-surface-2 dark:hover:bg-surface-dark-2 transition-colors"
                >
                  Batal
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Test List */}
        {testsList.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="Belum ada tes"
            description="Tambah tes formatif untuk mencatat nilai siswa."
            action={
              <button
                onClick={() => setShowTestForm(true)}
                className="flex items-center gap-2 px-4 py-2.5 bg-primary text-on-primary rounded-lg hover:bg-primary-hover transition-colors text-sm font-medium"
              >
                <Plus className="w-4 h-4" />
                Tambah Tes
              </button>
            }
          />
        ) : (
          <div className="space-y-3">
            {testsList.map((test) => (
              <div
                key={test.id}
                className="bg-surface-1 dark:bg-surface-dark-1 rounded-xl shadow-card overflow-hidden"
              >
                {/* Test Header */}
                <button
                  onClick={() => loadTestDetail(test.id)}
                  className="w-full flex items-center justify-between p-4 hover:bg-surface-2/50 dark:hover:bg-surface-dark-2/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                      <FileText className="w-5 h-5 text-primary" />
                    </div>
                    <div className="text-left">
                      <h3 className="font-medium">{test.name}</h3>
                      <p className="text-sm text-ink-muted dark:text-ink-muted-dark">
                        {test.gradeCount}/{test.totalStudents} siswa dinilai ·{" "}
                        {new Date(test.createdAt).toLocaleDateString("id-ID", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {deletingTest === test.id ? (
                      <Loader2 className="w-4 h-4 animate-spin text-red-500" />
                    ) : (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteTest(test.id);
                        }}
                        className="p-2 text-ink-muted hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                    {expandedTest === test.id ? (
                      <ChevronUp className="w-5 h-5 text-ink-muted" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-ink-muted" />
                    )}
                  </div>
                </button>

                {/* Expanded: Grades Table */}
                {expandedTest === test.id && (
                  <div className="border-t border-border dark:border-border-dark p-4">
                    {loadingTest ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="w-5 h-5 animate-spin text-primary" />
                      </div>
                    ) : testDetail ? (
                      <div>
                        <div className="overflow-x-auto">
                          <table className="w-full">
                            <thead>
                              <tr className="border-b border-border dark:border-border-dark">
                                <th className="text-left px-3 py-2 text-sm font-medium text-ink-muted dark:text-ink-muted-dark">
                                  Siswa
                                </th>
                                <th className="text-center px-3 py-2 text-sm font-medium text-ink-muted dark:text-ink-muted-dark w-32">
                                  Nilai (0-100)
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              {testDetail.students.map((student) => (
                                <tr
                                  key={student.id}
                                  className="border-b border-border dark:border-border-dark last:border-0"
                                >
                                  <td className="px-3 py-2.5 text-sm">
                                    <p className="font-medium">
                                      {student.name}
                                    </p>
                                    {student.studentId && (
                                      <p className="text-xs text-ink-muted dark:text-ink-muted-dark">
                                        NIS: {student.studentId}
                                      </p>
                                    )}
                                  </td>
                                  <td className="px-3 py-2.5">
                                    <input
                                      type="number"
                                      min={0}
                                      max={100}
                                      value={grades[student.id] ?? ""}
                                      onChange={(e) => {
                                        const val = e.target.value;
                                        setGrades((prev) => {
                                          const next = { ...prev };
                                          if (val === "") {
                                            delete next[student.id];
                                          } else {
                                            next[student.id] = Number(val);
                                          }
                                          return next;
                                        });
                                      }}
                                      className="w-full px-3 py-1.5 text-center border border-border dark:border-border-dark rounded-lg bg-canvas dark:bg-canvas-dark text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                                      placeholder="-"
                                    />
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                        <div className="mt-4 flex justify-end">
                          <button
                            onClick={handleSaveGrades}
                            disabled={savingGrades}
                            className="flex items-center gap-2 px-4 py-2.5 bg-primary text-on-primary rounded-lg hover:bg-primary-hover transition-colors text-sm font-medium disabled:opacity-50"
                          >
                            {savingGrades ? (
                              <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Menyimpan...
                              </>
                            ) : (
                              <>
                                <Save className="w-4 h-4" />
                                Simpan Nilai
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    ) : null}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
