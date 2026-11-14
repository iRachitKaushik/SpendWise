
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, UserRound, ShieldCheck, LockKeyhole,
  LogOut, Save, Eye, EyeOff, Mail, CheckCircle2,
  Loader2, Settings as SettingsIcon
} from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function SettingsPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadProfile() {
      const { data: { user }, error } = await supabase.auth.getUser();

      if (error || !user) {
        router.replace("/login");
        return;
      }

      setEmail(user.email || "");
      setName(user.user_metadata?.full_name || "");
      setLoading(false);
    }

    loadProfile();
  }, [router]);

  async function saveProfile() {
    setError("");
    setMessage("");

    if (!name.trim()) {
      setError("Please enter your name.");
      return;
    }

    setSaving(true);

    const { error } = await supabase.auth.updateUser({
      data: { full_name: name.trim() },
    });

    setSaving(false);

    if (error) {
      setError(error.message);
      return;
    }

    setMessage("Profile updated successfully.");
  }

  async function changePassword() {
    setError("");
    setMessage("");

    if (password.length < 8) {
      setError("Password must contain at least 8 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setSaving(true);

    const { error } = await supabase.auth.updateUser({
      password,
    });

    setSaving(false);

    if (error) {
      setError(error.message);
      return;
    }

    setPassword("");
    setConfirmPassword("");
    setMessage("Password changed successfully.");
  }

  async function signOut() {
    await supabase.auth.signOut();
    router.replace("/login");
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8F8FC] flex items-center justify-center">
        <Loader2 className="animate-spin text-violet-600" size={28} />
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#F8F8FC] text-[#25233A]">
      <div className="max-w-5xl mx-auto px-5 md:px-10 py-8">

        <button
          onClick={() => router.push("/")}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-violet-600 transition mb-8"
        >
          <ArrowLeft size={17} /> Back to Dashboard
        </button>

        <div className="flex items-center gap-4 mb-9">
          <div className="w-14 h-14 rounded-2xl bg-violet-100 text-violet-600 flex items-center justify-center">
            <SettingsIcon size={27} />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
            <p className="text-gray-500 text-sm mt-1">
              Manage your account and security preferences.
            </p>
          </div>
        </div>

        {message && (
          <div className="mb-6 p-4 rounded-xl bg-emerald-50 text-emerald-700 text-sm flex items-center gap-2">
            <CheckCircle2 size={18} /> {message}
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-50 text-red-600 text-sm">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-[230px_1fr] gap-7">

          <aside className="bg-white border border-gray-100 rounded-2xl p-5 h-fit shadow-sm">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">
              Account
            </p>
            <div className="flex items-center gap-3 text-violet-700 bg-violet-50 p-3 rounded-xl">
              <UserRound size={18} />
              <span className="text-sm font-semibold">My Profile</span>
            </div>
            <div className="flex items-center gap-3 text-gray-500 p-3 mt-2">
              <ShieldCheck size={18} />
              <span className="text-sm">Security</span>
            </div>
          </aside>

          <div className="space-y-7">

            <section className="bg-white border border-gray-100 rounded-2xl p-6 md:p-8 shadow-sm">
              <div className="flex items-center gap-3 mb-7">
                <div className="w-11 h-11 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center">
                  <UserRound size={21} />
                </div>
                <div>
                  <h2 className="font-bold text-lg">Personal Information</h2>
                  <p className="text-xs text-gray-400">Your account details</p>
                </div>
              </div>

              <label className="block text-sm font-semibold mb-2">
                Full Name
              </label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your name"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-50 transition mb-5"
              />

              <label className="block text-sm font-semibold mb-2">
                Email Address
              </label>
              <div className="relative mb-2">
                <Mail size={17} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  value={email}
                  readOnly
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-11 pr-4 py-3 text-gray-500 outline-none"
                />
              </div>
              <p className="text-xs text-gray-400 mb-6">
                Email is managed through your authentication account.
              </p>

              <button
                onClick={saveProfile}
                disabled={saving}
                className="flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-700 disabled:opacity-60 text-white px-6 py-3 rounded-xl text-sm font-semibold transition shadow-lg shadow-violet-100"
              >
                <Save size={17} />
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </section>

            <section className="bg-white border border-gray-100 rounded-2xl p-6 md:p-8 shadow-sm">
              <div className="flex items-center gap-3 mb-7">
                <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <LockKeyhole size={21} />
                </div>
                <div>
                  <h2 className="font-bold text-lg">Security</h2>
                  <p className="text-xs text-gray-400">Update your account password</p>
                </div>
              </div>

              <label className="block text-sm font-semibold mb-2">
                New Password
              </label>
              <div className="relative mb-5">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimum 8 characters"
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 pr-12 outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-50 transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>

              <label className="block text-sm font-semibold mb-2">
                Confirm New Password
              </label>
              <input
                type={showPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter new password"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-50 transition mb-6"
              />

              <button
                onClick={changePassword}
                disabled={saving || !password || !confirmPassword}
                className="bg-[#24213A] hover:bg-black disabled:opacity-50 text-white px-6 py-3 rounded-xl text-sm font-semibold transition"
              >
                {saving ? "Updating..." : "Update Password"}
              </button>
            </section>

            <section className="bg-white border border-red-100 rounded-2xl p-6 md:p-8 shadow-sm">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-11 h-11 rounded-xl bg-red-50 text-red-500 flex items-center justify-center">
                  <LogOut size={21} />
                </div>
                <div>
                  <h2 className="font-bold text-lg">Sign Out</h2>
                  <p className="text-xs text-gray-400">
                    Sign out from your SpendWise account on this device.
                  </p>
                </div>
              </div>

              <button
                onClick={signOut}
                className="border border-red-200 text-red-600 hover:bg-red-50 px-6 py-3 rounded-xl text-sm font-semibold transition"
              >
                Sign Out
              </button>
            </section>

            <p className="text-center text-xs text-gray-400 pb-5">
              SpendWise · Account Settings
            </p>

          </div>
        </div>
      </div>
    </main>
  );
}
