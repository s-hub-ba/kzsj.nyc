"use client";

import { useEffect, useMemo, useState } from "react";
import { JobApplication, SchoolClass, Term, WorkerProfile, WorkerShiftOffer } from "@/types/models";
import { createWorkerFromApplication, createWorkerOffer, saveWorkerProfile } from "@/lib/firestore";

interface AdminJobApplicationsProps {
  applications: JobApplication[];
  workers: WorkerProfile[];
  offers: WorkerShiftOffer[];
  classes: SchoolClass[];
  terms: Term[];
  currentAdminEmail: string;
  onWorkersUpdate: (workers: WorkerProfile[]) => void;
  onOffersUpdate: (offers: WorkerShiftOffer[]) => void;
}

type WorkerDraft = {
  fullName: string;
  email: string;
  phone: string;
  employmentType: WorkerProfile["employmentType"];
  experienceSummary: string;
  notes: string;
  active: boolean;
};

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

function formatOfferStatus(status: WorkerShiftOffer["status"]) {
  if (status === "pending") return "Na cekanju";
  if (status === "accepted") return "Prihvaceno";
  if (status === "declined") return "Odbijeno";
  return "Isteklo";
}

export function AdminJobApplications({
  applications,
  workers,
  offers,
  classes,
  terms,
  currentAdminEmail,
  onWorkersUpdate,
  onOffersUpdate,
}: AdminJobApplicationsProps) {
  const [creatingFromApplicationId, setCreatingFromApplicationId] = useState<string | null>(null);
  const [savingWorkerId, setSavingWorkerId] = useState<string | null>(null);
  const [offeringWorkerId, setOfferingWorkerId] = useState<string | null>(null);
  const [workerDrafts, setWorkerDrafts] = useState<Record<string, WorkerDraft>>({});
  const [termByWorker, setTermByWorker] = useState<Record<string, string>>({});
  const [classByWorker, setClassByWorker] = useState<Record<string, string>>({});
  const [offerStatusFilter, setOfferStatusFilter] = useState<"all" | "pending" | "accepted" | "declined">("all");

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
          },
        ]),
      ),
    );
  }, [workers]);

  const activeWorkersCount = workers.filter((worker) => worker.active).length;
  const filteredOffers = offers.filter((offer) =>
    offerStatusFilter === "all" ? true : offer.status === offerStatusFilter,
  );

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

  const saveWorker = async (workerId: string) => {
    const draft = workerDrafts[workerId];
    if (!draft) return;

    setSavingWorkerId(workerId);
    try {
      const saved = await saveWorkerProfile(workerId, {
        ...draft,
      });
      onWorkersUpdate(workers.map((worker) => (worker.id === saved.id ? saved : worker)));
    } catch (error) {
      alert(error instanceof Error ? error.message : "Cuvanje dosijea nije uspelo.");
    } finally {
      setSavingWorkerId(null);
    }
  };

  const offerTerm = async (worker: WorkerProfile) => {
    const termId = termByWorker[worker.id];
    if (!termId) return;

    setOfferingWorkerId(worker.id);
    try {
      const response = await createWorkerOffer(worker.id, { scope: "term", termId });
      onOffersUpdate([response.offer, ...offers]);
      if (!response.emailQueued && response.emailError) {
        alert(`Ponuda je snimljena, ali email nije poslat: ${response.emailError}`);
      }
    } catch (error) {
      alert(error instanceof Error ? error.message : "Slanje ponude nije uspelo.");
    } finally {
      setOfferingWorkerId(null);
    }
  };

  const offerClass = async (worker: WorkerProfile) => {
    const classId = classByWorker[worker.id];
    if (!classId) return;

    setOfferingWorkerId(worker.id);
    try {
      const response = await createWorkerOffer(worker.id, { scope: "class", classId });
      onOffersUpdate([response.offer, ...offers]);
      if (!response.emailQueued && response.emailError) {
        alert(`Ponuda je snimljena, ali email nije poslat: ${response.emailError}`);
      }
    } catch (error) {
      alert(error instanceof Error ? error.message : "Slanje ponude nije uspelo.");
    } finally {
      setOfferingWorkerId(null);
    }
  };

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-line bg-surface p-6">
        <h2 className="text-2xl font-semibold">Ponude smena i grupa</h2>
        <p className="mt-2 text-sm text-muted">
          Admin salje ponudu odabranom predavacu email-om. Predavac klikom prihvata ili odbija ponudu, a status se belezi automatski.
        </p>
        <p className="mt-2 text-xs text-muted">Trenutni admin: {currentAdminEmail}</p>
      </section>

      <section className="rounded-3xl border border-line bg-surface p-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-2xl font-semibold">Prijave za posao</h2>
            <p className="mt-1 text-sm text-muted">
              Iz prijava direktno kreirajte aktivne predavace koje kasnije dobijaju ponude za smene ili grupe.
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
              Uredite dosije pa posaljite ponudu za pojedinacnu smenu ili celu grupu.
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

            const workerOffers = offers.filter((offer) => offer.workerId === worker.id).slice(0, 6);

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

                <div className="mt-3">
                  <button
                    onClick={() => void saveWorker(worker.id)}
                    disabled={savingWorkerId === worker.id}
                    className="rounded-xl border border-line bg-white px-3 py-2 text-sm font-medium transition hover:bg-surface-2 disabled:opacity-50"
                  >
                    {savingWorkerId === worker.id ? "Cuvanje..." : "Snimi dosije"}
                  </button>
                </div>

                <div className="mt-4 rounded-xl border border-line bg-white p-3">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">Ponuda smene</p>
                  <div className="flex flex-wrap items-center gap-2">
                    <select
                      value={termByWorker[worker.id] ?? ""}
                      onChange={(e) =>
                        setTermByWorker((prev) => ({ ...prev, [worker.id]: e.target.value }))
                      }
                      className="min-w-[300px] rounded-lg border border-line bg-white px-2 py-1.5 text-xs"
                    >
                      <option value="">Izaberi termin...</option>
                      {terms.map((term) => {
                        const cls = classById[term.classId];
                        return (
                          <option key={term.id} value={term.id}>
                            {cls?.title_sr ?? "Grupa"} | {term.title_sr} | {term.date} {term.startTime}
                          </option>
                        );
                      })}
                    </select>

                    <button
                      onClick={() => void offerTerm(worker)}
                      disabled={offeringWorkerId === worker.id || !(termByWorker[worker.id] ?? "")}
                      className="rounded-lg bg-brand px-3 py-1.5 text-xs font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
                    >
                      {offeringWorkerId === worker.id ? "Slanje..." : "Posalji ponudu smene"}
                    </button>
                  </div>
                </div>

                <div className="mt-3 rounded-xl border border-line bg-white p-3">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">Ponuda grupe</p>
                  <div className="flex flex-wrap items-center gap-2">
                    <select
                      value={classByWorker[worker.id] ?? ""}
                      onChange={(e) =>
                        setClassByWorker((prev) => ({ ...prev, [worker.id]: e.target.value }))
                      }
                      className="min-w-[280px] rounded-lg border border-line bg-white px-2 py-1.5 text-xs"
                    >
                      <option value="">Izaberi grupu...</option>
                      {classes.map((cls) => (
                        <option key={cls.id} value={cls.id}>
                          {cls.title_sr}
                        </option>
                      ))}
                    </select>

                    <button
                      onClick={() => void offerClass(worker)}
                      disabled={offeringWorkerId === worker.id || !(classByWorker[worker.id] ?? "")}
                      className="rounded-lg border border-brand/40 bg-brand/10 px-3 py-1.5 text-xs font-semibold text-brand transition hover:bg-brand/20 disabled:opacity-50"
                    >
                      {offeringWorkerId === worker.id ? "Slanje..." : "Posalji ponudu grupe"}
                    </button>
                  </div>
                </div>

                <div className="mt-3 rounded-xl border border-line bg-white p-3">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">Poslednje ponude</p>
                  {workerOffers.length ? (
                    <ul className="space-y-1 text-xs text-muted">
                      {workerOffers.map((offer) => (
                        <li key={offer.id}>
                          {offer.scope === "term"
                            ? `Smena: ${offer.termTitleSr ?? offer.termId}`
                            : `Grupa: ${offer.classTitleSr ?? offer.classId}`}
                          {" · "}
                          <span className="font-semibold text-foreground">{formatOfferStatus(offer.status)}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-xs text-muted">Nema poslatih ponuda.</p>
                  )}
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

      <section className="rounded-3xl border border-line bg-surface p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-2xl font-semibold">Sve ponude</h2>
          <div className="flex flex-wrap gap-2">
            {[
              { id: "all", label: "Sve" },
              { id: "pending", label: "Na cekanju" },
              { id: "accepted", label: "Prihvaceno" },
              { id: "declined", label: "Odbijeno" },
            ].map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() =>
                  setOfferStatusFilter(item.id as "all" | "pending" | "accepted" | "declined")
                }
                className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${
                  offerStatusFilter === item.id
                    ? "border-brand bg-brand/10 text-brand"
                    : "border-line bg-white text-muted hover:bg-surface-2"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead>
              <tr className="border-b border-line text-muted">
                <th className="px-2 py-3">Predavac</th>
                <th className="px-2 py-3">Tip</th>
                <th className="px-2 py-3">Ponuda</th>
                <th className="px-2 py-3">Status</th>
                <th className="px-2 py-3">Poslato</th>
              </tr>
            </thead>
            <tbody>
              {filteredOffers.slice(0, 30).map((offer) => (
                <tr key={offer.id} className="border-b border-line/60 hover:bg-surface-2">
                  <td className="px-2 py-3 font-medium">{offer.workerName}</td>
                  <td className="px-2 py-3">{offer.scope === "term" ? "Smena" : "Grupa"}</td>
                  <td className="px-2 py-3 text-muted">
                    {offer.scope === "term"
                      ? `${offer.classTitleSr ?? offer.classId} - ${offer.termTitleSr ?? offer.termId}`
                      : offer.classTitleSr ?? offer.classId}
                  </td>
                  <td className="px-2 py-3">
                    <span className="font-semibold text-foreground">{formatOfferStatus(offer.status)}</span>
                  </td>
                  <td className="px-2 py-3 text-muted">
                    {offer.offeredAt ? new Date(offer.offeredAt).toLocaleString("sr-RS") : "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {offers.length === 0 ? <p className="py-4 text-sm text-muted">Jos nema ponuda.</p> : null}
          {offers.length > 0 && filteredOffers.length === 0 ? (
            <p className="py-4 text-sm text-muted">Nema ponuda za izabrani filter.</p>
          ) : null}
        </div>
      </section>
    </div>
  );
}
