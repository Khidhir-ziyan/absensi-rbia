import {
  GraduationCap,
  BookOpen,
  Users,
  ClipboardList,
  FileBarChart,
  ChevronRight,
} from "lucide-react";

const steps = [
  {
    icon: GraduationCap,
    title: "1. Buat Kelas",
    description:
      'Mulai dengan membuat kelas baru. Klik tombol "+ Tambah Kelas" di halaman utama. Isi nama kelas (misal: "Kelas 4A") dan deskripsi opsional.',
    tips: "Satu guru bisa memiliki banyak kelas.",
  },
  {
    icon: BookOpen,
    title: "2. Tambah Mata Pelajaran",
    description:
      "Masuk ke detail kelas, lalu tambahkan mata pelajaran. Setiap mata pelajaran milik satu kelas saja.",
    tips: 'Contoh: "Hafalan Quran", "Matematika", "Bahasa Arab".',
  },
  {
    icon: Users,
    title: "3. Tambah Siswa",
    description:
      "Di halaman yang sama, tambahkan siswa ke kelas. Siswa otomatis mengikuti semua mata pelajaran di kelasnya.",
    tips: "NIS dan kontak orang tua bersifat opsional.",
  },
  {
    icon: ClipboardList,
    title: "4. Mulai Pertemuan & Absensi",
    description:
      'Pilih mata pelajaran, klik "Mulai Pertemuan", masukkan topik/materi hari ini. Kemudian isi status kehadiran setiap siswa: Hadir, Sakit, Izin, atau Alpa.',
    tips: "Siswa yang belum diisi akan otomatis ditandai Alpa saat pertemuan diselesaikan.",
  },
  {
    icon: FileBarChart,
    title: "5. Lihat Rekap & Export PDF",
    description:
      'Buka halaman "Rekap Absensi" untuk melihat ringkasan kehadiran per mata pelajaran. Anda juga bisa export laporan ke PDF.',
    tips: "PDF berisi rekap semua kelas dan mata pelajaran yang Anda kelola.",
  },
];

export default function PanduanPage() {
  return (
    <div className="max-w-3xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-2">Panduan Penggunaan</h1>
        <p className="text-ink-muted dark:text-ink-muted-dark">
          Ikuti langkah-langkah berikut untuk menggunakan aplikasi absensi.
        </p>
      </div>

      <div className="space-y-4">
        {steps.map((step, index) => {
          const Icon = step.icon;
          return (
            <div
              key={index}
              className="bg-surface-1 dark:bg-surface-dark-1 rounded-xl shadow-card overflow-hidden"
            >
              <div className="p-5 flex gap-4">
                <div className="flex-shrink-0">
                  <div className="w-11 h-11 bg-primary/10 rounded-lg flex items-center justify-center">
                    <Icon className="w-6 h-6 text-primary" />
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-lg mb-1">{step.title}</h3>
                  <p className="text-sm text-ink-muted dark:text-ink-muted-dark leading-relaxed">
                    {step.description}
                  </p>
                  {step.tips && (
                    <div className="mt-3 flex items-start gap-2 px-3 py-2 bg-primary/5 rounded-lg">
                      <ChevronRight className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                      <p className="text-xs text-ink-muted dark:text-ink-muted-dark">
                        <span className="font-medium text-primary">Tips:</span>{" "}
                        {step.tips}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Info Card */}
      <div className="mt-8 bg-primary/5 border border-primary/20 rounded-xl p-5">
        <h3 className="font-semibold text-primary mb-2">Tentang Sistem Ini</h3>
        <p className="text-sm text-ink-muted dark:text-ink-muted-dark leading-relaxed">
          Aplikasi Absensi RBIA dirancang untuk memudahkan guru dalam mencatat
          kehadiran siswa. Data tersimpan aman di cloud dan dapat diakses kapan
          saja. Sistem ini mendukung soft delete, sehingga data yang dihapus
          tetap tersimpan untuk keperluan historis.
        </p>
      </div>
    </div>
  );
}
