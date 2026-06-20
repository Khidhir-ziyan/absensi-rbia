import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "@/lib/api";
import {
  ArrowLeft,
  Download,
  BarChart3,
  BookOpen,
  Users,
  FileText,
  Loader2,
} from "lucide-react";
import LoadingSpinner from "@/components/LoadingSpinner";
import EmptyState from "@/components/EmptyState";

interface StudentSummary {
  studentId: string;
  studentName: string;
  present: number;
  sick: number;
  excused: number;
  absent: number;
  totalSessions: number;
}

interface TestStudentScore {
  studentId: string;
  studentName: string;
  score: number | null;
}

interface TestSummary {
  testId: string;
  testName: string;
  students: TestStudentScore[];
}

interface SubjectSummary {
  subjectId: string;
  subjectName: string;
  totalSessions: number;
  students: StudentSummary[];
  tests?: TestSummary[];
}

interface ClassSummary {
  classId: string;
  className: string;
  subjects: SubjectSummary[];
}

export default function RekapPage() {
  const [data, setData] = useState<ClassSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/summary").then((res) => {
      setData(res.data.data);
      setLoading(false);
    });
  }, []);

  const [exporting, setExporting] = useState(false);

  const handleExportPDF = async () => {
    setExporting(true);
    try {
      const token = localStorage.getItem("token");
      const apiBase = import.meta.env.VITE_API_URL || "/api/v1";
      const res = await fetch(`${apiBase}/summary/export-pdf`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        // Try to parse error as JSON, fallback to status text
        let errorMsg = "Gagal export PDF";
        try {
          const error = await res.json();
          errorMsg = error.message || errorMsg;
        } catch {
          errorMsg = res.statusText || errorMsg;
        }
        throw new Error(errorMsg);
      }

      // Ensure we get the raw binary data
      const arrayBuffer = await res.arrayBuffer();
      const blob = new Blob([arrayBuffer], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "laporan-absensi.pdf";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err: any) {
      alert(err.message || "Gagal export PDF");
    } finally {
      setExporting(false);
    }
  };

  if (loading) return <LoadingSpinner text="Memuat rekap..." />;

  return (
    <div className="max-w-content mx-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Rekap Absensi</h1>
          <p className="text-sm text-ink-muted dark:text-ink-muted-dark mt-1">
            Ringkasan kehadiran semua kelas
          </p>
        </div>
        {data.length > 0 && (
          <button
            onClick={handleExportPDF}
            disabled={exporting}
            className="flex items-center gap-2 px-4 py-2.5 bg-primary text-on-primary rounded-lg hover:bg-primary-hover transition-colors text-sm font-medium disabled:opacity-50"
          >
            {exporting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Membuat PDF...
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                Export PDF
              </>
            )}
          </button>
        )}
      </div>

      {data.length === 0 ? (
        <EmptyState
          icon={BarChart3}
          title="Belum ada data absensi"
          description="Data akan muncul setelah Anda menyelesaikan pertemuan."
        />
      ) : (
        <div className="space-y-8">
          {data.map((cls) => (
            <section key={cls.classId}>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Users className="w-4 h-4 text-primary" />
                </div>
                <h2 className="text-lg font-semibold">{cls.className}</h2>
              </div>

              {cls.subjects.length === 0 ? (
                <p className="text-sm text-ink-muted dark:text-ink-muted-dark pl-10">
                  Belum ada mata pelajaran
                </p>
              ) : (
                <div className="space-y-4 pl-2">
                  {cls.subjects.map((subject) => (
                    <div
                      key={subject.subjectId}
                      className="bg-surface-1 dark:bg-surface-dark-1 rounded-xl shadow-card overflow-hidden"
                    >
                      <div className="px-5 py-4 border-b border-border dark:border-border-dark flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <BookOpen className="w-4 h-4 text-primary" />
                          <div>
                            <h3 className="font-medium">
                              {subject.subjectName}
                            </h3>
                            <p className="text-xs text-ink-muted dark:text-ink-muted-dark">
                              {subject.totalSessions} pertemuan selesai
                            </p>
                          </div>
                        </div>
                      </div>

                      {subject.students.length === 0 ? (
                        <p className="px-5 py-6 text-center text-sm text-ink-muted dark:text-ink-muted-dark">
                          Belum ada siswa
                        </p>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="w-full">
                            <thead>
                              <tr className="border-b border-border dark:border-border-dark text-sm">
                                <th className="text-left px-5 py-3 font-medium">
                                  Nama
                                </th>
                                <th className="text-center px-3 py-3 font-medium text-green-600">
                                  Hadir
                                </th>
                                <th className="text-center px-3 py-3 font-medium text-yellow-600">
                                  Sakit
                                </th>
                                <th className="text-center px-3 py-3 font-medium text-blue-600">
                                  Izin
                                </th>
                                <th className="text-center px-3 py-3 font-medium text-red-600">
                                  Alpa
                                </th>
                                <th className="text-center px-3 py-3 font-medium">
                                  %
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              {subject.students.map((student) => {
                                const pct =
                                  student.totalSessions > 0
                                    ? Math.round(
                                        (student.present /
                                          student.totalSessions) *
                                          100
                                      )
                                    : 0;
                                return (
                                  <tr
                                    key={student.studentId}
                                    className="border-b border-border dark:border-border-dark last:border-0 hover:bg-surface-2/50 dark:hover:bg-surface-dark-2/50 transition-colors"
                                  >
                                    <td className="px-5 py-3 text-sm font-medium">
                                      {student.studentName}
                                    </td>
                                    <td className="text-center px-3 py-3 text-sm text-green-600 font-medium">
                                      {student.present}
                                    </td>
                                    <td className="text-center px-3 py-3 text-sm text-yellow-600">
                                      {student.sick}
                                    </td>
                                    <td className="text-center px-3 py-3 text-sm text-blue-600">
                                      {student.excused}
                                    </td>
                                    <td className="text-center px-3 py-3 text-sm text-red-600">
                                      {student.absent}
                                    </td>
                                    <td className="text-center px-3 py-3">
                                      <span
                                        className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                                          pct >= 80
                                            ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                                            : pct >= 60
                                            ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
                                            : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                                        }`}
                                      >
                                        {pct}%
                                      </span>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      )}

                      {/* Test Scores Table */}
                      {subject.tests && subject.tests.length > 0 && (
                        <div className="border-t border-border dark:border-border-dark">
                          <div className="px-5 py-3 bg-surface-2/50 dark:bg-surface-dark-2/50">
                            <h4 className="text-sm font-semibold flex items-center gap-2">
                              <FileText className="w-4 h-4 text-primary" />
                              Nilai Tes Formatif
                            </h4>
                          </div>
                          <div className="overflow-x-auto">
                            <table className="w-full">
                              <thead>
                                <tr className="border-b border-border dark:border-border-dark text-sm">
                                  <th className="text-left px-5 py-3 font-medium">
                                    Nama
                                  </th>
                                  {subject.tests.map((test) => (
                                    <th
                                      key={test.testId}
                                      className="text-center px-3 py-3 font-medium"
                                    >
                                      {test.testName}
                                    </th>
                                  ))}
                                  <th className="text-center px-3 py-3 font-bold">
                                    Rata-rata
                                  </th>
                                </tr>
                              </thead>
                              <tbody>
                                {subject.students.map((student) => {
                                  // Calculate student average
                                  const studentScores = subject.tests!
                                    .map((test) =>
                                      test.students.find(
                                        (s) => s.studentId === student.studentId
                                      )?.score
                                    )
                                    .filter((s): s is number => s != null);
                                  const studentAvg =
                                    studentScores.length > 0
                                      ? Math.round(
                                          studentScores.reduce((a, b) => a + b, 0) /
                                            studentScores.length
                                        )
                                      : null;

                                  return (
                                    <tr
                                      key={student.studentId}
                                      className="border-b border-border dark:border-border-dark last:border-0 hover:bg-surface-2/50 dark:hover:bg-surface-dark-2/50 transition-colors"
                                    >
                                      <td className="px-5 py-3 text-sm font-medium">
                                        {student.studentName}
                                      </td>
                                      {subject.tests!.map((test) => {
                                        const score = test.students.find(
                                          (s) => s.studentId === student.studentId
                                        )?.score;
                                        return (
                                          <td
                                            key={test.testId}
                                            className="text-center px-3 py-3 text-sm"
                                          >
                                            {score != null ? (
                                              <span
                                                className={`font-medium ${
                                                  score >= 80
                                                    ? "text-green-600 dark:text-green-400"
                                                    : score >= 60
                                                    ? "text-yellow-600 dark:text-yellow-400"
                                                    : "text-red-600 dark:text-red-400"
                                                }`}
                                              >
                                                {score}
                                              </span>
                                            ) : (
                                              <span className="text-ink-muted dark:text-ink-muted-dark">
                                                -
                                              </span>
                                            )}
                                          </td>
                                        );
                                      })}
                                      <td className="text-center px-3 py-3">
                                        {studentAvg != null ? (
                                          <span
                                            className={`inline-flex px-2 py-0.5 rounded-full text-xs font-bold ${
                                              studentAvg >= 80
                                                ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                                                : studentAvg >= 60
                                                ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
                                                : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                                            }`}
                                          >
                                            {studentAvg}
                                          </span>
                                        ) : (
                                          <span className="text-ink-muted dark:text-ink-muted-dark text-sm">
                                            -
                                          </span>
                                        )}
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                          {/* Averages */}
                          <div className="px-5 py-3 border-t border-border dark:border-border-dark">
                            <div className="flex flex-wrap gap-4">
                              {subject.tests.map((test) => {
                                const scores = test.students.filter(
                                  (s) => s.score != null
                                );
                                const avg =
                                  scores.length > 0
                                    ? Math.round(
                                        scores.reduce(
                                          (sum, s) => sum + (s.score || 0),
                                          0
                                        ) / scores.length
                                      )
                                    : 0;
                                return (
                                  <p
                                    key={test.testId}
                                    className="text-xs text-ink-muted dark:text-ink-muted-dark"
                                  >
                                    {test.testName}: rata-rata{" "}
                                    <span className="font-medium">{avg}</span> (
                                    {scores.length} siswa)
                                  </p>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
