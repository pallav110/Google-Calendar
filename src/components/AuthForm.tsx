"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signIn } from "next-auth/react";

export default function AuthForm({
  mode,
  googleEnabled,
}: {
  mode: "login" | "register";
  googleEnabled: boolean;
}) {
  const router = useRouter();
  const isLogin = mode === "login";
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      if (!isLogin) {
        const res = await fetch("/api/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, email, password }),
        });
        if (!res.ok) {
          const b = await res.json().catch(() => ({}));
          throw new Error(b.error ?? "Could not create account");
        }
      }
      const res = await signIn("credentials", { email, password, redirect: false });
      if (res?.error) throw new Error("Invalid email or password");
      router.push("/");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50 px-4 dark:bg-neutral-950">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-3">
          <CalendarLogo />
          <h1 className="text-2xl font-normal text-neutral-800 dark:text-neutral-100">
            {isLogin ? "Sign in" : "Create your account"}
          </h1>
          <p className="text-sm text-neutral-500">to continue to Calendar</p>
        </div>

        <form
          onSubmit={onSubmit}
          className="space-y-4 rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900"
        >
          {!isLogin && (
            <Field label="Name" value={name} onChange={setName} type="text" autoFocus />
          )}
          <Field label="Email" value={email} onChange={setEmail} type="email" autoFocus={isLogin} />
          <Field label="Password" value={password} onChange={setPassword} type="password" />

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-full bg-blue-600 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700 disabled:opacity-60"
          >
            {busy ? "Please wait…" : isLogin ? "Sign in" : "Sign up"}
          </button>

          {googleEnabled && (
            <>
              <div className="flex items-center gap-3 py-1 text-xs text-neutral-400">
                <span className="h-px flex-1 bg-neutral-200 dark:bg-neutral-700" /> or{" "}
                <span className="h-px flex-1 bg-neutral-200 dark:bg-neutral-700" />
              </div>
              <button
                type="button"
                onClick={() => signIn("google", { callbackUrl: "/" })}
                className="flex w-full items-center justify-center gap-2 rounded-full border border-neutral-300 py-2.5 text-sm font-medium text-neutral-700 transition hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-200 dark:hover:bg-neutral-800"
              >
                <GoogleIcon /> Continue with Google
              </button>
            </>
          )}
        </form>

        <p className="mt-6 text-center text-sm text-neutral-500">
          {isLogin ? "No account? " : "Already have one? "}
          <Link href={isLogin ? "/register" : "/login"} className="text-blue-600 hover:underline">
            {isLogin ? "Create one" : "Sign in"}
          </Link>
        </p>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type,
  autoFocus,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type: string;
  autoFocus?: boolean;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-neutral-500">{label}</span>
      <input
        type={type}
        value={value}
        autoFocus={autoFocus}
        onChange={(e) => onChange(e.target.value)}
        required
        className="w-full rounded-lg border border-neutral-300 bg-transparent px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-neutral-700 dark:focus:ring-blue-900/40"
      />
    </label>
  );
}

function CalendarLogo() {
  return (
    <div className="grid h-12 w-12 place-items-center rounded-xl bg-blue-600 text-white shadow-md">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="4" width="18" height="18" rx="2" />
        <path d="M3 9h18M8 2v4M16 2v4" />
      </svg>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
    </svg>
  );
}
