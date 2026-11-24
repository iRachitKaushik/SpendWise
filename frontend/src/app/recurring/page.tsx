"use client";

import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, Plus, Repeat, CalendarDays, Wallet,
  TrendingUp, TrendingDown, Pencil, Trash2, Pause,
  Play, X, Clock, Search, Loader2, RefreshCw
} from "lucide-react";
import { supabase } from "@/lib/supabase";

type Recurring = {
  payment_method?: "cash" | "upi" | null;
  id: string | number;
  user_id: string;
  title: string;
  amount: number;
  type: string;
  category: string;
  frequency: string;
  next_due_date: string;
  end_date: string | null;
  is_active: boolean;
  created_at: string;
};

const categories = [
  "Food & Dining", "Shopping", "Transport", "Housing",
  "Entertainment", "Health", "Education", "Subscriptions", "Salary", "Other"
];

const money = (value: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value || 0);

const today = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

const formatDate = (value: string) =>
  new Date(value + "T00:00:00").toLocaleDateString("en-IN", {
    day: "numeric", month: "short", year: "numeric"
  });

export default function RecurringPage() {
  const router = useRouter();

  const [userId, setUserId] = useState("");
  const [items, setItems] = useState<Recurring[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState<Recurring | null>(null);

  const emptyForm = {
    payment_method: "",
    title: "",
    amount: "",
    type: "expense",
    category: "Subscriptions",
    frequency: "monthly",
    next_due_date: today(),
    end_date: "",
  };

  const [form, setForm] = useState(emptyForm);

  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [confirmError, setConfirmError] = useState("");

  async function confirmDue(item: Recurring) {
    if (confirmingId) return;

    setConfirmError("");

    if (!item.is_active || item.next_due_date > today()) {
      setConfirmError("This transaction is not due yet.");
      return;
    }

    if (!window.confirm(
      `Confirm "${item.title}" for ₹${item.amount}? This will create a transaction and update its linked wallet.`
    )) return;

    setConfirmingId(String(item.id));

    try {
      if (item.payment_method) {
        const { data: wallet, error: walletError } =
          await supabase.from("wallet_accounts")
            .select("opening_date")
            .eq("wallet_type", item.payment_method)
            .maybeSingle();

        if (walletError) {
          throw new Error(walletError.message);
        }

        if (!wallet) {
          throw new Error("Initialize the selected wallet first.");
        }

        if (item.next_due_date < wallet.opening_date) {
          throw new Error(
            "The due date is before the wallet opening date. Review the recurring schedule."
          );
        }
      }

      const { error } = await supabase.rpc(
        "confirm_recurring_transaction",
        { p_recurring_id: item.id }
      );

      if (error) throw new Error(error.message);

      await loadData();

    } catch (err) {
      setConfirmError(
        err instanceof Error
          ? err.message
          : "Could not confirm transaction."
      );
    } finally {
      setConfirmingId(null);
    }
  }

  async function loadData() {
    setLoading(true);
    setError("");

    const { data: authData, error: authError } = await supabase.auth.getUser();

    if (authError || !authData.user) {
      router.replace("/login");
      return;
    }

    setUserId(authData.user.id);

    const { data, error: fetchError } = await supabase
      .from("recurring_transactions")
      .select("*")
      .eq("user_id", authData.user.id)
      .order("next_due_date", { ascending: true });

    if (fetchError) {
      setError(fetchError.message);
    } else {
      setItems((data || []) as Recurring[]);
    }

    setLoading(false);
  }

  useEffect(() => {
    loadData();
  }, []);

  const activeItems = items.filter(item => item.is_active);
  const monthlyExpense = activeItems
    .filter(item => item.type === "expense")
    .reduce((sum, item) => {
      const amount = Number(item.amount);
      if (item.frequency === "weekly") return sum + amount * 4.33;
      if (item.frequency === "yearly") return sum + amount / 12;
      return sum + amount;
    }, 0);

  const upcoming = activeItems.filter(item =>
    item.next_due_date >= today() &&
    item.next_due_date <= (() => {
      const d = new Date();
      d.setDate(d.getDate() + 7);
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    })()
  ).length;

  const filtered = useMemo(() => {
    return items.filter(item => {
      const matchesSearch =
        item.title.toLowerCase().includes(search.toLowerCase()) ||
        item.category.toLowerCase().includes(search.toLowerCase());

      const matchesFilter =
        filter === "all" ||
        (filter === "active" && item.is_active) ||
        (filter === "paused" && !item.is_active) ||
        item.type === filter;

      return matchesSearch && matchesFilter;
    });
  }, [items, search, filter]);

  function openAdd() {
    setEditing(null);
    setForm({ ...emptyForm, next_due_date: today() });
    setModal(true);
  }

  function openEdit(item: Recurring) {
    setEditing(item);
    setForm({
      title: item.title,
      payment_method: item.payment_method ?? "",
      amount: String(item.amount),
      type: item.type,
      category: item.category,
      frequency: item.frequency,
      next_due_date: item.next_due_date,
      end_date: item.end_date || "",
    });
    setModal(true);
  }

  async function saveRecurring(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!userId) return;

    const amount = Number(form.amount);

    if (!form.title.trim() || !Number.isFinite(amount) || amount <= 0) {
      setError("Enter a valid title and amount.");
      return;
    }

    if (form.end_date && form.end_date < form.next_due_date) {
      setError("End date cannot be earlier than the next due date.");
      return;
    }

    setSaving(true);
    setError("");

    const payload = {
      payment_method: form.payment_method || null,
      user_id: userId,
      title: form.title.trim(),
      amount,
      type: form.type,
      category: form.category,
      frequency: form.frequency,
      next_due_date: form.next_due_date,
      end_date: form.end_date || null,
    };

    const result = editing
      ? await supabase
          .from("recurring_transactions")
          .update(payload)
          .eq("id", editing.id)
          .eq("user_id", userId)
      : await supabase
          .from("recurring_transactions")
          .insert({ ...payload, is_active: true });

    if (result.error) {
      setError(result.error.message);
      setSaving(false);
      return;
    }

    setModal(false);
    setSaving(false);
    await loadData();
  }

  async function toggleStatus(item: Recurring) {
    const { error } = await supabase
      .from("recurring_transactions")
      .update({ is_active: !item.is_active })
      .eq("id", item.id)
      .eq("user_id", userId);

    if (error) setError(error.message);
    else await loadData();
  }

  async function deleteItem(item: Recurring) {
    if (!window.confirm(`Delete "${item.title}"?`)) return;

    const { error } = await supabase
      .from("recurring_transactions")
      .delete()
      .eq("id", item.id)
      .eq("user_id", userId);

    if (error) setError(error.message);
    else await loadData();
  }

  return (
    <main className="min-h-screen bg-[#F7F6F2] text-[#252823]">
      {confirmError && (
        <div role="alert" className="mx-auto my-4 max-w-6xl rounded-xl bg-red-50 p-4 text-sm text-red-700">
          {confirmError}
        </div>
      )}

      <div className="mx-auto max-w-7xl px-5 py-8 md:px-9">
        <button
          onClick={() => router.push("/dashboard")}
          className="mb-7 flex items-center gap-2 text-sm font-medium text-[#606C5C] hover:text-[#606C5C]"
        >
          <ArrowLeft size={17} /> Back to Dashboard
        </button>

        <div className="mb-8 flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
          <div>
            <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-[#606C5C]">
              <Repeat size={16} /> MONEY MANAGEMENT
            </div>
            <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
              Recurring Transactions
            </h1>
            <p className="mt-2 text-sm text-[#606C5C]">
              Keep track of your regular income and expenses.
            </p>
          </div>

          <button
            onClick={openAdd}
            className="flex items-center justify-center gap-2 rounded-2xl bg-[#526B4B] px-5 py-3.5 text-sm font-semibold text-white shadow-lg shadow-purple-200 transition hover:-translate-y-0.5 hover:bg-[#526B4B]"
          >
            <Plus size={18} /> Add Recurring
          </button>
        </div>

        {error && (
          <div className="mb-5 flex items-center justify-between rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
            {error}
            <button onClick={() => setError("")}><X size={16} /></button>
          </div>
        )}

        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            icon={<Repeat size={19} />}
            label="Total schedules"
            value={String(items.length)}
            color="purple"
          />
          <StatCard
            icon={<Wallet size={19} />}
            label="Monthly expense estimate"
            value={money(monthlyExpense)}
            color="blue"
          />
          <StatCard
            icon={<CalendarDays size={19} />}
            label="Upcoming in 7 days"
            value={String(upcoming)}
            color="orange"
          />
          <StatCard
            icon={<TrendingUp size={19} />}
            label="Active schedules"
            value={String(activeItems.length)}
            color="green"
          />
        </div>

        <section className="rounded-[26px] border border-[#E9EEE5] bg-white p-5 shadow-sm md:p-7">
          <div className="mb-6 flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
            <div>
              <h2 className="text-xl font-bold">Your schedules</h2>
              <p className="mt-1 text-sm text-[#606C5C]">
                Manage your regular payments and income.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <div className="flex items-center gap-2 rounded-xl border border-[#E9EEE5] px-3 py-2.5">
                <Search size={17} className="text-[#606C5C]" />
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search schedules..."
                  className="w-full bg-transparent text-sm outline-none sm:w-44"
                />
              </div>
              <select
                value={filter}
                onChange={e => setFilter(e.target.value)}
                className="rounded-xl border border-[#E9EEE5] bg-white px-3 py-2.5 text-sm outline-none"
              >
                <option value="all">All schedules</option>
                <option value="active">Active</option>
                <option value="paused">Paused</option>
                <option value="expense">Expenses</option>
                <option value="income">Income</option>
              </select>
            </div>
          </div>

          {loading ? (
            <div className="flex min-h-64 items-center justify-center gap-3 text-sm text-[#606C5C]">
              <Loader2 className="animate-spin" size={20} /> Loading schedules...
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex min-h-64 flex-col items-center justify-center text-center">
              <div className="mb-4 rounded-2xl bg-[#E9EEE5] p-5 text-[#606C5C]">
                <RefreshCw size={27} />
              </div>
              <h3 className="text-lg font-bold">No recurring transactions yet</h3>
              <p className="mt-2 max-w-sm text-sm text-[#606C5C]">
                Add rent, subscriptions, salary or other regular transactions.
              </p>
              <button
                onClick={openAdd}
                className="mt-5 rounded-xl bg-[#526B4B] px-5 py-3 text-sm font-semibold text-white"
              >
                + Add your first schedule
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map(item => (
                <div
                  key={item.id}
                  className="group flex flex-col justify-between gap-4 rounded-2xl border border-[#E9EEE5] p-4 transition hover:border-[#E9EEE5] hover:bg-[#F7F6F2] sm:flex-row sm:items-center"
                >
                  <div className="flex min-w-0 items-center gap-4">
                    <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${
                      item.type === "income"
                        ? "bg-[#e8f8f0] text-[#27a56c]"
                        : "bg-[#E9EEE5] text-[#606C5C]"
                    }`}>
                      {item.type === "income"
                        ? <TrendingUp size={21} />
                        : <TrendingDown size={21} />}
                    </div>

                    <div className="min-w-0">
                      <h3 className="truncate font-semibold">{item.title}</h3>
                      <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-[#606C5C]">
                        <span>{item.category}</span>
                        <span>·</span>
                        
                        <span>·</span>
                        <span className="capitalize">{item.frequency}</span>
                        <span>·</span>
                        <span className={item.is_active ? "text-[#239b69]" : "text-[#606C5C]"}>
                          {item.is_active ? "Active" : "Paused"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-4 sm:justify-end">
                    <div className="sm:text-right">
                      <p className={`text-lg font-bold ${
                        item.type === "income" ? "text-[#219969]" : "text-[#252823]"
                      }`}>
                        {item.type === "income" ? "+" : "−"}{money(Number(item.amount))}
                      </p>
                      <p className="mt-1 text-xs text-[#606C5C]">
                        Next: {formatDate(item.next_due_date)}
                      </p>
                    </div>

                    <div className="flex items-center gap-1">
                      
  <>
    {item.is_active && item.next_due_date <= today() && (
      <button
        type="button"
        disabled={confirmingId !== null}
        onClick={() => void confirmDue(item)}
        className="rounded-xl bg-[#526B4B] px-4 py-2.5 text-xs font-semibold text-white hover:bg-[#40583B] disabled:opacity-50"
      >
        {confirmingId === String(item.id)
          ? "Confirming..."
          : "Confirm transaction"}
      </button>
    )}
<button
                        onClick={() => toggleStatus(item)}
                        title={item.is_active ? "Pause" : "Resume"}
                        className="rounded-xl p-2.5 text-[#606C5C] hover:bg-[#E9EEE5] hover:text-[#606C5C]"
                      >
                        {item.is_active ? <Pause size={17} /> : <Play size={17} />}
                      </button>
</>
                      <button
                        onClick={() => openEdit(item)}
                        title="Edit"
                        className="rounded-xl p-2.5 text-[#606C5C] hover:bg-[#E9EEE5] hover:text-[#606C5C]"
                      >
                        <Pencil size={17} />
                      </button>
                      <button
                        onClick={() => deleteItem(item)}
                        title="Delete"
                        className="rounded-xl p-2.5 text-[#606C5C] hover:bg-red-50 hover:text-red-500"
                      >
                        <Trash2 size={17} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <p className="mt-5 flex items-start gap-2 text-xs leading-5 text-[#606C5C]">
          <Clock size={15} className="mt-0.5 shrink-0" />
          Schedules currently track due dates and status. They do not automatically
          create transactions or process payments.
        </p>
      </div>

      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-[#252823]/40 p-4 backdrop-blur-sm">
          <div className="my-auto w-full max-w-lg rounded-[26px] bg-white p-6 shadow-2xl md:p-8">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold">
                  {editing ? "Edit schedule" : "New recurring schedule"}
                </h2>
                <p className="mt-1 text-sm text-[#606C5C]">
                  Enter your recurring transaction details.
                </p>
              </div>
              <button
                onClick={() => setModal(false)}
                className="rounded-xl bg-[#E9EEE5] p-2 text-[#606C5C]"
              >
                <X size={19} />
              </button>
            </div>

            <form onSubmit={saveRecurring} className="space-y-4">
              <Field label="Payment method">
                <select
                  value={form.payment_method}
                  onChange={e => setForm({
                    ...form,
                    payment_method: e.target.value
                  })}
                  className="w-full rounded-xl border border-[#DCE5D7] bg-[#FAFBF9] p-3 text-sm"
                >
                  <option value="">Not linked to wallet</option>
                  <option value="cash">Cash wallet</option>
                  <option value="upi">UPI wallet</option>
                </select>
              </Field>

              <Field label="Transaction title">
                <input
                  required
                  value={form.title}
                  onChange={e => setForm({ ...form, title: e.target.value })}
                  placeholder="e.g. Netflix subscription"
                  className="form-input"
                />
              </Field>

              <div className="grid grid-cols-2 gap-3">
                <Field label="Amount (₹)">
                  <input
                    required
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={form.amount}
                    onChange={e => setForm({ ...form, amount: e.target.value })}
                    placeholder="1500"
                    className="form-input"
                  />
                </Field>
                <Field label="Type">
                  <select
                    value={form.type}
                    onChange={e => setForm({ ...form, type: e.target.value })}
                    className="form-input"
                  >
                    <option value="expense">Expense</option>
                    <option value="income">Income</option>
                  </select>
                </Field>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Field label="Category">
                  <select
                    value={form.category}
                    onChange={e => setForm({ ...form, category: e.target.value })}
                    className="form-input"
                  >
                    {categories.map(c => <option key={c}>{c}</option>)}
                  </select>
                </Field>
                <Field label="Frequency">
                  <select
                    value={form.frequency}
                    onChange={e => setForm({ ...form, frequency: e.target.value })}
                    className="form-input"
                  >
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                    <option value="yearly">Yearly</option>
                  </select>
                </Field>
              </div>

              
              <div className="grid grid-cols-2 gap-3">
                <Field label="Next due date">
                  <input
                    required
                    type="date"
                    value={form.next_due_date}
                    onChange={e => setForm({ ...form, next_due_date: e.target.value })}
                    className="form-input"
                  />
                </Field>
                <Field label="End date (optional)">
                  <input
                    type="date"
                    value={form.end_date}
                    min={form.next_due_date}
                    onChange={e => setForm({ ...form, end_date: e.target.value })}
                    className="form-input"
                  />
                </Field>
              </div>

              <button
                disabled={saving}
                type="submit"
                className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl bg-[#526B4B] py-3.5 font-semibold text-white shadow-lg shadow-purple-100 transition hover:bg-[#526B4B] disabled:opacity-60"
              >
                {saving && <Loader2 size={17} className="animate-spin" />}
                {saving ? "Saving..." : editing ? "Save changes" : "Create schedule"}
              </button>
            </form>
          </div>
        </div>
      )}

      <style jsx global>{`
        .form-input {
          width: 100%;
          border: 1px solid #E9EEE5;
          border-radius: 12px;
          padding: 12px;
          background: #F7F6F2;
          color: #252823;
          font-size: 13px;
          outline: none;
          min-width: 0;
        }
        .form-input:focus {
          border-color: #526B4B;
          box-shadow: 0 0 0 3px #E9EEE5;
        }
      `}</style>
    </main>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block min-w-0">
      <span className="mb-2 block text-xs font-semibold text-[#606C5C]">{label}</span>
      {children}
    </label>
  );
}

function StatCard({
  icon, label, value, color
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: string;
}) {
  const styles: Record<string, string> = {
    purple: "bg-[#E9EEE5] text-[#606C5C]",
    blue: "bg-[#eaf3ff] text-[#5795df]",
    orange: "bg-[#fff3e8] text-[#e99a51]",
    green: "bg-[#e8f8f0] text-[#36a879]",
  };

  return (
    <div className="rounded-[22px] border border-[#E9EEE5] bg-white p-5 shadow-sm">
      <div className={`mb-4 flex h-10 w-10 items-center justify-center rounded-xl ${styles[color]}`}>
        {icon}
      </div>
      <p className="text-xs font-medium text-[#606C5C]">{label}</p>
      <p className="mt-2 break-words text-2xl font-bold tracking-tight">{value}</p>
    </div>
  );
}
