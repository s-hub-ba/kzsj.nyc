"use client";

import { useState } from "react";
import { SchoolClass, Term, ClassType } from "@/types/models";
import { saveClass, deleteClass, saveTerm, deleteTerm } from "@/lib/firestore";

interface AdminClassesProps {
  classes: SchoolClass[];
  terms: Term[];
  currentAdminEmail: string;
  onClassesUpdate: (classes: SchoolClass[]) => void;
  onTermsUpdate: (terms: Term[]) => void;
}

type ClassForm = {
  title_sr: string;
  title_en: string;
  description_sr: string;
  description_en: string;
  ageGroup: string;
  level: string;
  price: number;
  type: ClassType;
  active: boolean;
};

type TermForm = {
  classId: string;
  assignmentType: "regular" | "vanredno";
  title_sr: string;
  title_en: string;
  date: string;
  startTime: string;
  endTime: string;
  capacity: number;
  location: string;
};

const emptyClassForm = (): ClassForm => ({
  title_sr: "",
  title_en: "",
  description_sr: "",
  description_en: "",
  ageGroup: "",
  level: "Početni",
  price: 24,
  type: "semester",
  active: true,
});

const emptyTermForm = (classId = ""): TermForm => ({
  classId,
  assignmentType: "regular",
  title_sr: "",
  title_en: "",
  date: "",
  startTime: "",
  endTime: "",
  capacity: 10,
  location: "Online",
});

export function AdminClasses({
  classes,
  terms,
  currentAdminEmail,
  onClassesUpdate,
  onTermsUpdate,
}: AdminClassesProps) {
  const MANUAL_TERM_FORM = "__manual__";
  const [showClassForm, setShowClassForm] = useState(false);
  const [editingClass, setEditingClass] = useState<SchoolClass | null>(null);
  const [classForm, setClassForm] = useState<ClassForm>(emptyClassForm());
  const [savingClass, setSavingClass] = useState(false);

  const [showTermForm, setShowTermForm] = useState<string | null>(null);
  const [editingTerm, setEditingTerm] = useState<Term | null>(null);
  const [termForm, setTermForm] = useState<TermForm>(emptyTermForm());
  const [savingTerm, setSavingTerm] = useState(false);

  const [expandedClass, setExpandedClass] = useState<string | null>(null);

  const AGE_GROUPS = ["1–3 godine", "3–5 godina", "5–7 godina"];
  const LEVELS = ["Početni", "Srednji", "Napredni", "Svi nivoi"];

  // ── Class CRUD ─────────────────────────────────────────────────────────────

  const openNewClass = () => {
    setEditingClass(null);
    setClassForm(emptyClassForm());
    setShowClassForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const openEditClass = (cls: SchoolClass) => {
    setEditingClass(cls);
    setClassForm({
      title_sr: cls.title_sr,
      title_en: cls.title_en,
      description_sr: cls.description_sr,
      description_en: cls.description_en,
      ageGroup: cls.ageGroup,
      level: cls.level,
      price: cls.price,
      type: cls.type,
      active: cls.active,
    });
    setShowClassForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSaveClass = async () => {
    if (!classForm.title_sr.trim() || !classForm.title_en.trim()) return;
    setSavingClass(true);
    try {
      const payload = editingClass ? { id: editingClass.id, ...classForm } : { ...classForm };
      const id = await saveClass(payload);
      const savedClass: SchoolClass = {
        id: id ?? editingClass?.id ?? "",
        ...classForm,
      };
      const updated = editingClass
        ? classes.map((c) => (c.id === editingClass.id ? savedClass : c))
        : [...classes, savedClass];
      onClassesUpdate(updated);
      setShowClassForm(false);
      setEditingClass(null);
    } catch (error) {
      alert(error instanceof Error ? error.message : "Čuvanje grupe nije uspelo.");
    } finally {
      setSavingClass(false);
    }
  };

  const handleDeleteClass = async (cls: SchoolClass) => {
    if (!confirm(`Obrisati grupu "${cls.title_sr}"? Svi termini će biti obrisani.`)) return;
    try {
      await deleteClass(cls.id);
      const classTerms = terms.filter((t) => t.classId === cls.id);
      await Promise.all(classTerms.map((t) => deleteTerm(t.id)));
      onClassesUpdate(classes.filter((c) => c.id !== cls.id));
      onTermsUpdate(terms.filter((t) => t.classId !== cls.id));
    } catch (error) {
      alert(error instanceof Error ? error.message : "Brisanje grupe nije uspelo.");
    }
  };

  // ── Term CRUD ──────────────────────────────────────────────────────────────

  const openNewTerm = (classId: string) => {
    const cls = classes.find((c) => c.id === classId);
    setEditingTerm(null);
    setTermForm({
      ...emptyTermForm(classId),
      assignmentType: "regular",
      title_sr: cls ? `${cls.title_sr} – Termin` : "",
      title_en: cls ? `${cls.title_en} – Session` : "",
    });
    setShowTermForm(classId);
    setExpandedClass(classId);
  };

  const openManualTerm = () => {
    const firstClass = classes[0];
    setEditingTerm(null);
    setTermForm({
      ...emptyTermForm(firstClass?.id ?? ""),
      assignmentType: "vanredno",
      title_sr: "Vanredni čas",
      title_en: "Extra class",
    });
    setShowTermForm(MANUAL_TERM_FORM);
    setExpandedClass(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const openEditTerm = (term: Term) => {
    setEditingTerm(term);
    setTermForm({
      classId: term.classId,
      assignmentType: term.assignmentType ?? "regular",
      title_sr: term.title_sr,
      title_en: term.title_en,
      date: term.date,
      startTime: term.startTime,
      endTime: term.endTime,
      capacity: term.capacity,
      location: term.location,
    });
    setShowTermForm(term.classId);
  };

  const handleSaveTerm = async () => {
    if (!termForm.classId || !termForm.date || !termForm.startTime || !termForm.endTime) return;
    setSavingTerm(true);
    try {
      const payload = editingTerm ? { id: editingTerm.id, ...termForm } : { ...termForm };
      const id = await saveTerm(payload);
      const savedTerm: Term = {
        id: id ?? editingTerm?.id ?? "",
        ...termForm,
        bookedCount: editingTerm?.bookedCount ?? 0,
        overbookLimit: editingTerm?.overbookLimit ?? 0,
        active: editingTerm?.active ?? true,
        updatedBy: currentAdminEmail,
        updatedAt: new Date().toISOString(),
      };
      const updated = editingTerm
        ? terms.map((t) => (t.id === editingTerm.id ? savedTerm : t))
        : [...terms, savedTerm];
      onTermsUpdate(updated);
      setShowTermForm(null);
      setEditingTerm(null);
    } catch (error) {
      alert(error instanceof Error ? error.message : "Čuvanje termina nije uspelo.");
    } finally {
      setSavingTerm(false);
    }
  };

  const handleDeleteTerm = async (term: Term) => {
    if (!confirm(`Obrisati termin "${term.title_sr}" (${term.date})?`)) return;
    try {
      await deleteTerm(term.id);
      onTermsUpdate(terms.filter((t) => t.id !== term.id));
    } catch (error) {
      alert(error instanceof Error ? error.message : "Brisanje termina nije uspelo.");
    }
  };

  const formatDate = (d: string) => {
    if (!d) return "—";
    try {
      return new Date(d).toLocaleDateString("sr-RS", {
        weekday: "short",
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    } catch {
      return d;
    }
  };

  const getTermsForClass = (classId: string) => terms.filter((t) => t.classId === classId);

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Grupe i termini</h2>
          <p className="mt-1 text-sm text-muted">
            Kreirajte grupe, dodajte termine i upravljajte kapacitetima
          </p>
        </div>
        <button
          onClick={openNewClass}
          className="rounded-xl bg-brand px-5 py-2.5 text-sm font-semibold text-white shadow transition hover:opacity-90"
        >
          + Nova grupa
        </button>
        <button
          onClick={openManualTerm}
          disabled={classes.length === 0}
          className="rounded-xl border border-brand/40 bg-brand/10 px-5 py-2.5 text-sm font-semibold text-brand transition hover:bg-brand/20 disabled:cursor-not-allowed disabled:opacity-50"
        >
          + Vanredni termin
        </button>
      </div>

      {showTermForm === MANUAL_TERM_FORM && (
        <div className="rounded-3xl border-2 border-brand/30 bg-surface p-6 shadow-lg">
          <h3 className="mb-4 text-xl font-semibold">Dodaj vanredni termin</h3>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-muted">Dodeljena grupa *</label>
              <select
                value={termForm.classId}
                onChange={(e) => setTermForm((f) => ({ ...f, classId: e.target.value }))}
                className="w-full rounded-xl border border-line bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/50"
              >
                <option value="">– Izaberi grupu –</option>
                {classes.map((cls) => (
                  <option key={cls.id} value={cls.id}>{cls.title_sr}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted">Tip termina</label>
              <select
                value={termForm.assignmentType}
                onChange={(e) =>
                  setTermForm((f) => ({ ...f, assignmentType: e.target.value as "regular" | "vanredno" }))
                }
                className="w-full rounded-xl border border-line bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/50"
              >
                <option value="vanredno">Vanredno</option>
                <option value="regular">Regularno</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted">Naziv termina (srpski)</label>
              <input
                value={termForm.title_sr}
                onChange={(e) => setTermForm((f) => ({ ...f, title_sr: e.target.value }))}
                className="w-full rounded-xl border border-line bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/50"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted">Naziv termina (engleski)</label>
              <input
                value={termForm.title_en}
                onChange={(e) => setTermForm((f) => ({ ...f, title_en: e.target.value }))}
                className="w-full rounded-xl border border-line bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/50"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted">Datum *</label>
              <input
                type="date"
                value={termForm.date}
                onChange={(e) => setTermForm((f) => ({ ...f, date: e.target.value }))}
                className="w-full rounded-xl border border-line bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/50"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted">Početak *</label>
              <input
                type="time"
                value={termForm.startTime}
                onChange={(e) => setTermForm((f) => ({ ...f, startTime: e.target.value }))}
                className="w-full rounded-xl border border-line bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/50"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted">Kraj *</label>
              <input
                type="time"
                value={termForm.endTime}
                onChange={(e) => setTermForm((f) => ({ ...f, endTime: e.target.value }))}
                className="w-full rounded-xl border border-line bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/50"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted">Kapacitet</label>
              <input
                type="number"
                min={1}
                max={30}
                value={termForm.capacity}
                onChange={(e) => setTermForm((f) => ({ ...f, capacity: Number(e.target.value) }))}
                className="w-full rounded-xl border border-line bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/50"
              />
            </div>
            <div className="sm:col-span-2 lg:col-span-3">
              <label className="mb-1 block text-xs font-medium text-muted">Lokacija</label>
              <input
                value={termForm.location}
                onChange={(e) => setTermForm((f) => ({ ...f, location: e.target.value }))}
                className="w-full rounded-xl border border-line bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/50"
              />
            </div>
          </div>
          <div className="mt-4 flex gap-3">
            <button
              onClick={() => void handleSaveTerm()}
              disabled={savingTerm || !termForm.classId || !termForm.date || !termForm.startTime || !termForm.endTime}
              className="rounded-xl bg-brand px-5 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
            >
              {savingTerm ? "Čuva se..." : "Dodaj termin"}
            </button>
            <button
              onClick={() => {
                setShowTermForm(null);
                setEditingTerm(null);
              }}
              className="rounded-xl border border-line px-5 py-2 text-sm font-medium transition hover:bg-surface-2"
            >
              Otkaži
            </button>
          </div>
        </div>
      )}

      {/* Class create / edit form */}
      {showClassForm && (
        <div className="rounded-3xl border-2 border-brand/30 bg-surface p-6 shadow-lg">
          <h3 className="mb-4 text-xl font-semibold">
            {editingClass ? `Izmena: ${editingClass.title_sr}` : "Nova grupa"}
          </h3>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-muted">Naziv (srpski) *</label>
              <input
                value={classForm.title_sr}
                onChange={(e) => setClassForm((f) => ({ ...f, title_sr: e.target.value }))}
                placeholder="npr. Srpski za mališe"
                className="w-full rounded-xl border border-line bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/50"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted">Naziv (engleski) *</label>
              <input
                value={classForm.title_en}
                onChange={(e) => setClassForm((f) => ({ ...f, title_en: e.target.value }))}
                placeholder="e.g. Serbian for Toddlers"
                className="w-full rounded-xl border border-line bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/50"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs font-medium text-muted">Opis (srpski)</label>
              <textarea
                value={classForm.description_sr}
                onChange={(e) => setClassForm((f) => ({ ...f, description_sr: e.target.value }))}
                rows={2}
                placeholder="Kratki opis grupe na srpskom..."
                className="w-full rounded-xl border border-line bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/50"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs font-medium text-muted">Opis (engleski)</label>
              <textarea
                value={classForm.description_en}
                onChange={(e) => setClassForm((f) => ({ ...f, description_en: e.target.value }))}
                rows={2}
                placeholder="Short description in English..."
                className="w-full rounded-xl border border-line bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/50"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted">Uzrasna grupa *</label>
              <select
                value={classForm.ageGroup}
                onChange={(e) => setClassForm((f) => ({ ...f, ageGroup: e.target.value }))}
                className="w-full rounded-xl border border-line bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/50"
              >
                <option value="">– Izaberi –</option>
                {AGE_GROUPS.map((g) => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted">Nivo</label>
              <select
                value={classForm.level}
                onChange={(e) => setClassForm((f) => ({ ...f, level: e.target.value }))}
                className="w-full rounded-xl border border-line bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/50"
              >
                {LEVELS.map((l) => (
                  <option key={l} value={l}>{l}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted">Cena (USD)</label>
              <input
                type="number"
                min={0}
                value={classForm.price}
                onChange={(e) => setClassForm((f) => ({ ...f, price: Number(e.target.value) }))}
                className="w-full rounded-xl border border-line bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/50"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted">Tip nastave</label>
              <select
                value={classForm.type}
                onChange={(e) => setClassForm((f) => ({ ...f, type: e.target.value as ClassType }))}
                className="w-full rounded-xl border border-line bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/50"
              >
                <option value="semester">Semestar</option>
                <option value="single">Jedan čas</option>
              </select>
            </div>
            <div className="flex items-center gap-2 pt-4">
              <input
                id="class-active"
                type="checkbox"
                checked={classForm.active}
                onChange={(e) => setClassForm((f) => ({ ...f, active: e.target.checked }))}
                className="h-4 w-4"
              />
              <label htmlFor="class-active" className="text-sm font-medium">
                Aktivna (vidljiva roditeljima)
              </label>
            </div>
          </div>

          <div className="mt-6 flex gap-3">
            <button
              onClick={() => void handleSaveClass()}
              disabled={savingClass || !classForm.title_sr.trim() || !classForm.title_en.trim()}
              className="rounded-xl bg-brand px-5 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
            >
              {savingClass ? "Čuva se..." : editingClass ? "Sačuvaj izmene" : "Kreiraj grupu"}
            </button>
            <button
              onClick={() => { setShowClassForm(false); setEditingClass(null); }}
              className="rounded-xl border border-line px-5 py-2 text-sm font-medium transition hover:bg-surface-2"
            >
              Otkaži
            </button>
          </div>
        </div>
      )}

      {/* Empty state */}
      {classes.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-line bg-surface p-12 text-center">
          <p className="text-5xl">📚</p>
          <p className="mt-3 text-lg font-semibold">Nema kreiranih grupa</p>
          <p className="mt-1 text-sm text-muted">Kliknite &quot;+ Nova grupa&quot; da dodate prvu grupu</p>
          <button
            onClick={openNewClass}
            className="mt-5 rounded-xl bg-brand px-6 py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
          >
            + Nova grupa
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {classes.map((cls) => {
            const classTerms = getTermsForClass(cls.id);
            const isExpanded = expandedClass === cls.id;
            const totalBooked = classTerms.reduce((s, t) => s + (t.bookedCount ?? 0), 0);
            const totalCapacity = classTerms.reduce(
              (s, t) => s + t.capacity + (t.overbookLimit ?? 0),
              0,
            );

            return (
              <div key={cls.id} className="rounded-3xl border border-line bg-surface shadow-sm">
                {/* Class header */}
                <div className="flex flex-wrap items-center gap-3 p-5">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-lg font-semibold">{cls.title_sr}</h3>
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          cls.active ? "bg-success/20 text-success" : "bg-muted/20 text-muted"
                        }`}
                      >
                        {cls.active ? "Aktivna" : "Neaktivna"}
                      </span>
                      <span className="rounded-full bg-surface-2 px-2 py-0.5 text-xs text-muted">
                        {cls.ageGroup}
                      </span>
                      <span className="rounded-full bg-surface-2 px-2 py-0.5 text-xs text-muted">
                        {cls.type === "semester" ? "Semestar" : "Jedan čas"}
                      </span>
                      <span className="rounded-full bg-surface-2 px-2 py-0.5 text-xs font-semibold text-brand">
                        ${cls.price}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-muted">{cls.description_sr}</p>
                    <p className="mt-0.5 text-xs text-muted">
                      {classTerms.length}{" "}
                      {classTerms.length === 1
                        ? "termin"
                        : "termina"}
                      {classTerms.length > 0 &&
                        ` · ${totalBooked}/${totalCapacity} mesta popunjeno`}
                    </p>
                  </div>

                  <div className="flex flex-shrink-0 flex-wrap items-center gap-2">
                    <button
                      onClick={() => setExpandedClass(isExpanded ? null : cls.id)}
                      className="rounded-xl border border-line px-3 py-1.5 text-xs font-medium transition hover:bg-surface-2"
                    >
                      {isExpanded ? "Sakrij" : `Termini (${classTerms.length})`}
                    </button>
                    <button
                      onClick={() => openNewTerm(cls.id)}
                      className="rounded-xl border border-brand/40 bg-brand/10 px-3 py-1.5 text-xs font-semibold text-brand transition hover:bg-brand/20"
                    >
                      + Termin
                    </button>
                    <button
                      onClick={() => openEditClass(cls)}
                      className="rounded-xl border border-line px-3 py-1.5 text-xs font-medium transition hover:bg-surface-2"
                    >
                      Izmeni
                    </button>
                    <button
                      onClick={() => void handleDeleteClass(cls)}
                      className="rounded-xl border border-danger/30 bg-danger/10 px-3 py-1.5 text-xs font-medium text-danger transition hover:bg-danger/20"
                    >
                      Obriši
                    </button>
                  </div>
                </div>

                {/* Inline term form */}
                {showTermForm === cls.id && (
                  <div className="border-t border-line bg-surface-2 p-5">
                    <h4 className="mb-4 font-semibold">
                      {editingTerm ? "Izmeni termin" : "Dodaj novi termin"}
                    </h4>
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      <div>
                        <label className="mb-1 block text-xs font-medium text-muted">
                          Naziv termina (srpski)
                        </label>
                        <input
                          value={termForm.title_sr}
                          onChange={(e) =>
                            setTermForm((f) => ({ ...f, title_sr: e.target.value }))
                          }
                          placeholder="npr. Srpski za mališe – Ponedeljak"
                          className="w-full rounded-xl border border-line bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/50"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-medium text-muted">
                          Naziv termina (engleski)
                        </label>
                        <input
                          value={termForm.title_en}
                          onChange={(e) =>
                            setTermForm((f) => ({ ...f, title_en: e.target.value }))
                          }
                          placeholder="e.g. Serbian for Toddlers – Monday"
                          className="w-full rounded-xl border border-line bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/50"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-medium text-muted">Tip termina</label>
                        <select
                          value={termForm.assignmentType}
                          onChange={(e) =>
                            setTermForm((f) => ({ ...f, assignmentType: e.target.value as "regular" | "vanredno" }))
                          }
                          className="w-full rounded-xl border border-line bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/50"
                        >
                          <option value="regular">Regularno</option>
                          <option value="vanredno">Vanredno</option>
                        </select>
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-medium text-muted">
                          Datum *
                        </label>
                        <input
                          type="date"
                          value={termForm.date}
                          onChange={(e) => setTermForm((f) => ({ ...f, date: e.target.value }))}
                          className="w-full rounded-xl border border-line bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/50"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-medium text-muted">
                          Početak *
                        </label>
                        <input
                          type="time"
                          value={termForm.startTime}
                          onChange={(e) =>
                            setTermForm((f) => ({ ...f, startTime: e.target.value }))
                          }
                          className="w-full rounded-xl border border-line bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/50"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-medium text-muted">Kraj *</label>
                        <input
                          type="time"
                          value={termForm.endTime}
                          onChange={(e) =>
                            setTermForm((f) => ({ ...f, endTime: e.target.value }))
                          }
                          className="w-full rounded-xl border border-line bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/50"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-medium text-muted">
                          Kapacitet (max dece)
                        </label>
                        <input
                          type="number"
                          min={1}
                          max={30}
                          value={termForm.capacity}
                          onChange={(e) =>
                            setTermForm((f) => ({ ...f, capacity: Number(e.target.value) }))
                          }
                          className="w-full rounded-xl border border-line bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/50"
                        />
                      </div>
                      <div className="sm:col-span-2 lg:col-span-3">
                        <label className="mb-1 block text-xs font-medium text-muted">
                          Lokacija
                        </label>
                        <input
                          value={termForm.location}
                          onChange={(e) =>
                            setTermForm((f) => ({ ...f, location: e.target.value }))
                          }
                          placeholder="npr. Online (Zoom), NYC Studio, adresa..."
                          className="w-full rounded-xl border border-line bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/50"
                        />
                      </div>
                    </div>

                    <div className="mt-4 flex gap-3">
                      <button
                        onClick={() => void handleSaveTerm()}
                        disabled={
                          savingTerm || !termForm.date || !termForm.startTime || !termForm.endTime
                        }
                        className="rounded-xl bg-brand px-5 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
                      >
                        {savingTerm
                          ? "Čuva se..."
                          : editingTerm
                            ? "Sačuvaj termin"
                            : "Dodaj termin"}
                      </button>
                      <button
                        onClick={() => {
                          setShowTermForm(null);
                          setEditingTerm(null);
                        }}
                        className="rounded-xl border border-line px-5 py-2 text-sm font-medium transition hover:bg-surface-2"
                      >
                        Otkaži
                      </button>
                    </div>
                  </div>
                )}

                {/* Terms table (expanded) */}
                {isExpanded && (
                  <div className="border-t border-line">
                    {classTerms.length === 0 ? (
                      <div className="px-5 py-8 text-center text-sm text-muted">
                        Nema zakazanih termina. Kliknite &quot;+ Termin&quot; da dodate raspored.
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                          <thead>
                            <tr className="border-b border-line bg-surface-2 text-xs text-muted">
                              <th className="py-2 px-4">Naziv</th>
                              <th className="py-2 px-4">Tip</th>
                              <th className="py-2 px-4">Datum</th>
                              <th className="py-2 px-4">Vreme</th>
                              <th className="py-2 px-4">Lokacija</th>
                              <th className="py-2 px-4">Popunjenost</th>
                              <th className="py-2 px-4">Akcije</th>
                            </tr>
                          </thead>
                          <tbody>
                            {classTerms.map((term) => {
                              const max = term.capacity + (term.overbookLimit ?? 0);
                              const fill = max > 0 ? (term.bookedCount / max) * 100 : 0;
                              return (
                                <tr
                                  key={term.id}
                                  className="border-b border-line/50 hover:bg-surface-2"
                                >
                                  <td className="py-2.5 px-4 font-medium">{term.title_sr}</td>
                                  <td className="py-2.5 px-4">
                                    <span className={`inline-block rounded-full px-2 py-1 text-xs font-medium ${
                                      (term.assignmentType ?? "regular") === "vanredno"
                                        ? "bg-warning/20 text-warning"
                                        : "bg-info/20 text-info"
                                    }`}>
                                      {(term.assignmentType ?? "regular") === "vanredno" ? "Vanredno" : "Regularno"}
                                    </span>
                                  </td>
                                  <td className="py-2.5 px-4">{formatDate(term.date)}</td>
                                  <td className="py-2.5 px-4 whitespace-nowrap">
                                    {term.startTime} – {term.endTime}
                                  </td>
                                  <td className="py-2.5 px-4 text-muted">{term.location}</td>
                                  <td className="py-2.5 px-4">
                                    <div className="flex items-center gap-2">
                                      <div className="h-1.5 w-20 overflow-hidden rounded-full bg-line">
                                        <div
                                          className={`h-full ${
                                            fill >= 100
                                              ? "bg-danger"
                                              : fill >= 80
                                                ? "bg-warning"
                                                : "bg-success"
                                          }`}
                                          style={{ width: `${Math.min(fill, 100)}%` }}
                                        />
                                      </div>
                                      <span
                                        className={`text-xs font-medium ${
                                          fill >= 100 ? "text-danger" : "text-muted"
                                        }`}
                                      >
                                        {term.bookedCount}/{max}
                                      </span>
                                    </div>
                                  </td>
                                  <td className="py-2.5 px-4">
                                    <div className="flex gap-2">
                                      <button
                                        onClick={() => openEditTerm(term)}
                                        className="rounded-lg border border-line px-2 py-1 text-xs transition hover:bg-surface-2"
                                      >
                                        Izmeni
                                      </button>
                                      <button
                                        onClick={() => void handleDeleteTerm(term)}
                                        className="rounded-lg border border-danger/30 bg-danger/10 px-2 py-1 text-xs text-danger transition hover:bg-danger/20"
                                      >
                                        Obriši
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <section className="rounded-3xl border border-line bg-surface p-5">
        <p className="text-sm text-muted">
          <strong>ℹ️ Napomena:</strong> Termin koji kreirate odmah postaje dostupan za prijavu ako
          je grupa aktivna. Kapacitet možete povećati naknadnim izmenama termina.
        </p>
      </section>
    </div>
  );
}
