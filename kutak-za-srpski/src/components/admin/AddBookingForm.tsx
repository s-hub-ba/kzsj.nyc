"use client";

import { FormEvent, useState } from "react";
import { Booking, BookingInput, ClassType, SchoolClass, Term } from "@/types/models";
import { createBooking } from "@/lib/firestore";

interface AddBookingFormProps {
  classes: SchoolClass[];
  terms: Term[];
  onBookingAdded: (booking: Booking) => void;
}

export function AddBookingForm({ classes, terms, onBookingAdded }: AddBookingFormProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<BookingInput>({
    parentName: "",
    parentEmail: "",
    parentPhone: "",
    childName: "",
    childAge: "",
    selectedClassId: "",
    selectedTermId: "",
    bookingType: "semester",
    preferredLanguage: "sr",
    homeLanguages: "",
    serbianProficiency: "understandsOnly",
    message: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const booking = await createBooking(formData);
      onBookingAdded(booking);
      
      // Reset form
      setFormData({
        parentName: "",
        parentEmail: "",
        parentPhone: "",
        childName: "",
        childAge: "",
        selectedClassId: "",
        selectedTermId: "",
        bookingType: "semester",
        preferredLanguage: "sr",
        homeLanguages: "",
        serbianProficiency: "understandsOnly",
        message: "",
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
        + Dodaj novog učenika ručno
      </button>
    );
  }

  return (
    <section className="rounded-3xl border border-line bg-surface-2 p-6">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold">Ručan unos nove prijave</h3>
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
              Ime roditelja*
            </label>
            <input
              type="text"
              name="parentName"
              value={formData.parentName}
              onChange={handleChange}
              required
              className="w-full rounded-lg border border-line bg-white px-3 py-2 text-sm"
              placeholder="Ime i prezime"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted">
              Email roditelja*
            </label>
            <input
              type="email"
              name="parentEmail"
              value={formData.parentEmail}
              onChange={handleChange}
              required
              className="w-full rounded-lg border border-line bg-white px-3 py-2 text-sm"
              placeholder="email@example.com"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted">
              Telefon roditelja*
            </label>
            <input
              type="tel"
              name="parentPhone"
              value={formData.parentPhone}
              onChange={handleChange}
              required
              className="w-full rounded-lg border border-line bg-white px-3 py-2 text-sm"
              placeholder="+1 555 1234"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted">
              Ime deteta*
            </label>
            <input
              type="text"
              name="childName"
              value={formData.childName}
              onChange={handleChange}
              required
              className="w-full rounded-lg border border-line bg-white px-3 py-2 text-sm"
              placeholder="Ime"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted">
              Uzrast deteta*
            </label>
            <input
              type="text"
              name="childAge"
              value={formData.childAge}
              onChange={handleChange}
              required
              className="w-full rounded-lg border border-line bg-white px-3 py-2 text-sm"
              placeholder="npr. 4.5"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted">
              Tip prijave*
            </label>
            <select
              name="bookingType"
              value={formData.bookingType}
              onChange={handleChange}
              className="w-full rounded-lg border border-line bg-white px-3 py-2 text-sm"
            >
              <option value="semester">Semestar</option>
              <option value="single">Pojedinačni čas</option>
            </select>
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted">
              Program*
            </label>
            <select
              name="selectedClassId"
              value={formData.selectedClassId}
              onChange={handleChange}
              required
              className="w-full rounded-lg border border-line bg-white px-3 py-2 text-sm"
            >
              <option value="">Izaberi program...</option>
              {classes.map((cls) => (
                <option key={cls.id} value={cls.id}>
                  {cls.title_sr}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted">
              Termin*
            </label>
            <select
              name="selectedTermId"
              value={formData.selectedTermId}
              onChange={handleChange}
              required
              className="w-full rounded-lg border border-line bg-white px-3 py-2 text-sm"
            >
              <option value="">Izaberi termin...</option>
              {terms.map((term) => (
                <option key={term.id} value={term.id}>
                  {term.title_sr} - {term.date}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted">
              Nivo srpskog*
            </label>
            <select
              name="serbianProficiency"
              value={formData.serbianProficiency}
              onChange={handleChange}
              className="w-full rounded-lg border border-line bg-white px-3 py-2 text-sm"
            >
              <option value="fluent">Priča tečno srpski</option>
              <option value="understandsOnly">Razume srpski, odgovara na engleskom</option>
              <option value="basicUnderstanding">Razume osnove srpskog</option>
              <option value="noUnderstanding">Ne razume srpski</option>
            </select>
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted">
              Jezici u kući
            </label>
            <input
              type="text"
              name="homeLanguages"
              value={formData.homeLanguages || ""}
              onChange={handleChange}
              className="w-full rounded-lg border border-line bg-white px-3 py-2 text-sm"
              placeholder="srpski, engleski"
            />
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
            Poruka / Dodatne napomene
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
