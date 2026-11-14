
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft, Wallet, Plus, Trash2, Pencil, X,
  TrendingUp, AlertTriangle, CheckCircle2, PiggyBank,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

type Budget = {
  id: number;
  category: string;
  monthly_limit: number;
  month: string;
};

type Transaction = {
  id: number;
  amount: number;
  type: string;
  category: string;
  date: string;
};

const categories = [
  "Food & Dining",
  "Shopping",
  "Transport",
  "Housing",
  "Entertainment",
  "Health",
  "Education",
  "Other",
];

const money = (n: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(n);

export default function BudgetsPage() {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Budget | null>(null);
  const [category, setCategory] = useState(categories[0]);
  const [amount, setAmount] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const month = new Date();
  const monthKey = `${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, "0")}-01`;
  const monthLabel = month.toLocaleDateString("en-IN", {
    month: "long",
    year: "numeric",
  });

  async function loadData() {
    setLoading(true);
    const { data: auth } = await supabase.auth.getUser();

    if (!auth.user) {
      setError("Please log in to view your budgets.");
      setLoading(false);
      return;
    }

    const [budgetResult, transactionResult] = await Promise.all([
      supabase
        .from("budgets")
        .select("id,category,monthly_limit,month")
        .eq("user_id", auth.user.id)
        .eq("month", monthKey),
      supabase
        .from("transactions")
        .select("id,amount,type,category,date")
        .eq("user_id", auth.user.id)
        .gte("date", monthKey)
        .lt(
          "date",
          new Date(month.getFullYear(), month.getMonth() + 1, 1)
            .toISOString()
            .slice(0, 10)
        ),
    ]);

    if (budgetResult.error) setError(budgetResult.error.message);
    else setBudgets(budgetResult.data || []);

    if (transactionResult.error) setError(transactionResult.error.message);
    else setTransactions(transactionResult.data || []);

    setLoading(false);
  }

  useEffect(() => {
    loadData();
  }, []);

  const spendingByCategory = useMemo(() => {
    const result: Record<string, number> = {};
    transactions.forEach((t) => {
      if (t.type === "expense") {
        result[t.category] = (result[t.category] || 0) + Number(t.amount);
      }
    });
    return result;
  }, [transactions]);

  const totalBudget = budgets.reduce(
    (sum, b) => sum + Number(b.monthly_limit), 0
  );
  const totalSpent = budgets.reduce(
    (sum, b) => sum + (spendingByCategory[b.category] || 0), 0
  );
  const remaining = totalBudget - totalSpent;

  function openForm(budget?: Budget) {
    setEditing(budget || null);
    setCategory(budget?.category || categories[0]);
    setAmount(budget ? String(budget.monthly_limit) : "");
    setError("");
    setShowForm(true);
  }

  async function saveBudget(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const value = Number(amount);

    if (!Number.isFinite(value) || value <= 0) {
      setError("Enter a valid budget amount.");
      return;
    }

    setSaving(true);
    setError("");

    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) {
      setError("Please log in again.");
      setSaving(false);
      return;
    }

    const result = await supabase.from("budgets").upsert(
      {
        user_id: auth.user.id,
        category,
        monthly_limit: value,
        month: monthKey,
      },
      { onConflict: "user_id,category,month" }
    );

    if (result.error) {
      setError(result.error.message);
    } else {
      setShowForm(false);
      await loadData();
    }
    setSaving(false);
  }

  async function deleteBudget(id: number) {
    if (!window.confirm("Delete this budget?")) return;
    const { error } = await supabase.from("budgets").delete().eq("id", id);
    if (error) setError(error.message);
    else await loadData();
  }

  return (
    <main className="min-h-screen bg-[#f7f7fc] px-5 py-7 text-[#25243a] md:px-10">
      <div className="mx-auto max-w-6xl">
        <header className="mb-9 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link href="/" className="rounded-xl border border-[#e9e7f1] bg-white p-3 hover:bg-[#f2efff]">
              <ArrowLeft size={19} />
            </Link>
            <div>
              <p className="text-sm text-[#88869c]">SpendWise / Planning</p>
              <h1 className="text-2xl font-bold tracking-tight">Budgets</h1>
            </div>
          </div>
          <button
            onClick={() => openForm()}
            className="flex items-center gap-2 rounded-xl bg-[#7864df] px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-[#7864df]/20 transition hover:bg-[#6651d0]"
          >
            <Plus size={18} /> Create budget
          </button>
        </header>

        <div className="mb-7">
          <p className="text-sm text-[#88869c]">Monthly overview</p>
          <h2 className="mt-1 text-xl font-bold">{monthLabel}</h2>
        </div>

        <section className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[
            { label: "Total budget", value: money(totalBudget), icon: Wallet, color: "#7864df", bg: "#f0edff" },
            { label: "Total spent", value: money(totalSpent), icon: TrendingUp, color: "#e58a58", bg: "#fff2e9" },
            { label: "Remaining", value: money(remaining), icon: PiggyBank, color: "#35a88b", bg: "#e9f8f2" },
          ].map((item) => (
            <div key={item.label} className="rounded-3xl border border-[#eeedf4] bg-white p-6 shadow-sm">
              <div className="mb-5 flex items-center justify-between">
                <p className="text-sm text-[#88869c]">{item.label}</p>
                <span className="rounded-xl p-3" style={{ background: item.bg, color: item.color }}>
                  <item.icon size={20} />
                </span>
              </div>
              <p className="text-2xl font-bold tracking-tight">{item.value}</p>
            </div>
          ))}
        </section>

        <section className="rounded-3xl border border-[#eeedf4] bg-white p-6 shadow-sm md:p-8">
          <div className="mb-7 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold">Category budgets</h3>
              <p className="mt-1 text-sm text-[#9693a8]">Your spending against each monthly limit</p>
            </div>
            <span className="rounded-xl bg-[#f2efff] px-3 py-2 text-xs font-semibold text-[#7864df]">
              {budgets.length} categories
            </span>
          </div>

          {loading ? (
            <p className="py-12 text-center text-sm text-[#9693a8]">Loading budgets...</p>
          ) : budgets.length === 0 ? (
            <div className="py-14 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#f2efff] text-[#7864df]">
                <PiggyBank size={29} />
              </div>
              <h4 className="font-semibold">No budgets yet</h4>
              <p className="mt-2 text-sm text-[#9693a8]">Create your first category budget to start tracking spending.</p>
              <button onClick={() => openForm()} className="mt-5 rounded-xl bg-[#7864df] px-5 py-3 text-sm font-semibold text-white">
                Create your first budget
              </button>
            </div>
          ) : (
            <div className="space-y-7">
              {budgets.map((budget) => {
                const spent = spendingByCategory[budget.category] || 0;
                const limit = Number(budget.monthly_limit);
                const percent = limit > 0 ? (spent / limit) * 100 : 0;
                const over = percent > 100;
                const near = percent >= 80 && !over;

                return (
                  <div key={budget.id}>
                    <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <h4 className="font-semibold">{budget.category}</h4>
                        <p className="mt-1 text-xs text-[#9693a8]">
                          {money(spent)} spent of {money(limit)}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`flex items-center gap-1 text-xs font-semibold ${over ? "text-red-500" : near ? "text-orange-500" : "text-[#35a88b]"}`}>
                          {over ? <AlertTriangle size={14} /> : <CheckCircle2 size={14} />}
                          {over ? "Over budget" : near ? "Almost there" : "On track"}
                        </span>
                        <button onClick={() => openForm(budget)} className="rounded-lg p-2 text-[#89869c] hover:bg-[#f2efff] hover:text-[#7864df]">
                          <Pencil size={15} />
                        </button>
                        <button onClick={() => deleteBudget(budget.id)} className="rounded-lg p-2 text-[#aaa6b7] hover:bg-red-50 hover:text-red-500">
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>
                    <div className="h-3 overflow-hidden rounded-full bg-[#f0eff5]">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${over ? "bg-red-400" : near ? "bg-orange-400" : "bg-[#8b78e8]"}`}
                        style={{ width: `${Math.min(percent, 100)}%` }}
                      />
                    </div>
                    <p className="mt-2 text-right text-xs text-[#9693a8]">
                      {Math.round(percent)}% used
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {error && <p className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-600">{error}</p>}

        {showForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#211d38]/40 p-4 backdrop-blur-sm">
            <form onSubmit={saveBudget} className="w-full max-w-md rounded-3xl bg-white p-7 shadow-2xl">
              <div className="mb-6 flex items-center justify-between">
                <h3 className="text-xl font-bold">{editing ? "Update budget" : "Create budget"}</h3>
                <button type="button" onClick={() => setShowForm(false)} className="rounded-xl p-2 hover:bg-gray-100">
                  <X size={19} />
                </button>
              </div>
              <label className="mb-2 block text-sm font-medium">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                disabled={!!editing}
                className="mb-5 w-full rounded-xl border border-[#e9e7f1] bg-white px-4 py-3 outline-none focus:border-[#7864df] disabled:bg-gray-100"
              >
                {categories.map((c) => <option key={c}>{c}</option>)}
              </select>
              <label className="mb-2 block text-sm font-medium">Monthly limit (₹)</label>
              <input
                type="number"
                min="1"
                step="0.01"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="e.g. 5000"
                className="mb-5 w-full rounded-xl border border-[#e9e7f1] px-4 py-3 outline-none focus:border-[#7864df]"
              />
              {error && <p className="mb-4 text-sm text-red-500">{error}</p>}
              <button disabled={saving} className="w-full rounded-xl bg-[#7864df] py-3.5 font-semibold text-white transition hover:bg-[#6651d0] disabled:opacity-60">
                {saving ? "Saving..." : editing ? "Update budget" : "Save budget"}
              </button>
            </form>
          </div>
        )}
      </div>
    </main>
  );
}
