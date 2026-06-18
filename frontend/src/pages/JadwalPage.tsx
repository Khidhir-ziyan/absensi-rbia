import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "@/lib/api";
import {
  Calendar,
  Clock,
  Bell,
  BellOff,
  ChevronRight,
  BookOpen,
  GraduationCap,
} from "lucide-react";
import LoadingSpinner from "@/components/LoadingSpinner";
import EmptyState from "@/components/EmptyState";

const DAY_LABELS: Record<string, string> = {
  monday: "Senin",
  tuesday: "Selasa",
  wednesday: "Rabu",
  thursday: "Kamis",
  friday: "Jumat",
  saturday: "Sabtu",
  sunday: "Minggu",
};

const DAY_ORDER = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];

interface ScheduledSubject {
  id: string;
  name: string;
  scheduleDay: string;
  scheduleTime: string;
  reminderMinutes: number;
  reminderEnabled: boolean;
}

interface ScheduleClass {
  classId: string;
  className: string;
  subjects: ScheduledSubject[];
}

export default function JadwalPage() {
  const [data, setData] = useState<ScheduleClass[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/schedules").then((res) => {
      setData(res.data.data);
      setLoading(false);
    });
  }, []);

  // Group subjects by day
  const byDay: Record<string, Array<{ subject: ScheduledSubject; className: string }>> = {};
  for (const cls of data) {
    for (const subject of cls.subjects) {
      const day = subject.scheduleDay;
      if (!byDay[day]) byDay[day] = [];
      byDay[day].push({ subject, className: cls.className });
    }
  }

  // Sort each day by time
  for (const day of Object.keys(byDay)) {
    byDay[day].sort((a, b) => a.subject.scheduleTime.localeCompare(b.subject.scheduleTime));
  }

  const today = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"][
    new Date().getDay()
  ];

  if (loading) return <LoadingSpinner text="Memuat jadwal..." />;

  const hasSchedules = Object.keys(byDay).length > 0;

  return (
    <div className="max-w-3xl mx-auto p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Jadwal Mengajar</h1>
        <p className="text-sm text-ink-muted dark:text-ink-muted-dark mt-1">
          Atur jadwal dan dapatkan pengingat sebelum mengajar
        </p>
      </div>

      {!hasSchedules ? (
        <EmptyState
          icon={Calendar}
          title="Belum ada jadwal"
          description="Atur jadwal di setiap mata pelajaran untuk mendapatkan pengingat otomatis."
          action={
            <Link
              to="/"
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary text-on-primary rounded-lg hover:bg-primary-hover transition-colors text-sm font-medium"
            >
              <GraduationCap className="w-4 h-4" />
              Buka Kelas
            </Link>
          }
        />
      ) : (
        <div className="space-y-6">
          {DAY_ORDER.map((day) => {
            const items = byDay[day];
            if (!items) return null;
            const isToday = day === today;

            return (
              <section key={day}>
                <div className="flex items-center gap-2 mb-3">
                  <h2
                    className={`text-lg font-semibold ${
                      isToday ? "text-primary" : ""
                    }`}
                  >
                    {DAY_LABELS[day]}
                  </h2>
                  {isToday && (
                    <span className="px-2 py-0.5 bg-primary/10 text-primary text-xs rounded-full font-medium">
                      Hari ini
                    </span>
                  )}
                </div>
                <div className="space-y-2">
                  {items.map(({ subject, className }) => (
                    <div
                      key={subject.id}
                      className={`bg-surface-1 dark:bg-surface-dark-1 rounded-xl shadow-card p-4 ${
                        isToday ? "ring-1 ring-primary/20" : ""
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                              isToday
                                ? "bg-primary/10"
                                : "bg-surface-2 dark:bg-surface-dark-2"
                            }`}
                          >
                            <Clock
                              className={`w-5 h-5 ${
                                isToday
                                  ? "text-primary"
                                  : "text-ink-muted dark:text-ink-muted-dark"
                              }`}
                            />
                          </div>
                          <div>
                            <p className="font-medium">{subject.name}</p>
                            <p className="text-sm text-ink-muted dark:text-ink-muted-dark">
                              {className} · {subject.scheduleTime}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {subject.reminderEnabled ? (
                            <span className="flex items-center gap-1 px-2 py-1 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 text-xs rounded-full">
                              <Bell className="w-3 h-3" />
                              {subject.reminderMinutes}mnt
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 px-2 py-1 bg-surface-2 dark:bg-surface-dark-2 text-ink-muted dark:text-ink-muted-dark text-xs rounded-full">
                              <BellOff className="w-3 h-3" />
                              Off
                            </span>
                          )}
                          <Link
                            to={`/subjects/${subject.id}`}
                            className="p-2 rounded-lg text-ink-muted dark:text-ink-muted-dark hover:text-primary hover:bg-primary/10 transition-colors"
                          >
                            <ChevronRight className="w-4 h-4" />
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      )}

      {/* Info Card */}
      <div className="mt-8 bg-primary/5 border border-primary/20 rounded-xl p-5">
        <h3 className="font-semibold text-primary mb-2 flex items-center gap-2">
          <Bell className="w-4 h-4" />
          Tentang Pengingat
        </h3>
        <p className="text-sm text-ink-muted dark:text-ink-muted-dark leading-relaxed">
          Pengingat dikirim ke email Anda sebelum jadwal mengajar dimulai. Anda
          bisa mengatur berapa menit sebelumnya (5–60 menit) di pengaturan mata
          pelajaran. Pastikan email Anda valid di halaman Profil.
        </p>
      </div>
    </div>
  );
}
