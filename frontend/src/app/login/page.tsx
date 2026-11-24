
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Eye, EyeOff } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();

  const [isSignup, setIsSignup] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
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
          options: {
            data: { full_name: fullName.trim() }
          },
          email,
          password,
        });

        if (error) throw error;

        if (data.session) {
          router.push("/dashboard");
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

        router.push("/dashboard");
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
    <main className="min-h-screen bg-[#F7F6F2] p-4 text-[#252823] sm:p-6">

      <div className="mx-auto grid min-h-[calc(100vh-48px)] max-w-[1500px] overflow-hidden rounded-[32px] border border-[#E0E5DA] bg-white lg:grid-cols-2">

        <section className="relative hidden flex-col justify-between overflow-hidden rounded-[30px] bg-[#526B4B] p-12 text-white lg:flex xl:p-16">

          <div className="absolute -right-40 -top-40 h-[550px] w-[550px] rounded-full border border-white/10" />
          <div className="absolute -right-24 -top-24 h-[420px] w-[420px] rounded-full border border-white/10" />

          <a href="/" className="relative flex items-center gap-3">
            <img src="/icon.svg" alt="" className="h-12 w-12 rounded-2xl border border-white/20" />
            <h2 className="text-3xl">SpendWise.</h2>
          </a>

          <div className="relative py-16">

            <p className="mb-8 text-[11px] font-semibold tracking-[0.24em] text-[#DCE5D7]">
              A BETTER RELATIONSHIP WITH MONEY
            </p>

            <h1 className="text-5xl leading-[1.15] xl:text-7xl">
              A little more clarity.
              <span className="mt-4 block italic text-[#BBCBB4]">
                A lot more confidence.
              </span>
            </h1>

            <p className="mt-8 max-w-sm text-base leading-relaxed text-[#E4EDE0]">
              Make thoughtful decisions, understand your spending
              and build better financial habits.
            </p>

            <svg viewBox="0 0 500 100" className="mt-12 w-full max-w-md" aria-hidden="true">
              <path
                d="M5 85 C45 85 55 65 90 68 S150 80 190 48 S250 62 290 32 S350 45 390 20 S450 25 490 8"
                fill="none"
                stroke="#DCE5D7"
                strokeWidth="2"
                strokeLinecap="round"
              />
              <circle cx="490" cy="8" r="4" fill="#DCE5D7" />
            </svg>

          </div>

          <p className="text-xs tracking-[0.18em] text-[#DCE5D7]">
            MONEY, MADE CLEAR.
          </p>

        </section>

        <section className="flex flex-col px-6 py-8 sm:px-12 lg:px-16">

          <a href="/" className="w-fit text-sm font-medium text-[#687363] transition hover:text-[#40583B]">
            ← Back to home
          </a>

          <div className="mx-auto flex w-full max-w-[400px] flex-1 flex-col justify-center py-12">

            <div className="mb-8 lg:hidden">
              <img src="/icon.svg" alt="SpendWise" className="mb-4 h-14 w-14" />
              <h2 className="text-2xl">SpendWise.</h2>
            </div>

            <p className="mb-4 text-[10px] font-bold tracking-[0.22em] text-[#526B4B]">
              YOUR FINANCIAL SPACE
            </p>

            <h1 className="text-4xl leading-tight sm:text-5xl">
              {isSignup ? "Begin your journey." : "Welcome back."}
            </h1>

            <p className="mt-4 text-sm leading-relaxed text-[#687363]">
              {isSignup
                ? "Create your account and take the first step towards financial clarity."
                : "Sign in to continue your financial journey."}
            </p>

            <form onSubmit={handleAuth} className="mt-10 space-y-5">
              {isSignup && (
                <div>
                  <label htmlFor="fullName" className="mb-2 block text-sm font-semibold">
                    Full name
                  </label>
                  <input
                    id="fullName"
                    type="text"
                    required
                    autoComplete="name"
                    value={fullName}
                    onChange={e => setFullName(e.target.value)}
                    placeholder="Enter your full name"
                    className="w-full rounded-2xl border border-[#DCE5D7] bg-[#FAFBF9] px-4 py-4 text-sm outline-none focus:border-[#81977B]"
                  />
                </div>
              )}


              <div>
                <label htmlFor="email" className="mb-2 block text-sm font-semibold">
                  Email address
                </label>

                <input
                  id="email"
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full rounded-2xl border border-[#DCE5D7] bg-[#FAFBF9] px-4 py-4 text-sm outline-none focus:border-[#81977B]"
                />
              </div>

              <div>
                <label htmlFor="password" className="mb-2 block text-sm font-semibold">
                  Password
                </label>

                <div className="relative">

                  <input
                    id="password"
                    required
                    minLength={isSignup ? 6 : undefined}
                    type={showPassword ? "text" : "password"}
                    autoComplete={isSignup ? "new-password" : "current-password"}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="w-full rounded-2xl border border-[#DCE5D7] bg-[#FAFBF9] px-4 py-4 pr-12 text-sm outline-none focus:border-[#81977B]"
                  />

                  <button
                    type="button"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[#687363]"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>

                </div>
              </div>

              {error && (
                <div role="alert" className="rounded-xl bg-red-50 p-4 text-sm text-red-700">
                  {error}
                </div>
              )}

              {message && (
                <div role="status" className="rounded-xl bg-[#E9EEE5] p-4 text-sm text-[#40583B]">
                  {message}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-2xl bg-[#526B4B] py-4 text-sm font-semibold text-white transition hover:bg-[#40583B] disabled:opacity-50"
              >
                {loading
                  ? "Please wait..."
                  : isSignup
                    ? "Create account"
                    : "Sign in"}
              </button>

            </form>

            <p className="mt-8 text-center text-sm text-[#687363]">
              {isSignup ? "Already have an account?" : "New to SpendWise?"}

              <button
                type="button"
                disabled={loading}
                onClick={() => {
                  setIsSignup(!isSignup);
                  setError("");
                  setMessage("");
                }}
                className="ml-2 font-bold text-[#526B4B] hover:underline"
              >
                {isSignup ? "Sign in" : "Create account"}
              </button>
            </p>

          </div>

          <p className="text-center text-xs text-[#687363]">
            © 2026 SpendWise · Money, made clear.
          </p>

        </section>

      </div>
    </main>
  );
}
