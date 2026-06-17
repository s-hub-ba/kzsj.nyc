"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { adminSignIn } from "@/lib/auth";
import { FloatingInput } from "@/components/FloatingInput";

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

        <FloatingInput
          type="email"
          label="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          containerClassName="mt-6"
          className="bg-white"
        />

        <FloatingInput
          type="password"
          label="Lozinka"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          containerClassName="mt-4"
          className="bg-white"
        />

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
