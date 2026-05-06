"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { adminSignIn } from "@/lib/auth";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    try {
      setLoading(true);
      await adminSignIn(email, password);
      router.replace("/admin");
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : "Greska pri prijavi.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md items-center px-4">
      <form onSubmit={onSubmit} className="w-full rounded-3xl border border-line bg-surface p-6 shadow-[var(--shadow)]">
        <h1 className="text-3xl">Admin prijava</h1>
        <p className="mt-2 text-sm text-muted">Pristup je dozvoljen samo administratoru.</p>

        <label className="mt-6 block text-sm text-muted">
          Email
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full rounded-xl border border-line bg-white px-3 py-2 outline-none focus:border-brand"
            required
          />
        </label>

        <label className="mt-4 block text-sm text-muted">
          Lozinka
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 w-full rounded-xl border border-line bg-white px-3 py-2 outline-none focus:border-brand"
            required
          />
        </label>

        {error ? <p className="mt-4 text-sm text-red-600">{error}</p> : null}

        <button
          type="submit"
          disabled={loading}
          className="mt-6 w-full rounded-full bg-brand py-3 text-sm font-semibold text-white transition hover:bg-brand-2 disabled:opacity-70"
        >
          {loading ? "Prijava..." : "Prijavi se"}
        </button>
      </form>
    </main>
  );
}
