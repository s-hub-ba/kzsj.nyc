"use client";

import { useEffect, useMemo, useState } from "react";
import { JobApplication, SchoolClass, Term, Weekday, WorkerAvailabilitySlot, WorkerProfile } from "@/types/models";
import {
  assignWorkerToClass,
  assignWorkerToTerm,
  createWorkerFromApplication,
  saveWorkerProfile,
} from "@/lib/firestore";

interface AdminJobApplicationsProps {
  applications: JobApplication[];
  workers: WorkerProfile[];
  classes: SchoolClass[];
  terms: Term[];
  currentAdminEmail: string;
  onWorkersUpdate: (workers: WorkerProfile[]) => void;
  onTermsUpdate: (terms: Term[]) => void;
}

type WorkerDraft = {
  fullName: string;
  email: string;
  phone: string;
  employmentType: WorkerProfile["employmentType"];
  experienceSummary: string;
  notes: string;
  active: boolean;
  weeklyAvailability: WorkerAvailabilitySlot[];
  availabilitySource: NonNullable<WorkerProfile["availabilitySource"]>;
  availabilityConfirmedAt: string;
};

const WEEK_DAYS: Array<{ key: Weekday; label: string }> = [
  { key: "monday", label: "Ponedeljak" },
  { key: "tuesday", label: "Utorak" },
  { key: "wednesday", label: "Sreda" },
  { key: "thursday", label: "Cetvrtak" },
  { key: "friday", label: "Petak" },
  { key: "saturday", label: "Subota" },
  { key: "sunday", label: "Nedelja" },
];

function formatEmploymentType(value: JobApplication["employmentType"]) {
  switch (value) {
    case "full-time":
      return "Full-time";
    case "part-time":
      return "Part-time";
    case "both":
      return "Oba";
    default:
      return value;
  }
}

function toMinutes(timeValue: string) {
  const match = timeValue.match(/^(\d{1,2}):(\d{2})/);
  if (!match) return null;
  const hh = Number(match[1]);
  const mm = Number(match[2]);
  if (Number.isNaN(hh) || Number.isNaN(mm)) return null;
  return hh * 60 + mm;
}

function getWeekday(dateValue: string) {
  const [yearStr, monthStr, dayStr] = dateValue.split("-");
  const year = Number(yearStr);
  const month = Number(monthStr);
  const day = Number(dayStr);
  if (!year || !month || !day) return null;

  const weekdayIndex = new Date(Date.UTC(year, month - 1, day)).getUTCDay();
  const weekdays: Weekday[] = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
  return weekdays[weekdayIndex] ?? null;
}

function isWorkerCompatible(worker: WorkerProfile | WorkerDraft, term: Term) {
  if (!("active" in worker ? worker.active : true)) {
    return false;
  }

  const weekday = getWeekday(term.date);
  const termStart = toMinutes(term.startTime);
  const termEnd = toMinutes(term.endTime);
  const slots = worker.weeklyAvailability ?? [];

  if (!weekday || termStart === null || termEnd === null || slots.length === 0) {
    return false;
  }

  return slots.some((slot) => {
    if (slot.day !== weekday) return false;
    const slotStart = toMinutes(slot.startTime);
    const slotEnd = toMinutes(slot.endTime);
    if (slotStart === null || slotEnd === null) return false;
    return slotStart <= termStart && slotEnd >= termEnd;
  });
}

export function AdminJobApplications({
  applications,
  workers,
  classes,
  terms,
  currentAdminEmail,
  onWorkersUpdate,
  onTermsUpdate,
}: AdminJobApplicationsProps) {
  const [creatingFromApplicationId, setCreatingFromApplicationId] = useState<string | null>(null);
  const [savingWorkerId, setSavingWorkerId] = useState<string | null>(null);
  const [assigningWorkerId, setAssigningWorkerId] = useState<string | null>(null);
  const [bulkAssigningWorkerId, setBulkAssigningWorkerId] = useState<string | null>(null);
  const [workerDrafts, setWorkerDrafts] = useState<Record<string, WorkerDraft>>({});
  const [termByWorker, setTermByWorker] = useState<Record<string, string>>({});
  const [classByWorker, setClassByWorker] = useState<Record<string, string>>({});

  const classById = useMemo(
    () => Object.fromEntries(classes.map((item) => [item.id, item])),
    [classes],
  );

  useEffect(() => {
    setWorkerDrafts(
      Object.fromEntries(
        workers.map((worker) => [
          worker.id,
          {
            fullName: worker.fullName,
            email: worker.email,
            phone: worker.phone,
            employmentType: worker.employmentType,
            experienceSummary: worker.experienceSummary,
            notes: worker.notes ?? "",
            active: worker.active,
            weeklyAvailability: worker.weeklyAvailability ?? [],
            availabilitySource: worker.availabilitySource ?? "other",
            availabilityConfirmedAt: worker.availabilityConfirmedAt
              ? worker.availabilityConfirmedAt.slice(0, 10)
              : "",
          },
        ]),
      ),
    );
  }, [workers]);

  const activeWorkersCount = workers.filter((worker) => worker.active).length;

  const createWorker = async (applicationId: string) => {
    setCreatingFromApplicationId(applicationId);
    try {
      const createdWorker = await createWorkerFromApplication(applicationId);
      const exists = workers.some((worker) => worker.id === createdWorker.id);
      if (!exists) {
        onWorkersUpdate([createdWorker, ...workers]);
      }
    } catch (error) {
      alert(error instanceof Error ? error.message : "Kreiranje predavaca nije uspelo.");
    } finally {
      setCreatingFromApplicationId(null);
    }
  };

  const setWorkerDayAvailability = (
    workerId: string,
    day: Weekday,
    enabled: boolean,
    overrides?: Partial<Pick<WorkerAvailabilitySlot, "startTime" | "endTime">>,
  ) => {
    setWorkerDrafts((prev) => {
      const draft = prev[workerId];
      if (!draft) return prev;

      const existing = draft.weeklyAvailability.find((slot) => slot.day === day);
      let nextSlots = draft.weeklyAvailability.filter((slot) => slot.day !== day);

      if (enabled) {
        nextSlots = [
          ...nextSlots,
          {
            day,
            startTime: overrides?.startTime ?? existing?.startTime ?? "09:00",
            endTime: overrides?.endTime ?? existing?.endTime ?? "17:00",
          },
        ];
      }

      return {
        ...prev,
        [workerId]: {
          ...draft,
          weeklyAvailability: nextSlots,
        },
      };
    });
  };

  const saveWorker = async (workerId: string) => {
    const draft = workerDrafts[workerId];
    if (!draft) return;

    setSavingWorkerId(workerId);
    try {
      const saved = await saveWorkerProfile(workerId, {
        ...draft,
        availabilityConfirmedAt: draft.availabilityConfirmedAt
          ? new Date(`${draft.availabilityConfirmedAt}T00:00:00`).toISOString()
          : undefined,
      });
      onWorkersUpdate(workers.map((worker) => (worker.id === saved.id ? saved : worker)));
    } catch (error) {
      alert(error instanceof Error ? error.message : "Cuvanje dosijea nije uspelo.");
    } finally {
      setSavingWorkerId(null);
    }
  };

  const assignToTerm = async (worker: WorkerProfile) => {
    const termId = termByWorker[worker.id];
    if (!termId) return;

    setAssigningWorkerId(worker.id);
    try {
      const response = await assignWorkerToTerm(worker.id, termId);
      const now = new Date().toISOString();

      onTermsUpdate(
        terms.map((term) =>
          term.id === termId
            ? {
                ...term,
                assignedWorkerId: worker.id,
                assignedWorkerName: worker.fullName,
                assignedWorkerEmail: worker.email,
                assignedWorkerEmploymentType: worker.employmentType,
                updatedBy: currentAdminEmail,
                updatedAt: now,
              }
            : term,
        ),
      );

      if (!response.emailQueued && response.emailError) {
        alert(`Termin je dodeljen, ali email nije poslat: ${response.emailError}`);
      }
    } catch (error) {
      alert(error instanceof Error ? error.message : "Dodela predavaca nije uspela.");
    } finally {
      setAssigningWorkerId(null);
    }
  };

  const bulkAssignToClass = async (worker: WorkerProfile) => {
    const classId = classByWorker[worker.id];
    if (!classId) return;

    setBulkAssigningWorkerId(worker.id);
    try {
      const response = await assignWorkerToClass(worker.id, classId);
      const now = new Date().toISOString();

      onTermsUpdate(
        terms.map((term) =>
          response.assignedTermIds.includes(term.id)
            ? {
                ...term,
                assignedWorkerId: worker.id,
                assignedWorkerName: worker.fullName,
                assignedWorkerEmail: worker.email,
                assignedWorkerEmploymentType: worker.employmentType,
                updatedBy: currentAdminEmail,
                updatedAt: now,
              }
            : term,
        ),
      );

      if (response.assigned === 0) {
        alert("Nijedan termin nije dodeljen. Proverite dostupnost predavaca.");
      } else if (response.skipped > 0 || response.emailFailed > 0) {
        alert(
          `Dodeljeno: ${response.assigned}. Preskoceno zbog dostupnosti: ${response.skipped}. Email greske: ${response.emailFailed}.`,
        );
      }
    } catch (error) {
      alert(error instanceof Error ? error.message : "Bulk dodela nije uspela.");
    } finally {
      setBulkAssigningWorkerId(null);
    }
  };

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-line bg-surface p-6">
        <h2 className="text-2xl font-semibold">Prikupljanje dostupnosti bez naloga</h2>
        <p className="mt-2 text-sm text-muted">
          Predavac ne mora da ima nalog: admin unosi nedeljnu dostupnost nakon poziva, email-a ili poruke, i belezi datum poslednje potvrde.
        </p>
      </section>

      <section className="rounded-3xl border border-line bg-surface p-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-2xl font-semibold">Prijave za posao</h2>
            <p className="mt-1 text-sm text-muted">
              Iz prijava direktno kreirajte aktivne predavace koje kasnije dodeljujete terminima.
            </p>
          </div>
          <div className="rounded-2xl bg-surface-2 px-4 py-3 text-sm text-muted">
            Prijave: <span className="font-semibold text-foreground">{applications.length}</span>
          </div>
        </div>

        <div className="mt-6 overflow-x-auto">
          <table className="w-full min-w-[860px] text-left text-sm">
            <thead>
              <tr className="border-b border-line text-muted">
                <th className="px-2 py-3">Kandidat</th>
                <th className="px-2 py-3">Kontakt</th>
                <th className="px-2 py-3">Angazman</th>
                <th className="px-2 py-3">Iskustvo</th>
                <th className="px-2 py-3">Akcija</th>
              </tr>
            </thead>
            <tbody>
              {applications.map((application) => {
                const alreadyWorker = workers.some(
                  (worker) => worker.sourceApplicationId === application.id,
                );

                return (
                  <tr key={application.id} className="border-b border-line/60 align-top hover:bg-surface-2">
                    <td className="px-2 py-3 font-medium">{application.fullName}</td>
                    <td className="px-2 py-3 text-muted">
                      <div>{application.email}</div>
                      <div>{application.phone}</div>
                    </td>
                    <td className="px-2 py-3">{formatEmploymentType(application.employmentType)}</td>
                    <td className="max-w-xs px-2 py-3 text-muted">{application.experienceSummary}</td>
                    <td className="px-2 py-3">
                      <button
                        onClick={() => void createWorker(application.id)}
                        disabled={alreadyWorker || creatingFromApplicationId === application.id}
                        className="rounded-lg border border-line bg-white px-3 py-1.5 text-xs font-medium transition hover:bg-surface-2 disabled:opacity-50"
                      >
                        {alreadyWorker
                          ? "Vec aktiviran"
                          : creatingFromApplicationId === application.id
                            ? "Kreiranje..."
                            : "Dodaj u predavace"}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {applications.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-line px-4 py-10 text-center text-sm text-muted">
              Jos nema prijava za posao.
            </div>
          ) : null}
        </div>
      </section>

      <section className="rounded-3xl border border-line bg-surface p-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-2xl font-semibold">Aktivni predavaci i dosije</h2>
            <p className="mt-1 text-sm text-muted">
              Uredite dosije, unesite dostupnost, pa dodelite predavaca samo kompatibilnim terminima.
            </p>
          </div>
          <div className="rounded-2xl bg-surface-2 px-4 py-3 text-sm text-muted">
            Aktivni: <span className="font-semibold text-foreground">{activeWorkersCount}</span> / {workers.length}
          </div>
        </div>

        <div className="mt-6 space-y-4">
          {workers.map((worker) => {
            const draft = workerDrafts[worker.id];
            if (!draft) return null;

            const assignedTerms = terms.filter((term) => term.assignedWorkerId === worker.id);
            const compatibleTerms = terms
              .filter((term) => isWorkerCompatible(draft, term))
              .sort((a, b) => Date.parse(`${a.date}T${a.startTime}:00`) - Date.parse(`${b.date}T${b.startTime}:00`));
            const compatibleClasses = classes.filter((cls) =>
              terms.some((term) => term.classId === cls.id && isWorkerCompatible(draft, term)),
            );

            return (
              <article key={worker.id} className="rounded-2xl border border-line bg-surface-2 p-4">
                <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                  <input
                    value={draft.fullName}
                    onChange={(e) =>
                      setWorkerDrafts((prev) => ({
                        ...prev,
                        [worker.id]: { ...prev[worker.id], fullName: e.target.value },
                      }))
                    }
                    className="rounded-xl border border-line bg-white px-3 py-2 text-sm"
                    placeholder="Ime i prezime"
                  />

                  <input
                    value={draft.email}
                    onChange={(e) =>
                      setWorkerDrafts((prev) => ({
                        ...prev,
                        [worker.id]: { ...prev[worker.id], email: e.target.value },
                      }))
                    }
                    className="rounded-xl border border-line bg-white px-3 py-2 text-sm"
                    placeholder="Email"
                  />

                  <input
                    value={draft.phone}
                    onChange={(e) =>
                      setWorkerDrafts((prev) => ({
                        ...prev,
                        [worker.id]: { ...prev[worker.id], phone: e.target.value },
                      }))
                    }
                    className="rounded-xl border border-line bg-white px-3 py-2 text-sm"
                    placeholder="Telefon"
                  />

                  <select
                    value={draft.employmentType}
                    onChange={(e) =>
                      setWorkerDrafts((prev) => ({
                        ...prev,
                        [worker.id]: {
                          ...prev[worker.id],
                          employmentType: e.target.value as WorkerProfile["employmentType"],
                        },
                      }))
                    }
                    className="rounded-xl border border-line bg-white px-3 py-2 text-sm"
                  >
                    <option value="part-time">Part-time</option>
                    <option value="full-time">Full-time</option>
                    <option value="both">Oba</option>
                  </select>

                  <select
                    value={draft.availabilitySource}
                    onChange={(e) =>
                      setWorkerDrafts((prev) => ({
                        ...prev,
                        [worker.id]: {
                          ...prev[worker.id],
                          availabilitySource: e.target.value as NonNullable<WorkerProfile["availabilitySource"]>,
                        },
                      }))
                    }
                    className="rounded-xl border border-line bg-white px-3 py-2 text-sm"
                  >
                    <option value="phone">Potvrdjeno telefonom</option>
                    <option value="email">Potvrdjeno email-om</option>
                    <option value="chat">Potvrdjeno porukom</option>
                    <option value="in-person">Potvrdjeno uzivo</option>
                    <option value="other">Drugo</option>
                  </select>

                  <input
                    type="date"
                    value={draft.availabilityConfirmedAt}
                    onChange={(e) =>
                      setWorkerDrafts((prev) => ({
                        ...prev,
                        [worker.id]: { ...prev[worker.id], availabilityConfirmedAt: e.target.value },
                      }))
                    }
                    className="rounded-xl border border-line bg-white px-3 py-2 text-sm"
                    title="Poslednja potvrda dostupnosti"
                  />

                  <label className="flex items-center gap-2 rounded-xl border border-line bg-white px-3 py-2 text-sm">
                    <input
                      type="checkbox"
                      checked={draft.active}
                      onChange={(e) =>
                        setWorkerDrafts((prev) => ({
                          ...prev,
                          [worker.id]: { ...prev[worker.id], active: e.target.checked },
                        }))
                      }
                      className="h-4 w-4"
                    />
                    Aktivan
                  </label>
                </div>

                <div className="mt-3 grid gap-3 md:grid-cols-2">
                  <textarea
                    value={draft.experienceSummary}
                    onChange={(e) =>
                      setWorkerDrafts((prev) => ({
                        ...prev,
                        [worker.id]: { ...prev[worker.id], experienceSummary: e.target.value },
                      }))
                    }
                    rows={3}
                    className="rounded-xl border border-line bg-white px-3 py-2 text-sm"
                    placeholder="Iskustvo"
                  />

                  <textarea
                    value={draft.notes}
                    onChange={(e) =>
                      setWorkerDrafts((prev) => ({
                        ...prev,
                        [worker.id]: { ...prev[worker.id], notes: e.target.value },
                      }))
                    }
                    rows={3}
                    className="rounded-xl border border-line bg-white px-3 py-2 text-sm"
                    placeholder="Interne napomene"
                  />
                </div>

                <div className="mt-4 rounded-xl border border-line bg-white p-3">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">Nedeljna dostupnost</p>
                  <div className="space-y-2">
                    {WEEK_DAYS.map((day) => {
                      const slot = draft.weeklyAvailability.find((item) => item.day === day.key);
                      const enabled = Boolean(slot);

                      return (
                        <div key={day.key} className="grid items-center gap-2 sm:grid-cols-[170px,1fr,1fr]">
                          <label className="flex items-center gap-2 text-sm">
                            <input
                              type="checkbox"
                              checked={enabled}
                              onChange={(e) =>
                                setWorkerDayAvailability(worker.id, day.key, e.target.checked)
                              }
                              className="h-4 w-4"
                            />
                            {day.label}
                          </label>
                          <input
                            type="time"
                            value={slot?.startTime ?? "09:00"}
                            disabled={!enabled}
                            onChange={(e) =>
                              setWorkerDayAvailability(worker.id, day.key, true, { startTime: e.target.value })
                            }
                            className="rounded-lg border border-line bg-white px-2 py-1 text-xs disabled:opacity-50"
                          />
                          <input
                            type="time"
                            value={slot?.endTime ?? "17:00"}
                            disabled={!enabled}
                            onChange={(e) =>
                              setWorkerDayAvailability(worker.id, day.key, true, { endTime: e.target.value })
                            }
                            className="rounded-lg border border-line bg-white px-2 py-1 text-xs disabled:opacity-50"
                          />
                        </div>
                      );
                    })}
                  </div>

                  <div className="mt-3">
                    <button
                      onClick={() => void saveWorker(worker.id)}
                      disabled={savingWorkerId === worker.id}
                      className="rounded-xl border border-line bg-white px-3 py-2 text-sm font-medium transition hover:bg-surface-2 disabled:opacity-50"
                    >
                      {savingWorkerId === worker.id ? "Cuvanje..." : "Snimi dosije"}
                    </button>
                  </div>
                </div>

                <div className="mt-4 rounded-xl border border-line bg-white p-3">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">
                    Dodela po terminu (samo kompatibilni termini)
                  </p>
                  <div className="flex flex-wrap items-center gap-2">
                    <select
                      value={termByWorker[worker.id] ?? ""}
                      onChange={(e) =>
                        setTermByWorker((prev) => ({ ...prev, [worker.id]: e.target.value }))
                      }
                      className="min-w-[300px] rounded-lg border border-line bg-white px-2 py-1.5 text-xs"
                    >
                      <option value="">Dodeli na termin...</option>
                      {compatibleTerms.map((term) => {
                        const cls = classById[term.classId];
                        return (
                          <option key={term.id} value={term.id}>
                            {cls?.title_sr ?? "Grupa"} | {term.title_sr} | {term.date} {term.startTime}
                          </option>
                        );
                      })}
                    </select>

                    <button
                      onClick={() => void assignToTerm(worker)}
                      disabled={assigningWorkerId === worker.id || !(termByWorker[worker.id] ?? "")}
                      className="rounded-lg bg-brand px-3 py-1.5 text-xs font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
                    >
                      {assigningWorkerId === worker.id ? "Dodela..." : "Dodeli + posalji ICS"}
                    </button>
                  </div>
                </div>

                <div className="mt-3 rounded-xl border border-line bg-white p-3">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">
                    Bulk dodela na celu grupu
                  </p>
                  <div className="flex flex-wrap items-center gap-2">
                    <select
                      value={classByWorker[worker.id] ?? ""}
                      onChange={(e) =>
                        setClassByWorker((prev) => ({ ...prev, [worker.id]: e.target.value }))
                      }
                      className="min-w-[280px] rounded-lg border border-line bg-white px-2 py-1.5 text-xs"
                    >
                      <option value="">Izaberi grupu...</option>
                      {compatibleClasses.map((cls) => (
                        <option key={cls.id} value={cls.id}>
                          {cls.title_sr}
                        </option>
                      ))}
                    </select>

                    <button
                      onClick={() => void bulkAssignToClass(worker)}
                      disabled={bulkAssigningWorkerId === worker.id || !(classByWorker[worker.id] ?? "")}
                      className="rounded-lg border border-brand/40 bg-brand/10 px-3 py-1.5 text-xs font-semibold text-brand transition hover:bg-brand/20 disabled:opacity-50"
                    >
                      {bulkAssigningWorkerId === worker.id ? "Dodela..." : "Dodeli na sve kompatibilne termine"}
                    </button>
                  </div>

                  <p className="mt-2 text-xs text-muted">
                    Trenutne dodele: {assignedTerms.length > 0
                      ? assignedTerms
                          .map((term) => `${classById[term.classId]?.title_sr ?? "Grupa"} - ${term.title_sr}`)
                          .join(", ")
                      : "Nema dodeljenih termina."}
                  </p>
                </div>
              </article>
            );
          })}

          {workers.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-line px-4 py-10 text-center text-sm text-muted">
              Jos nema aktivnih predavaca. Dodajte ih iz prijava iznad.
            </div>
          ) : null}
        </div>
      </section>
    </div>
  );
}
