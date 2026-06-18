import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import api from "@/lib/api";
import {
  ArrowLeft,
  BookOpen,
  Users,
  Plus,
  Trash2,
  Save,
  Calendar,
  Bell,
  BellOff,
  X,
  ChevronRight,
  User,
} from "lucide-react";
import LoadingSpinner from "@/components/LoadingSpinner";
import EmptyState from "@/components/EmptyState";

interface Subject {
  id: string;
  name: string;
  description: string | null;
  scheduleDay: string | null;
  scheduleTime: string | null;
  reminderMinutes: number | null;
  reminderEnabled: boolean | null;
}

interface Student {
  id: string;
  name: string;
  studentId: string | null;
  parentContact: string | null;
}

export default function KelasDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);

  // Subject form
  const [showSubjectForm, setShowSubjectForm] = useState(false);
  const [subjectName, setSubjectName] = useState("");
  const [subjectDesc, setSubjectDesc] = useState("");
  const [scheduleDay, setScheduleDay] = useState("");
  const [scheduleTime, setScheduleTime] = useState("");
  const [reminderEnabled, setReminderEnabled] = useState(false);
  const [reminderMinutes, setReminderMinutes] = useState(10);
  const [savingSubject, setSavingSubject] = useState(false);

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

  // Student form
  const [showStudentForm, setShowStudentForm] = useState(false);
  const [studentName, setStudentName] = useState("");
  const [studentNis, setStudentNis] = useState("");
  const [studentContact, setStudentContact] = useState("");
  const [savingStudent, setSavingStudent] = useState(false);

  const fetchData = async () => {
    if (!id) return;
    const [subjRes, studRes] = await Promise.all([
      api.get(`/subjects?classId=${id}`),
      api.get(`/students?classId=${id}`),
    ]);
    setSubjects(subjRes.data.data);
    setStudents(studRes.data.data);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  const handleCreateSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subjectName.trim() || !id) return;
    setSavingSubject(true);
    try {
      await api.post("/subjects", {
        name: subjectName.trim(),
        description: subjectDesc.trim() || undefined,
        classId: id,
        scheduleDay: scheduleDay || undefined,
        scheduleTime: scheduleTime || undefined,
        reminderEnabled,
        reminderMinutes,
      });
      setSubjectName("");
      setSubjectDesc("");
      setScheduleDay("");
      setScheduleTime("");
      setReminderEnabled(false);
      setReminderMinutes(10);
      setShowSubjectForm(false);
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.message || "Gagal membuat mata pelajaran");
    } finally {
      setSavingSubject(false);
    }
  };

  const handleCreateStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentName.trim() || !id) return;
    setSavingStudent(true);
    try {
      await api.post("/students", {
        name: studentName.trim(),
        studentId: studentNis.trim() || undefined,
        parentContact: studentContact.trim() || undefined,
        classId: id,
      });
      setStudentName("");
      setStudentNis("");
      setStudentContact("");
      setShowStudentForm(false);
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.message || "Gagal menambah siswa");
    } finally {
      setSavingStudent(false);
    }
  };

  const handleDeleteSubject = async (subjectId: string, name: string) => {
    if (!confirm(`Hapus mata pelajaran "${name}"?`)) return;
    try {
      await api.delete(`/subjects/${subjectId}`);
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.message || "Gagal menghapus");
    }
  };

  const handleDeleteStudent = async (studentId: string, name: string) => {
    if (!confirm(`Hapus siswa "${name}"?`)) return;
    try {
      await api.delete(`/students/${studentId}`);
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.message || "Gagal menghapus");
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="max-w-content mx-auto p-6">
      {/* Back Button */}
      <Link
        to="/"
        className="inline-flex items-center gap-2 text-sm text-ink-muted dark:text-ink-muted-dark hover:text-ink dark:hover:text-ink-dark mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Kembali ke Daftar Kelas
      </Link>

      <div className="space-y-8">
        {/* Subjects Section */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-semibold">Mata Pelajaran</h2>
              <span className="px-2 py-0.5 bg-surface-2 dark:bg-surface-dark-2 rounded-full text-xs text-ink-muted dark:text-ink-muted-dark">
                {subjects.length}
              </span>
            </div>
            <button
              onClick={() => {
                setShowSubjectForm(true);
                setShowStudentForm(false);
              }}
              className="flex items-center gap-1.5 px-3 py-2 bg-primary text-on-primary rounded-lg hover:bg-primary-hover transition-colors text-sm font-medium"
            >
              <Plus className="w-4 h-4" />
              Tambah
            </button>
          </div>

          {showSubjectForm && (
            <div className="mb-4 bg-surface-1 dark:bg-surface-dark-1 rounded-xl shadow-card p-5">
              <h3 className="font-semibold mb-4">Mata Pelajaran Baru</h3>
              <form onSubmit={handleCreateSubject} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5">Nama Mata Pelajaran</label>
                  <input
                    type="text"
                    value={subjectName}
                    onChange={(e) => setSubjectName(e.target.value)}
                    className="w-full px-4 py-2.5 border border-border dark:border-border-dark rounded-lg bg-canvas dark:bg-canvas-dark focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="Contoh: Hafalan Quran"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">
                    Deskripsi <span className="text-ink-muted dark:text-ink-muted-dark font-normal">(opsional)</span>
                  </label>
                  <input
                    type="text"
                    value={subjectDesc}
                    onChange={(e) => setSubjectDesc(e.target.value)}
                    className="w-full px-4 py-2.5 border border-border dark:border-border-dark rounded-lg bg-canvas dark:bg-canvas-dark focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>

                {/* Schedule Section */}
                <div className="border-t border-border dark:border-border-dark pt-4">
                  <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-ink-muted dark:text-ink-muted-dark" />
                    Jadwal Mengajar <span className="text-ink-muted dark:text-ink-muted-dark font-normal">(opsional)</span>
                  </h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm mb-1.5">Hari</label>
                      <select
                        value={scheduleDay}
                        onChange={(e) => setScheduleDay(e.target.value)}
                        className="w-full px-4 py-2.5 border border-border dark:border-border-dark rounded-lg bg-canvas dark:bg-canvas-dark focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                      >
                        {dayOptions.map((opt) => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm mb-1.5">Jam</label>
                      <input
                        type="time"
                        value={scheduleTime}
                        onChange={(e) => setScheduleTime(e.target.value)}
                        className="w-full px-4 py-2.5 border border-border dark:border-border-dark rounded-lg bg-canvas dark:bg-canvas-dark focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                      />
                    </div>
                  </div>

                  <div className="mt-3 p-3 bg-primary/5 rounded-lg">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={reminderEnabled}
                        onChange={(e) => setReminderEnabled(e.target.checked)}
                        className="w-4 h-4 text-primary rounded focus:ring-primary"
                      />
                      <div>
                        <span className="text-sm font-medium">Kirim pengingat email</span>
                        <span className="block text-xs text-ink-muted dark:text-ink-muted-dark">
                          {scheduleDay && scheduleTime
                            ? "Ingatkan sebelum jadwal mengajar"
                            : "Atur hari dan jam terlebih dahulu"}
                        </span>
                      </div>
                    </label>
                    {reminderEnabled && (
                      <div className="mt-2 ml-7">
                        <label className="block text-xs text-ink-muted dark:text-ink-muted-dark mb-1">
                          Kirim berapa menit sebelumnya?
                        </label>
                        <select
                          value={reminderMinutes}
                          onChange={(e) => setReminderMinutes(Number(e.target.value))}
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
                </div>

                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={savingSubject || !subjectName.trim()}
                    className="flex items-center gap-2 px-4 py-2.5 bg-primary text-on-primary rounded-lg hover:bg-primary-hover transition-colors text-sm font-medium disabled:opacity-50"
                  >
                    <Save className="w-4 h-4" />
                    {savingSubject ? "Menyimpan..." : "Simpan"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowSubjectForm(false)}
                    className="flex items-center gap-2 px-4 py-2.5 border border-border dark:border-border-dark rounded-lg text-sm hover:bg-surface-2 dark:hover:bg-surface-dark-2 transition-colors"
                  >
                    <X className="w-4 h-4" />
                    Batal
                  </button>
                </div>
              </form>
            </div>
          )}

          {subjects.length === 0 ? (
            <EmptyState
              icon={BookOpen}
              title="Belum ada mata pelajaran"
              description="Tambahkan mata pelajaran untuk kelas ini."
            />
          ) : (
            <div className="space-y-2">
              {subjects.map((subject) => (
                <div
                  key={subject.id}
                  className="group bg-surface-1 dark:bg-surface-dark-1 rounded-xl shadow-card hover:shadow-elevated transition-all"
                >
                  <div className="flex items-center p-4">
                    <Link
                      to={`/subjects/${subject.id}`}
                      className="flex-1 flex items-center gap-3"
                    >
                      <div className="w-9 h-9 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                        <BookOpen className="w-5 h-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium">{subject.name}</h3>
                        {subject.description && (
                          <p className="text-sm text-ink-muted dark:text-ink-muted-dark truncate">
                            {subject.description}
                          </p>
                        )}
                        {subject.scheduleDay && subject.scheduleTime ? (
                          <p className="text-xs text-primary flex items-center gap-1 mt-0.5">
                            <Calendar className="w-3 h-3" />
                            {dayOptions.find(d => d.value === subject.scheduleDay)?.label}, {subject.scheduleTime}
                            {subject.reminderEnabled ? (
                              <span className="flex items-center gap-0.5 text-green-600 dark:text-green-400">
                                <Bell className="w-3 h-3" />
                                {subject.reminderMinutes}mnt
                              </span>
                            ) : (
                              <span className="flex items-center gap-0.5 text-ink-muted dark:text-ink-muted-dark">
                                <BellOff className="w-3 h-3" />
                              </span>
                            )}
                          </p>
                        ) : (
                          <p className="text-xs text-ink-muted dark:text-ink-muted-dark flex items-center gap-1 mt-0.5">
                            <Calendar className="w-3 h-3" />
                            Belum ada jadwal
                          </p>
                        )}
                      </div>
                      <ChevronRight className="w-5 h-5 text-ink-muted dark:text-ink-muted-dark opacity-0 group-hover:opacity-100 transition-opacity" />
                    </Link>
                    <button
                      onClick={() => handleDeleteSubject(subject.id, subject.name)}
                      className="p-2 rounded-lg text-ink-muted dark:text-ink-muted-dark hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors ml-1"
                      title="Hapus"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Students Section */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-semibold">Siswa</h2>
              <span className="px-2 py-0.5 bg-surface-2 dark:bg-surface-dark-2 rounded-full text-xs text-ink-muted dark:text-ink-muted-dark">
                {students.length}
              </span>
            </div>
            <button
              onClick={() => {
                setShowStudentForm(true);
                setShowSubjectForm(false);
              }}
              className="flex items-center gap-1.5 px-3 py-2 bg-primary text-on-primary rounded-lg hover:bg-primary-hover transition-colors text-sm font-medium"
            >
              <Plus className="w-4 h-4" />
              Tambah
            </button>
          </div>

          {showStudentForm && (
            <div className="mb-4 bg-surface-1 dark:bg-surface-dark-1 rounded-xl shadow-card p-5">
              <h3 className="font-semibold mb-4">Tambah Siswa</h3>
              <form onSubmit={handleCreateStudent} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5">Nama Lengkap</label>
                  <input
                    type="text"
                    value={studentName}
                    onChange={(e) => setStudentName(e.target.value)}
                    className="w-full px-4 py-2.5 border border-border dark:border-border-dark rounded-lg bg-canvas dark:bg-canvas-dark focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="Contoh: Ahmad Fauzi"
                    required
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1.5">
                      NIS <span className="text-ink-muted dark:text-ink-muted-dark font-normal">(opsional)</span>
                    </label>
                    <input
                      type="text"
                      value={studentNis}
                      onChange={(e) => setStudentNis(e.target.value)}
                      className="w-full px-4 py-2.5 border border-border dark:border-border-dark rounded-lg bg-canvas dark:bg-canvas-dark focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                      placeholder="Nomor Induk Siswa"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1.5">
                      Kontak Ortu <span className="text-ink-muted dark:text-ink-muted-dark font-normal">(opsional)</span>
                    </label>
                    <input
                      type="text"
                      value={studentContact}
                      onChange={(e) => setStudentContact(e.target.value)}
                      className="w-full px-4 py-2.5 border border-border dark:border-border-dark rounded-lg bg-canvas dark:bg-canvas-dark focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                      placeholder="No. HP orang tua"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={savingStudent || !studentName.trim()}
                    className="flex items-center gap-2 px-4 py-2.5 bg-primary text-on-primary rounded-lg hover:bg-primary-hover transition-colors text-sm font-medium disabled:opacity-50"
                  >
                    <Save className="w-4 h-4" />
                    {savingStudent ? "Menyimpan..." : "Simpan"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowStudentForm(false)}
                    className="flex items-center gap-2 px-4 py-2.5 border border-border dark:border-border-dark rounded-lg text-sm hover:bg-surface-2 dark:hover:bg-surface-dark-2 transition-colors"
                  >
                    <X className="w-4 h-4" />
                    Batal
                  </button>
                </div>
              </form>
            </div>
          )}

          {students.length === 0 ? (
            <EmptyState
              icon={Users}
              title="Belum ada siswa"
              description="Tambahkan siswa ke kelas ini."
            />
          ) : (
            <div className="bg-surface-1 dark:bg-surface-dark-1 rounded-xl shadow-card overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border dark:border-border-dark">
                    <th className="text-left px-5 py-3 text-sm font-medium">Nama</th>
                    <th className="text-left px-5 py-3 text-sm font-medium">NIS</th>
                    <th className="text-left px-5 py-3 text-sm font-medium hidden sm:table-cell">Kontak</th>
                    <th className="w-12"></th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((student) => (
                    <tr
                      key={student.id}
                      className="border-b border-border dark:border-border-dark last:border-0 hover:bg-surface-2/50 dark:hover:bg-surface-dark-2/50 transition-colors"
                    >
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                            <User className="w-4 h-4 text-primary" />
                          </div>
                          <span className="font-medium">{student.name}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-sm text-ink-muted dark:text-ink-muted-dark">
                        {student.studentId || "-"}
                      </td>
                      <td className="px-5 py-3 text-sm text-ink-muted dark:text-ink-muted-dark hidden sm:table-cell">
                        {student.parentContact || "-"}
                      </td>
                      <td className="px-3 py-3">
                        <button
                          onClick={() => handleDeleteStudent(student.id, student.name)}
                          className="p-2 rounded-lg text-ink-muted dark:text-ink-muted-dark hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                          title="Hapus"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
