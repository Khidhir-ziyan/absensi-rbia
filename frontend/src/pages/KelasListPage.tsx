import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "@/lib/api";
import {
  Plus,
  Pencil,
  Trash2,
  Save,
  X,
  GraduationCap,
  ChevronRight,
} from "lucide-react";
import LoadingSpinner from "@/components/LoadingSpinner";
import EmptyState from "@/components/EmptyState";

interface Class {
  id: string;
  name: string;
  description: string | null;
}

export default function KelasListPage() {
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);

  // Create form
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);

  // Edit form
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);

  const fetchClasses = async () => {
    const res = await api.get("/classes");
    setClasses(res.data.data);
    setLoading(false);
  };

  useEffect(() => {
    fetchClasses();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    try {
      await api.post("/classes", {
        name: name.trim(),
        description: description.trim() || undefined,
      });
      setName("");
      setDescription("");
      setShowForm(false);
      fetchClasses();
    } catch (err: any) {
      alert(err.response?.data?.message || "Gagal membuat kelas");
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (cls: Class) => {
    setEditingId(cls.id);
    setEditName(cls.name);
    setEditDescription(cls.description || "");
    setShowForm(false);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditName("");
    setEditDescription("");
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editName.trim() || !editingId) return;
    setSavingEdit(true);
    try {
      await api.put(`/classes/${editingId}`, {
        name: editName.trim(),
        description: editDescription.trim() || undefined,
      });
      cancelEdit();
      fetchClasses();
    } catch (err: any) {
      alert(err.response?.data?.message || "Gagal mengupdate kelas");
    } finally {
      setSavingEdit(false);
    }
  };

  const handleDelete = async (id: string, className: string) => {
    if (!confirm(`Hapus kelas "${className}"? Data absensi tetap tersimpan.`))
      return;
    try {
      await api.delete(`/classes/${id}`);
      fetchClasses();
    } catch (err: any) {
      alert(err.response?.data?.message || "Gagal menghapus kelas");
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="max-w-content mx-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Kelas</h1>
          <p className="text-sm text-ink-muted dark:text-ink-muted-dark mt-1">
            Kelola kelas dan siswa Anda
          </p>
        </div>
        <button
          onClick={() => {
            setShowForm(true);
            cancelEdit();
          }}
          className="flex items-center gap-2 px-4 py-2.5 bg-primary text-on-primary rounded-lg hover:bg-primary-hover transition-colors text-sm font-medium"
        >
          <Plus className="w-4 h-4" />
          Tambah Kelas
        </button>
      </div>

      {/* Create Form */}
      {showForm && (
        <div className="mb-6 bg-surface-1 dark:bg-surface-dark-1 rounded-xl shadow-card p-5">
          <h3 className="font-semibold mb-4">Kelas Baru</h3>
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">
                Nama Kelas
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-2.5 border border-border dark:border-border-dark rounded-lg bg-canvas dark:bg-canvas-dark focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="Contoh: Kelas 4A"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">
                Deskripsi{" "}
                <span className="text-ink-muted dark:text-ink-muted-dark font-normal">
                  (opsional)
                </span>
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-4 py-2.5 border border-border dark:border-border-dark rounded-lg bg-canvas dark:bg-canvas-dark focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="Contoh: Semester genap 2024"
              />
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={saving || !name.trim()}
                className="flex items-center gap-2 px-4 py-2.5 bg-primary text-on-primary rounded-lg hover:bg-primary-hover transition-colors text-sm font-medium disabled:opacity-50"
              >
                {saving ? (
                  <>Menyimpan...</>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Simpan
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="flex items-center gap-2 px-4 py-2.5 border border-border dark:border-border-dark rounded-lg text-sm hover:bg-surface-2 dark:hover:bg-surface-dark-2 transition-colors"
              >
                <X className="w-4 h-4" />
                Batal
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Class List */}
      {classes.length === 0 ? (
        <EmptyState
          icon={GraduationCap}
          title="Belum ada kelas"
          description="Mulai dengan membuat kelas pertama Anda."
          action={
            <button
              onClick={() => setShowForm(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-primary text-on-primary rounded-lg hover:bg-primary-hover transition-colors text-sm font-medium"
            >
              <Plus className="w-4 h-4" />
              Tambah Kelas
            </button>
          }
        />
      ) : (
        <div className="space-y-3">
          {classes.map((cls) => (
            <div key={cls.id}>
              {editingId === cls.id ? (
                <div className="bg-surface-1 dark:bg-surface-dark-1 rounded-xl shadow-card p-5">
                  <h3 className="font-semibold mb-4">Edit Kelas</h3>
                  <form onSubmit={handleUpdate} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-1.5">
                        Nama Kelas
                      </label>
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="w-full px-4 py-2.5 border border-border dark:border-border-dark rounded-lg bg-canvas dark:bg-canvas-dark focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1.5">
                        Deskripsi{" "}
                        <span className="text-ink-muted dark:text-ink-muted-dark font-normal">
                          (opsional)
                        </span>
                      </label>
                      <input
                        type="text"
                        value={editDescription}
                        onChange={(e) => setEditDescription(e.target.value)}
                        className="w-full px-4 py-2.5 border border-border dark:border-border-dark rounded-lg bg-canvas dark:bg-canvas-dark focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="submit"
                        disabled={savingEdit || !editName.trim()}
                        className="flex items-center gap-2 px-4 py-2.5 bg-primary text-on-primary rounded-lg hover:bg-primary-hover transition-colors text-sm font-medium disabled:opacity-50"
                      >
                        {savingEdit ? (
                          <>Menyimpan...</>
                        ) : (
                          <>
                            <Save className="w-4 h-4" />
                            Simpan
                          </>
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={cancelEdit}
                        className="flex items-center gap-2 px-4 py-2.5 border border-border dark:border-border-dark rounded-lg text-sm hover:bg-surface-2 dark:hover:bg-surface-dark-2 transition-colors"
                      >
                        <X className="w-4 h-4" />
                        Batal
                      </button>
                    </div>
                  </form>
                </div>
              ) : (
                <div className="group bg-surface-1 dark:bg-surface-dark-1 rounded-xl shadow-card hover:shadow-elevated transition-all">
                  <div className="flex items-center p-4">
                    <Link
                      to={`/classes/${cls.id}`}
                      className="flex-1 flex items-center gap-4"
                    >
                      <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                        <GraduationCap className="w-5 h-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h2 className="font-semibold">{cls.name}</h2>
                        {cls.description && (
                          <p className="text-sm text-ink-muted dark:text-ink-muted-dark truncate">
                            {cls.description}
                          </p>
                        )}
                      </div>
                      <ChevronRight className="w-5 h-5 text-ink-muted dark:text-ink-muted-dark opacity-0 group-hover:opacity-100 transition-opacity" />
                    </Link>
                    <div className="flex items-center gap-1 ml-2">
                      <button
                        onClick={() => startEdit(cls)}
                        className="p-2 rounded-lg text-ink-muted dark:text-ink-muted-dark hover:text-primary hover:bg-primary/10 transition-colors"
                        title="Edit"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(cls.id, cls.name)}
                        className="p-2 rounded-lg text-ink-muted dark:text-ink-muted-dark hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                        title="Hapus"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
