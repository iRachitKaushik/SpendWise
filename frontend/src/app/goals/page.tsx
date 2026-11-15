"use client";

import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, Plus, Target, Pencil, Trash2, X,
  Loader2, CalendarDays, Wallet, Trophy, PiggyBank
} from "lucide-react";
import { supabase } from "@/lib/supabase";

type Goal = {
  id: number;
  user_id: string;
  title: string;
  target_amount: number;
  current_amount: number;
  target_date: string | null;
  created_at: string;
};

const money = (n: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(n || 0);

const today = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

export default function GoalsPage() {
  const router = useRouter();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [userId, setUserId] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState<Goal | null>(null);

  const empty = {
    title: "",
    target_amount: "",
    current_amount: "0",
    target_date: "",
  };

  const [form, setForm] = useState(empty);

  async function loadGoals() {
    setLoading(true);
    setError("");

    const { data: auth } = await supabase.auth.getUser();

    if (!auth.user) {
      router.replace("/login");
      return;
    }

    setUserId(auth.user.id);

    const { data, error } = await supabase
      .from("savings_goals")
      .select("*")
      .eq("user_id", auth.user.id)
      .order("created_at", { ascending: false });

    if (error) setError(error.message);
    else setGoals((data || []) as Goal[]);

    setLoading(false);
  }

  useEffect(() => {
    loadGoals();
  }, []);

  const totalTarget = goals.reduce((s, g) => s + Number(g.target_amount), 0);
  const totalSaved = goals.reduce((s, g) => s + Number(g.current_amount), 0);
  const completed = goals.filter(g => Number(g.current_amount) >= Number(g.target_amount)).length;
  const overallProgress = totalTarget > 0
    ? Math.min(100, (totalSaved / totalTarget) * 100)
    : 0;

  function openAdd() {
    setEditing(null);
    setForm(empty);
    setModal(true);
  }

  function openEdit(goal: Goal) {
    setEditing(goal);
    setForm({
      title: goal.title,
      target_amount: String(goal.target_amount),
      current_amount: String(goal.current_amount),
      target_date: goal.target_date || "",
    });
    setModal(true);
  }

  async function saveGoal(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const target = Number(form.target_amount);
    const current = Number(form.current_amount);

    if (!form.title.trim() || !Number.isFinite(target) || target <= 0 ||
        !Number.isFinite(current) || current < 0) {
      setError("Enter a valid title and amounts.");
      return;
    }

    setSaving(true);
    setError("");

    const payload = {
      user_id: userId,
      title: form.title.trim(),
      target_amount: target,
      current_amount: current,
      target_date: form.target_date || null,
    };

    const result = editing
      ? await supabase.from("savings_goals")
          .update(payload)
          .eq("id", editing.id)
          .eq("user_id", userId)
      : await supabase.from("savings_goals").insert(payload);

    if (result.error) {
      setError(result.error.message);
      setSaving(false);
      return;
    }

    setModal(false);
    setSaving(false);
    await loadGoals();
  }

  async function deleteGoal(goal: Goal) {
    if (!window.confirm(`Delete "${goal.title}"?`)) return;

    const { error } = await supabase
      .from("savings_goals")
      .delete()
      .eq("id", goal.id)
      .eq("user_id", userId);

    if (error) setError(error.message);
    else await loadGoals();
  }

  return (
    <main className="min-h-screen bg-[#f8f8fc] px-5 py-8 text-[#25243a] md:px-9">
      <div className="mx-auto max-w-7xl">
        <button
          onClick={() => router.push("/")}
          className="mb-7 flex items-center gap-2 text-sm font-medium text-[#85839b] hover:text-[#7156d9]"
        >
          <ArrowLeft size={17} /> Back to Dashboard
        </button>

        <div className="mb-8 flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
          <div>
            <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-[#8066df]">
              <Target size={16} /> FINANCIAL PLANNING
            </div>
            <h1 className="text-3xl font-bold tracking-tight md:text-4xl">Savings Goals</h1>
            <p className="mt-2 text-sm text-[#9290a5]">
              Turn your financial targets into measurable progress.
            </p>
          </div>

          <button
            onClick={openAdd}
            className="flex items-center justify-center gap-2 rounded-2xl bg-[#7659df] px-5 py-3.5 text-sm font-semibold text-white shadow-lg shadow-purple-200 transition hover:-translate-y-0.5 hover:bg-[#6548ce]"
          >
            <Plus size={18} /> Create Goal
          </button>
        </div>

        {error && (
          <div className="mb-5 flex items-center justify-between rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
            {error}
            <button onClick={() => setError("")}><X size={16} /></button>
          </div>
        )}

        <section className="mb-7 rounded-[26px] bg-gradient-to-br from-[#7659df] to-[#a18be9] p-6 text-white shadow-lg shadow-purple-100 md:p-8">
          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-center">
            <div>
              <div className="flex items-center gap-2 text-sm text-white/75">
                <PiggyBank size={18} /> Your savings overview
              </div>
              <p className="mt-4 text-sm text-white/75">Total amount saved</p>
              <h2 className="mt-1 text-4xl font-bold tracking-tight">{money(totalSaved)}</h2>
              <p className="mt-2 text-sm text-white/75">
                Across {goals.length} savings {goals.length === 1 ? "goal" : "goals"}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-5 md:min-w-[310px]">
              <div>
                <p className="text-xs text-white/70">Total target</p>
                <p className="mt-2 text-xl font-bold">{money(totalTarget)}</p>
              </div>
              <div>
                <p className="text-xs text-white/70">Goals completed</p>
                <p className="mt-2 text-xl font-bold">{completed}/{goals.length}</p>
              </div>
              <div className="col-span-2">
                <div className="mb-2 flex justify-between text-xs text-white/80">
                  <span>Overall progress</span>
                  <span>{overallProgress.toFixed(0)}%</span>
                </div>
                <div className="h-2.5 overflow-hidden rounded-full bg-white/25">
                  <div
                    className="h-full rounded-full bg-white transition-all"
                    style={{ width: `${overallProgress}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="mb-5 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold">Your goals</h2>
            <p className="mt-1 text-sm text-[#9997aa]">Track and update your savings progress.</p>
          </div>
          <span className="rounded-full bg-[#efecff] px-3 py-1.5 text-xs font-semibold text-[#8066df]">
            {goals.length} goals
          </span>
        </div>

        {loading ? (
          <div className="flex min-h-64 items-center justify-center gap-3 text-sm text-[#9290a5]">
            <Loader2 className="animate-spin" size={20} /> Loading goals...
          </div>
        ) : goals.length === 0 ? (
          <div className="flex min-h-72 flex-col items-center justify-center rounded-[26px] border border-[#eeedf5] bg-white text-center">
            <div className="mb-4 rounded-2xl bg-[#f0edff] p-5 text-[#8066df]">
              <Target size={28} />
            </div>
            <h3 className="text-lg font-bold">No savings goals yet</h3>
            <p className="mt-2 max-w-sm text-sm text-[#9997aa]">
              Create your first goal for a new phone, emergency fund, trip or anything you want to save for.
            </p>
            <button
              onClick={openAdd}
              className="mt-5 rounded-xl bg-[#7659df] px-5 py-3 text-sm font-semibold text-white"
            >
              + Create your first goal
            </button>
          </div>
        ) : (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {goals.map(goal => {
              const target = Number(goal.target_amount);
              const saved = Number(goal.current_amount);
              const progress = target > 0 ? Math.min(100, (saved / target) * 100) : 0;
              const isComplete = saved >= target;

              return (
                <article
                  key={goal.id}
                  className="rounded-[25px] border border-[#eeedf5] bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
                >
                  <div className="mb-5 flex items-start justify-between">
                    <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${
                      isComplete ? "bg-[#e8f8f0] text-[#27a56c]" : "bg-[#f0edff] text-[#8066df]"
                    }`}>
                      {isComplete ? <Trophy size={22} /> : <Target size={22} />}
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => openEdit(goal)}
                        title="Edit goal"
                        className="rounded-xl p-2.5 text-[#9290a5] hover:bg-[#f1effb] hover:text-[#7659df]"
                      >
                        <Pencil size={17} />
                      </button>
                      <button
                        onClick={() => deleteGoal(goal)}
                        title="Delete goal"
                        className="rounded-xl p-2.5 text-[#9290a5] hover:bg-red-50 hover:text-red-500"
                      >
                        <Trash2 size={17} />
                      </button>
                    </div>
                  </div>

                  <h3 className="text-lg font-bold">{goal.title}</h3>
                  <p className="mt-1 text-xs text-[#9997aa]">
                    {isComplete ? "Goal achieved!" : "Keep saving to reach your target"}
                  </p>

                  <div className="mt-6 flex items-end justify-between gap-2">
                    <div>
                      <p className="text-xs text-[#9997aa]">Saved so far</p>
                      <p className="mt-1 text-2xl font-bold text-[#7659df]">{money(saved)}</p>
                    </div>
                    <p className="text-sm font-semibold text-[#77748d]">{progress.toFixed(0)}%</p>
                  </div>

                  <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-[#f0eef7]">
                    <div
                      className={`h-full rounded-full transition-all ${isComplete ? "bg-[#36b47c]" : "bg-[#8a70e5]"}`}
                      style={{ width: `${progress}%` }}
                    />
                  </div>

                  <div className="mt-4 flex items-center justify-between text-xs text-[#9997aa]">
                    <span>Target: {money(target)}</span>
                    <span>{money(Math.max(0, target - saved))} left</span>
                  </div>

                  {goal.target_date && (
                    <div className="mt-5 flex items-center gap-2 border-t border-[#f0eff6] pt-4 text-xs text-[#9290a5]">
                      <CalendarDays size={15} />
                      Target date: {new Date(goal.target_date + "T00:00:00").toLocaleDateString("en-IN", {
                        day: "numeric", month: "short", year: "numeric"
                      })}
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </div>

      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-[#201b35]/40 p-4 backdrop-blur-sm">
          <div className="my-auto w-full max-w-lg rounded-[26px] bg-white p-6 shadow-2xl md:p-8">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold">{editing ? "Edit savings goal" : "Create savings goal"}</h2>
                <p className="mt-1 text-sm text-[#9997aa]">Set your target and track your savings.</p>
              </div>
              <button
                onClick={() => setModal(false)}
                className="rounded-xl bg-[#f5f4f9] p-2 text-[#77748d]"
              >
                <X size={19} />
              </button>
            </div>

            <form onSubmit={saveGoal} className="space-y-4">
              <Field label="Goal name">
                <input
                  required
                  value={form.title}
                  onChange={e => setForm({ ...form, title: e.target.value })}
                  placeholder="e.g. Emergency fund"
                  className="goal-input"
                />
              </Field>

              <div className="grid grid-cols-2 gap-3">
                <Field label="Target amount (₹)">
                  <input
                    required
                    type="number"
                    min="1"
                    step="0.01"
                    value={form.target_amount}
                    onChange={e => setForm({ ...form, target_amount: e.target.value })}
                    placeholder="100000"
                    className="goal-input"
                  />
                </Field>
                <Field label="Already saved (₹)">
                  <input
                    required
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.current_amount}
                    onChange={e => setForm({ ...form, current_amount: e.target.value })}
                    placeholder="0"
                    className="goal-input"
                  />
                </Field>
              </div>

              <Field label="Target date (optional)">
                <input
                  type="date"
                  min={today()}
                  value={form.target_date}
                  onChange={e => setForm({ ...form, target_date: e.target.value })}
                  className="goal-input"
                />
              </Field>

              <button
                disabled={saving}
                type="submit"
                className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl bg-[#7659df] py-3.5 font-semibold text-white shadow-lg shadow-purple-100 transition hover:bg-[#6548ce] disabled:opacity-60"
              >
                {saving && <Loader2 size={17} className="animate-spin" />}
                {saving ? "Saving..." : editing ? "Save changes" : "Create goal"}
              </button>
            </form>
          </div>
        </div>
      )}

      <style jsx global>{`
        .goal-input {
          width: 100%;
          min-width: 0;
          border: 1px solid #eeedf5;
          border-radius: 12px;
          padding: 12px;
          background: #fcfbfe;
          color: #343249;
          font-size: 13px;
          outline: none;
        }
        .goal-input:focus {
          border-color: #a895ed;
          box-shadow: 0 0 0 3px #f0edff;
        }
      `}</style>
    </main>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block min-w-0">
      <span className="mb-2 block text-xs font-semibold text-[#77748d]">{label}</span>
      {children}
    </label>
  );
}
