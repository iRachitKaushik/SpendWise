
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Eye, EyeOff, Wallet } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();

  const [isSignup, setIsSignup] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function handleAuth(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    try {
      if (isSignup) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
        });

        if (error) throw error;

        if (data.session) {
          router.push("/");
          router.refresh();
        } else {
          setMessage("Account created. Check your email to verify your account.");
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;

        router.push("/");
        router.refresh();
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Something went wrong."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-[#f8f7fc] px-5 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-9">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#7653d6] text-white shadow-lg shadow-purple-200">
            <Wallet size={27} />
          </div>

          <h1 className="text-3xl font-bold tracking-tight text-[#29243d]">
            SpendWise
          </h1>
          <p className="mt-2 text-sm text-[#89849a]">
            Your money. Your clarity. Your control.
          </p>
        </div>

        <div className="rounded-[28px] border border-[#eeeaf5] bg-white p-8 shadow-[0_20px_70px_rgba(65,45,110,0.08)] sm:p-9">
          <h2 className="text-2xl font-bold text-[#29243d]">
            {isSignup ? "Create your account" : "Welcome back"}
          </h2>

          <p className="mt-2 text-sm text-[#89849a]">
            {isSignup
              ? "Start managing your finances smarter."
              : "Sign in to continue to your dashboard."}
          </p>

          <form onSubmit={handleAuth} className="mt-8 space-y-5">
            <div>
              <label className="mb-2 block text-sm font-semibold text-[#49435d]">
                Email address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full rounded-xl border border-[#e9e5f0] bg-[#fcfbfe] px-4 py-3.5 text-sm text-[#29243d] outline-none transition focus:border-[#9274e5] focus:ring-4 focus:ring-purple-100"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-[#49435d]">
                Password
              </label>

              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full rounded-xl border border-[#e9e5f0] bg-[#fcfbfe] px-4 py-3.5 pr-12 text-sm text-[#29243d] outline-none transition focus:border-[#9274e5] focus:ring-4 focus:ring-purple-100"
                />

                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[#9690a6]"
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? <EyeOff size={19} /> : <Eye size={19} />}
                </button>
              </div>
            </div>

            {error && (
              <p className="rounded-xl bg-red-50 p-3 text-sm text-red-600">
                {error}
              </p>
            )}

            {message && (
              <p className="rounded-xl bg-green-50 p-3 text-sm text-green-700">
                {message}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-[#7653d6] py-4 text-sm font-semibold text-white shadow-lg shadow-purple-200 transition hover:bg-[#6543c3] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading
                ? "Please wait..."
                : isSignup
                  ? "Create account"
                  : "Sign in"}
            </button>
          </form>

          <div className="mt-7 text-center text-sm text-[#89849a]">
            {isSignup
              ? "Already have an account?"
              : "Don't have an account?"}

            <button
              type="button"
              onClick={() => {
                setIsSignup(!isSignup);
                setError("");
                setMessage("");
              }}
              className="ml-2 font-semibold text-[#7653d6] hover:underline"
            >
              {isSignup ? "Sign in" : "Sign up"}
            </button>
          </div>
        </div>

        <p className="mt-7 text-center text-xs text-[#aaa5b7]">
          Secure authentication powered by Supabase
        </p>
      </div>
    </main>
  );
}
