
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Search, Plus, ArrowLeft, ArrowUpDown, Pencil, Trash2,
  ShoppingBag, Utensils, Car, House, Wallet, Loader2, X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Transaction = {
  id: string | number;
  title: string;
  amount: number;
  type: "income" | "expense";
  category: string;
  date: string;
};

const categories = [
  "Food & Dining", "Shopping", "Transport", "Housing",
  "Entertainment", "Health", "Education", "Salary", "Other",
];

const money = (n: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency", currency: "INR", maximumFractionDigits: 0,
  }).format(n);

const iconFor = (category: string) => {
  if (category === "Food & Dining") return Utensils;
  if (category === "Shopping") return ShoppingBag;
  if (category === "Transport") return Car;
  if (category === "Housing") return House;
  return Wallet;
};

export default function TransactionsPage() {
  const router = useRouter();
  const [items, setItems] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [sortOrder, setSortOrder] = useState("newest");
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState<Transaction | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [type, setType] = useState<"income" | "expense">("expense");
  const [category, setCategory] = useState("Food & Dining");
  const [date, setDate] = useState(new Date().toLocaleDateString("en-CA"));

  const load = useCallback(async () => {
    setLoading(true);
    const { data: auth } = await supabase.auth.getUser();

    if (!auth.user) {
      router.replace("/login");
      return;
    }

    const { data, error: fetchError } = await supabase
      .from("transactions")
      .select("id,title,amount,type,category,date")
      .eq("user_id", auth.user.id)
      .order("date", { ascending: false });

    if (fetchError) setError(fetchError.message);
    else setItems((data ?? []) as Transaction[]);

    setLoading(false);
  }, [router]);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = useMemo(() => {
    const result = items.filter((t) => {
      const matchesSearch =
        t.title.toLowerCase().includes(search.toLowerCase()) ||
        t.category.toLowerCase().includes(search.toLowerCase());

      return matchesSearch &&
        (typeFilter === "all" || t.type === typeFilter) &&
        (categoryFilter === "all" || t.category === categoryFilter);
    });

    return result.sort((a, b) =>
      sortOrder === "newest"
        ? b.date.localeCompare(a.date)
        : sortOrder === "oldest"
        ? a.date.localeCompare(b.date)
        : sortOrder === "highest"
        ? Number(b.amount) - Number(a.amount)
        : Number(a.amount) - Number(b.amount)
    );
  }, [items, search, typeFilter, categoryFilter, sortOrder]);

  const totalIncome = filtered
    .filter((t) => t.type === "income")
    .reduce((s, t) => s + Number(t.amount), 0);

  const totalExpenses = filtered
    .filter((t) => t.type === "expense")
    .reduce((s, t) => s + Number(t.amount), 0);

  function openForm(item?: Transaction) {
    setEditing(item ?? null);
    setTitle(item?.title ?? "");
    setAmount(item ? String(item.amount) : "");
    setType(item?.type ?? "expense");
    setCategory(item?.category ?? "Food & Dining");
    setDate(item?.date ?? new Date().toLocaleDateString("en-CA"));
    setError("");
    setModal(true);
  }

  async function save(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setError("");

    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) {
      router.replace("/login");
      return;
    }

    const payload = {
      title: title.trim(),
      amount: Number(amount),
      type,
      category,
      date,
    };

    if (!payload.title || !Number.isFinite(payload.amount) ||
        payload.amount <= 0 || !date) {
      setError("Enter valid transaction details.");
      setSaving(false);
      return;
    }

    const result = editing
      ? await supabase.from("transactions").update(payload)
          .eq("id", editing.id).eq("user_id", auth.user.id)
      : await supabase.from("transactions").insert({
          ...payload, user_id: auth.user.id,
        });

    if (result.error) {
      setError(result.error.message);
      setSaving(false);
      return;
    }

    setModal(false);
    setSaving(false);
    await load();
  }

  async function remove(item: Transaction) {
    if (!window.confirm(`Delete "${item.title}"?`)) return;

    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) return router.replace("/login");

    const { error: deleteError } = await supabase
      .from("transactions")
      .delete()
      .eq("id", item.id)
      .eq("user_id", auth.user.id);

    if (deleteError) setError(deleteError.message);
    else await load();
  }

  return (
    <main className="min-h-screen bg-[#f7f6fb] px-4 py-6 text-[#29263d] sm:px-8 lg:px-12">
      <div className="mx-auto max-w-[1250px]">

        <header className="mb-9 flex flex-wrap items-center justify-between gap-4">
          <div>
            <button onClick={() => router.push("/")}
              className="mb-4 flex items-center gap-2 text-xs font-bold text-[#8874cf]">
              <ArrowLeft size={15} /> Back to dashboard
            </button>
            <p className="text-[10px] font-bold tracking-[2px] text-[#aaa5bb]">YOUR FINANCIAL ACTIVITY</p>
            <h1 className="mt-1 text-3xl font-black">Transactions<span className="text-[#8068e5]">.</span></h1>
            <p className="mt-1 text-sm text-[#9994aa]">Track and manage every transaction.</p>
          </div>
          <button onClick={() => openForm()}
            className="flex items-center gap-2 rounded-xl bg-[#765fd6] px-5 py-3.5 text-sm font-bold text-white shadow-lg shadow-violet-200">
            <Plus size={18} /> Add transaction
          </button>
        </header>

        {error && !modal && (
          <div className="mb-5 rounded-xl bg-red-50 p-4 text-sm text-red-600">{error}</div>
        )}

        <div className="mb-6 grid gap-4 sm:grid-cols-3">
          <div className="rounded-[22px] border border-white bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold text-[#aaa5bb]">Transactions found</p>
            <p className="mt-2 text-2xl font-black">{filtered.length}</p>
          </div>
          <div className="rounded-[22px] border border-white bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold text-[#aaa5bb]">Filtered income</p>
            <p className="mt-2 text-2xl font-black text-[#4eae81]">{money(totalIncome)}</p>
          </div>
          <div className="rounded-[22px] border border-white bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold text-[#aaa5bb]">Filtered expenses</p>
            <p className="mt-2 text-2xl font-black text-[#e89173]">{money(totalExpenses)}</p>
          </div>
        </div>

        <section className="rounded-[26px] border border-white bg-white p-5 shadow-sm sm:p-7">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-black">All transactions</h2>
              <p className="mt-1 text-xs text-[#aaa5bb]">Search, filter and organise your records.</p>
            </div>
            <div className="relative w-full sm:max-w-[280px]">
              <Search size={17} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#aaa5bb]" />
              <input value={search} onChange={(e) => setSearch(e.target.value)}
                placeholder="Search transactions..."
                className="w-full rounded-xl border border-[#eeeaf5] bg-[#fcfbfe] py-3 pl-11 pr-4 text-sm outline-none focus:border-[#9274e5]" />
            </div>
          </div>

          <div className="mb-6 grid gap-3 sm:grid-cols-3">
            <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}
              className="rounded-xl border border-[#eeeaf5] bg-[#fcfbfe] px-4 py-3 text-sm outline-none">
              <option value="all">All types</option>
              <option value="income">Income</option>
              <option value="expense">Expenses</option>
            </select>

            <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}
              className="rounded-xl border border-[#eeeaf5] bg-[#fcfbfe] px-4 py-3 text-sm outline-none">
              <option value="all">All categories</option>
              {categories.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>

            <select value={sortOrder} onChange={(e) => setSortOrder(e.target.value)}
              className="rounded-xl border border-[#eeeaf5] bg-[#fcfbfe] px-4 py-3 text-sm outline-none">
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
              <option value="highest">Highest amount</option>
              <option value="lowest">Lowest amount</option>
            </select>
          </div>

          {loading ? (
            <div className="flex justify-center py-20"><Loader2 className="animate-spin text-[#8068e5]" size={32} /></div>
          ) : filtered.length === 0 ? (
            <div className="py-20 text-center">
              <Wallet className="mx-auto mb-4 text-[#b4a8db]" size={38} />
              <p className="font-bold">No transactions found</p>
              <p className="mt-1 text-xs text-[#aaa5bb]">Try changing your filters or add a transaction.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[650px] text-left">
                <thead>
                  <tr className="border-b border-[#f0eef6] text-[10px] font-bold tracking-wider text-[#aaa5bb]">
                    <th className="px-3 py-4">TRANSACTION</th>
                    <th className="px-3 py-4">CATEGORY</th>
                    <th className="px-3 py-4">DATE</th>
                    <th className="px-3 py-4">AMOUNT</th>
                    <th className="px-3 py-4 text-right">ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((item) => {
                    const Icon = iconFor(item.category);
                    return (
                      <tr key={item.id} className="border-b border-[#f5f3f8] transition hover:bg-[#fcfbfe]">
                        <td className="px-3 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#f2effb] text-[#8068e5]"><Icon size={18} /></div>
                            <span className="text-sm font-bold">{item.title}</span>
                          </div>
                        </td>
                        <td className="px-3 py-4 text-xs font-semibold text-[#89849c]">{item.category}</td>
                        <td className="px-3 py-4 text-xs text-[#89849c]">{new Date(`${item.date}T00:00:00`).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</td>
                        <td className={`px-3 py-4 text-sm font-black ${item.type === "income" ? "text-[#4eae81]" : "text-[#e89173]"}`}>
                          {item.type === "income" ? "+" : "-"}{money(Number(item.amount))}
                        </td>
                        <td className="px-3 py-4">
                          <div className="flex justify-end gap-2">
                            <button onClick={() => openForm(item)} title="Edit" className="rounded-lg p-2 text-[#aaa5bb] hover:bg-[#eeeaff] hover:text-[#8068e5]"><Pencil size={16} /></button>
                            <button onClick={() => remove(item)} title="Delete" className="rounded-lg p-2 text-[#aaa5bb] hover:bg-red-50 hover:text-red-500"><Trash2 size={16} /></button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>

      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-[#211b39]/40 p-4 backdrop-blur-sm">
          <div className="my-auto w-full max-w-lg rounded-[28px] bg-white p-7 shadow-2xl">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-2xl font-black">{editing ? "Edit transaction" : "New transaction"}</h2>
              <button onClick={() => setModal(false)}><X size={21} /></button>
            </div>
            <form onSubmit={save} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                {(["expense", "income"] as const).map((v) => (
                  <button key={v} type="button" onClick={() => setType(v)}
                    className={`rounded-xl border py-3 text-sm font-bold capitalize ${type === v ? "border-violet-300 bg-violet-50 text-violet-600" : "border-[#eeeaf5] text-[#aaa5bb]"}`}>{v}</button>
                ))}
              </div>
              <input required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Transaction title"
                className="w-full rounded-xl border border-[#eeeaf5] bg-[#fcfbfe] px-4 py-3.5 text-sm outline-none focus:border-[#9274e5]" />
              <input required type="number" min="0.01" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Amount in ₹"
                className="w-full rounded-xl border border-[#eeeaf5] bg-[#fcfbfe] px-4 py-3.5 text-sm outline-none focus:border-[#9274e5]" />
              <div className="grid grid-cols-2 gap-3">
                <select value={category} onChange={(e) => setCategory(e.target.value)}
                  className="min-w-0 rounded-xl border border-[#eeeaf5] bg-[#fcfbfe] px-3 py-3.5 text-sm outline-none">
                  {categories.map((c) => <option key={c}>{c}</option>)}
                </select>
                <input required type="date" value={date} onChange={(e) => setDate(e.target.value)}
                  className="min-w-0 rounded-xl border border-[#eeeaf5] bg-[#fcfbfe] px-3 py-3.5 text-sm outline-none" />
              </div>
              {error && <p className="rounded-xl bg-red-50 p-3 text-sm text-red-600">{error}</p>}
              <button disabled={saving} type="submit"
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#765fd6] py-4 text-sm font-bold text-white disabled:opacity-60">
                {saving && <Loader2 size={16} className="animate-spin" />}
                {saving ? "Saving..." : editing ? "Save changes" : "Add transaction"}
              </button>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
