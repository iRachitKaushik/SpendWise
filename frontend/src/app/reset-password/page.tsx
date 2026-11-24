"use client";

import { useState, useEffect } from "react";
import type { FormEvent } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { LockKeyhole, Eye, EyeOff } from "lucide-react";

export default function ResetPassword() {
  const router = useRouter();

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [visible, setVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);
  const [updated, setUpdated] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    supabase.auth.getUser().then(({ data, error }) => {
      if (error || !data.user) {
        router.replace("/forgot-password?error=invalid");
      } else {
        setReady(true);
      }
    });
  }, [router]);

  async function reset(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!ready || loading || updated) return;

    setError("");

    if (password.length < 8) {
      setError("Use at least 8 characters.");
      return;
    }

    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password
      });

      if (error) throw error;

      setUpdated(true);
      setPassword("");
      setConfirm("");

      const { error: logoutError } = await supabase.auth.signOut({
        scope: "global"
      });

      if (logoutError) {
        setError("Password updated, but sign out failed. Sign out manually.");
        return;
      }

      window.location.replace("/login");

    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not update password."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#F7F6F2] p-5 text-[#252823]">

      <section className="w-full max-w-md rounded-[30px] border border-[#DCE5D7] bg-white p-8 shadow-sm sm:p-10">

        <div className="flex items-center gap-3">
          <img src="/icon.svg" alt="" className="h-10 w-10" />
          <h2 className="text-2xl">SpendWise.</h2>
        </div>

        <div className="mb-5 mt-10 grid h-14 w-14 place-items-center rounded-2xl bg-[#E4EDE0] text-[#526B4B]">
          <LockKeyhole size={25} />
        </div>

        <h1 className="text-4xl">Create a new password.</h1>

        <p className="mt-4 text-sm text-[#687363]">
          Choose a strong password with at least 8 characters.
        </p>

        <form onSubmit={reset} className="mt-8 space-y-5">

          <label className="block text-sm font-semibold">
            New password

            <input
              required
              minLength={8}
              disabled={!ready || loading || updated}
              type={visible ? "text" : "password"}
              autoComplete="new-password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="mt-2 w-full rounded-2xl border border-[#DCE5D7] bg-[#FAFBF9] p-4"
            />

          </label>

          <label className="block text-sm font-semibold">
            Confirm password

            <input
              required
              disabled={!ready || loading || updated}
              type={visible ? "text" : "password"}
              autoComplete="new-password"
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              className="mt-2 w-full rounded-2xl border border-[#DCE5D7] bg-[#FAFBF9] p-4"
            />

          </label>

          <button
            type="button"
            onClick={() => setVisible(!visible)}
            className="flex items-center gap-2 text-xs text-[#526B4B]"
          >
            {visible ? <EyeOff size={17} /> : <Eye size={17} />}
            {visible ? "Hide passwords" : "Show passwords"}
          </button>

          {error && (
            <p role="alert" className="text-sm text-red-600">
              {error}
            </p>
          )}

          <button
            disabled={!ready || loading || updated}
            className="w-full rounded-2xl bg-[#526B4B] py-4 text-sm font-semibold text-white disabled:opacity-50"
          >
            {updated ? "Password updated" : loading ? "Updating..." : "Reset password"}
          </button>

        </form>

      </section>
    </main>
  );
}
