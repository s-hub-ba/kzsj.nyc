"use client";

import { FormEvent, useState } from "react";
import { JobApplication, JobApplicationInput, EmploymentType } from "@/types/models";
import { submitJobApplication } from "@/lib/firestore";

interface AddJobApplicationFormProps {
  onApplicationAdded: (application: JobApplication) => void;
}

export function AddJobApplicationForm({ onApplicationAdded }: AddJobApplicationFormProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<JobApplicationInput>({
    fullName: "",
    email: "",
    phone: "",
    employmentType: "part-time",
    experienceSummary: "",
    message: "",
    preferredLanguage: "sr",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const application = await submitJobApplication(formData);
      onApplicationAdded(application);
      
      // Reset form
      setFormData({
        fullName: "",
        email: "",
        phone: "",
        employmentType: "part-time",
        experienceSummary: "",
        message: "",
        preferredLanguage: "sr",
      });
      
      setIsExpanded(false);
      alert("Prijava je uspešno dodana!");
    } catch (error) {
      alert(error instanceof Error ? error.message : "Greška pri dodavanju prijave.");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isExpanded) {
    return (
      <button
        onClick={() => setIsExpanded(true)}
        className="rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90"
      >
        + Dodaj novu prijavu ručno
      </button>
    );
  }

  return (
    <section className="rounded-3xl border border-line bg-surface-2 p-6">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold">Ručan unos nove prijave za posao</h3>
        <button
          onClick={() => setIsExpanded(false)}
          className="text-sm text-muted transition hover:text-foreground"
        >
          ✕
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted">
              Ime i prezime*
            </label>
            <input
              type="text"
              name="fullName"
              value={formData.fullName}
              onChange={handleChange}
              required
              className="w-full rounded-lg border border-line bg-white px-3 py-2 text-sm"
              placeholder="Ime i prezime"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted">
              Email*
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              className="w-full rounded-lg border border-line bg-white px-3 py-2 text-sm"
              placeholder="email@example.com"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted">
              Telefon*
            </label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              required
              className="w-full rounded-lg border border-line bg-white px-3 py-2 text-sm"
              placeholder="+1 555 1234"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted">
              Tip angažmana*
            </label>
            <select
              name="employmentType"
              value={formData.employmentType}
              onChange={handleChange}
              className="w-full rounded-lg border border-line bg-white px-3 py-2 text-sm"
            >
              <option value="full-time">Stalno</option>
              <option value="part-time">Povremeno</option>
              <option value="both">Oba se razmatraju</option>
            </select>
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted">
              Jezik komunikacije
            </label>
            <select
              name="preferredLanguage"
              value={formData.preferredLanguage}
              onChange={handleChange}
              className="w-full rounded-lg border border-line bg-white px-3 py-2 text-sm"
            >
              <option value="sr">Srpski</option>
              <option value="en">Engleski</option>
            </select>
          </div>
        </div>

        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted">
            Iskustvo u nastavi*
          </label>
          <textarea
            name="experienceSummary"
            value={formData.experienceSummary}
            onChange={handleChange}
            required
            rows={4}
            className="w-full rounded-lg border border-line bg-white px-3 py-2 text-sm"
            placeholder="Opišite vaše iskustvo u nastavi..."
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted">
            Dodatna poruka
          </label>
          <textarea
            name="message"
            value={formData.message || ""}
            onChange={handleChange}
            rows={3}
            className="w-full rounded-lg border border-line bg-white px-3 py-2 text-sm"
            placeholder="Opciono"
          />
        </div>

        <div className="flex gap-2">
          <button
            type="submit"
            disabled={isLoading}
            className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
          >
            {isLoading ? "Unos u toku..." : "Dodaj prijavu"}
          </button>
          <button
            type="button"
            onClick={() => setIsExpanded(false)}
            className="rounded-lg border border-line bg-white px-4 py-2 text-sm font-medium transition hover:bg-surface-2"
          >
            Otkaži
          </button>
        </div>
      </form>
    </section>
  );
}
