"use client";

import { useState, useEffect } from "react";
import type { FormEvent } from "react";
import Link from "next/link";
import { Mail, ArrowLeft, LockKeyhole } from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (new URLSearchParams(window.location.search).has("error")) {
      setError("Reset link expired or invalid. Request a new link.");
    }
  }, []);

  async function sendReset(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (loading) return;

    setLoading(true);
    setError("");

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(
        email.trim(),
        {
          redirectTo: `${window.location.origin}/auth/reset-callback`
        }
      );

      if (error) throw error;

      setSent(true);
    } catch {
      setError("Could not send reset link. Please try again later.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#F7F6F2] p-5 text-[#252823]">

      <section className="w-full max-w-md rounded-[30px] border border-[#DCE5D7] bg-white p-8 shadow-sm sm:p-10">

        <Link href="/" className="flex items-center gap-3">
          <img src="/icon.svg" alt="" className="h-10 w-10" />
          <h2 className="text-2xl">SpendWise.</h2>
        </Link>

        <div className="mb-5 mt-10 grid h-14 w-14 place-items-center rounded-2xl bg-[#E4EDE0] text-[#526B4B]">
          {sent ? <Mail size={25} /> : <LockKeyhole size={25} />}
        </div>

        <h1 className="text-4xl">
          {sent ? "Check your inbox." : "Forgot your password?"}
        </h1>

        <p className="mt-4 text-sm leading-relaxed text-[#687363]">
          {sent
            ? "If an account exists for this email, a password reset link will be sent."
            : "Enter your email address to receive a password reset link."}
        </p>

        {!sent && (
          <form onSubmit={sendReset} className="mt-8 space-y-5">

            <label className="block text-sm font-semibold">
              Email address
              <input
                required
                type="email"
                autoComplete="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="mt-2 w-full rounded-2xl border border-[#DCE5D7] bg-[#FAFBF9] p-4"
              />
            </label>

            {error && (
              <p role="alert" className="text-sm text-red-600">
                {error}
              </p>
            )}

            <button
              disabled={loading}
              className="w-full rounded-2xl bg-[#526B4B] py-4 text-sm font-semibold text-white disabled:opacity-50"
            >
              {loading ? "Sending..." : "Send reset link"}
            </button>

          </form>
        )}

        {sent && (
          <p className="mt-5 text-xs leading-relaxed text-[#687363]">
            Check your spam folder too. Open the link using the same browser where you requested it.
          </p>
        )}

        <Link href="/login" className="mt-8 flex items-center justify-center gap-2 text-sm text-[#526B4B]">
          <ArrowLeft size={16} /> Back to sign in
        </Link>

      </section>
    </main>
  );
}
