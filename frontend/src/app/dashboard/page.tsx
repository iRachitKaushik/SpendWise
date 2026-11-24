
"use client";

import { SpendWiseSidebar } from "@/components/spendwise-navigation";

import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { useRouter } from "next/navigation";
import {
  LayoutDashboard, ArrowLeftRight, Wallet, ChartNoAxesCombined,
  Settings, Repeat, Target, Brain, Plus, ArrowUpRight, ArrowDownRight, ShoppingBag,
  Utensils, Car, House, Sparkles, Menu, X,
  CalendarDays, Trash2, Pencil, LogOut, TrendingUp, Loader2,
} from "lucide-react";
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

const money = (value: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);

const categoryIcon = (category: string) => {
  if (category === "Food & Dining") return Utensils;
  if (category === "Shopping") return ShoppingBag;
  if (category === "Transport") return Car;
  if (category === "Housing") return House;
  return Wallet;
};

const navItems = [
  { label: "Overview", icon: LayoutDashboard, path: "/dashboard" },
  { label: "Transactions", icon: ArrowLeftRight, path: "/transactions" },
  { label: "Recurring", icon: Repeat, path: "/recurring" },
  { label: "Savings Goals", icon: Target, path: "/goals" },
  { label: "Smart Insights", icon: Brain, path: "/insights" },
  { label: "Budgets", icon: Wallet, path: "/budgets" },
  { label: "Analytics", icon: ChartNoAxesCombined, path: "/analytics" },
];

export default function Home() {
  const router = useRouter();

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [userName, setUserName] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Transaction | null>(null);

  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [type, setType] = useState<"income" | "expense">("expense");
  const [category, setCategory] = useState("Food & Dining");
  const [date, setDate] = useState(new Date().toLocaleDateString("en-CA"));

  const income = useMemo(
    () => transactions
      .filter((t) => t.type === "income")
      .reduce((sum, t) => sum + Number(t.amount), 0),
    [transactions]
  );

  const expenses = useMemo(
    () => transactions
      .filter((t) => t.type === "expense")
      .reduce((sum, t) => sum + Number(t.amount), 0),
    [transactions]
  );

  const balance = income - expenses;

  async function loadTransactions() {
    setLoading(true);
    setError("");

    const { data: authData, error: authError } =
      await supabase.auth.getUser();

    if (authError || !authData.user) {
      router.replace("/login");
      return;
    }

    setUserName(authData.user.user_metadata?.full_name?.trim() || "Your Account");

    const { data, error: fetchError } = await supabase
      .from("transactions")
      .select("id, title, amount, type, category, date")
      .eq("user_id", authData.user.id)
      .order("date", { ascending: false });

    if (fetchError) {
      setError(fetchError.message);
    } else {
      setTransactions((data ?? []) as Transaction[]);
    }

    setLoading(false);
  }

  useEffect(() => {
    loadTransactions();
  }, []);

  function navigateTo(path: string) {
    setMenuOpen(false);
    router.push(path);
  }

  function openAddModal() {
    setEditing(null);
    setTitle("");
    setAmount("");
    setType("expense");
    setCategory("Food & Dining");
    setDate(new Date().toLocaleDateString("en-CA"));
    setError("");
    setModalOpen(true);
  }

  function openEditModal(transaction: Transaction) {
    setEditing(transaction);
    setTitle(transaction.title);
    setAmount(String(transaction.amount));
    setType(transaction.type);
    setCategory(transaction.category);
    setDate(transaction.date);
    setError("");
    setModalOpen(true);
  }

  async function handleSave(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setError("");

    const { data: authData, error: authError } =
      await supabase.auth.getUser();

    if (authError || !authData.user) {
      setError("Your session has expired. Please sign in again.");
      setSaving(false);
      return;
    }

    const transactionData = {
      title: title.trim(),
      amount: Number(amount),
      type,
      category,
      date,
    };

    if (
      !title.trim() ||
      !Number.isFinite(Number(amount)) ||
      Number(amount) <= 0 ||
      !date
    ) {
      setError("Please enter valid transaction details.");
      setSaving(false);
      return;
    }

    const result = editing
      ? await supabase
          .from("transactions")
          .update(transactionData)
          .eq("id", editing.id)
          .eq("user_id", authData.user.id)
          .select()
      : await supabase
          .from("transactions")
          .insert({
            ...transactionData,
            user_id: authData.user.id,
          })
          .select();

    if (result.error) {
      setError(result.error.message);
      setSaving(false);
      return;
    }

    setModalOpen(false);
    setSaving(false);
    await loadTransactions();
  }

  async function handleDelete(id: string | number) {
    if (!window.confirm("Delete this transaction permanently?")) return;

    const { data: authData } = await supabase.auth.getUser();

    if (!authData.user) {
      router.replace("/login");
      return;
    }

    const { error: deleteError } = await supabase
      .from("transactions")
      .delete()
      .eq("id", id)
      .eq("user_id", authData.user.id);

    if (deleteError) {
      setError(deleteError.message);
      return;
    }

    await loadTransactions();
  }

  async function handleLogout() {
    const { error: logoutError } = await supabase.auth.signOut();

    if (logoutError) {
      setError(logoutError.message);
      return;
    }

    router.replace("/login");
    router.refresh();
  }

  const currentMonth = new Date().toISOString().slice(0, 7);

  const monthlyIncome = transactions
    .filter((t) => t.type === "income" && t.date.startsWith(currentMonth))
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const monthlyExpenses = transactions
    .filter((t) => t.type === "expense" && t.date.startsWith(currentMonth))
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const expenseCategories = categories
    .map((name) => ({
      name,
      amount: transactions
        .filter((t) => t.type === "expense" && t.category === name)
        .reduce((sum, t) => sum + Number(t.amount), 0),
    }))
    .filter((item) => item.amount > 0)
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 5);

  const formattedDate = (value: string) =>
    new Date(`${value}T00:00:00`).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });

  return (
    <main data-spendwise-dashboard className="min-h-screen bg-[#F7F6F2] text-[#252823]">
      <div className="mx-auto flex min-h-screen max-w-[1600px] gap-5 p-3 sm:p-5 lg:p-7">

        <aside className={`${menuOpen ? "translate-x-0" : "-translate-x-[120%]"} fixed inset-y-3 left-3 z-50 flex w-[260px] flex-col rounded-[28px] border border-white bg-white p-6 shadow-2xl transition-transform duration-300 lg:sticky lg:top-7 lg:h-[calc(100vh-56px)] lg:translate-x-0`}>
          <div className="mb-12 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-[#526B4B] to-[#526B4B] text-white">
                <Wallet size={22} />
              </div>
              <div>
                <h1 className="text-xl font-black">SpendWise<span className="text-violet-500">.</span></h1>
                <p className="text-[9px] font-bold tracking-[2px] text-[#606C5C]">MONEY, MADE CLEAR</p>
              </div>
            </div>
            <button onClick={() => setMenuOpen(false)} className="lg:hidden"><X /></button>
          </div>

          <p className="mb-4 px-3 text-[10px] font-bold tracking-[2px] text-[#606C5C]">MENU</p>

          <nav className="space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.label}
                  onClick={() => navigateTo(item.path)}
                  className={`flex w-full items-center gap-3 rounded-2xl px-4 py-3.5 text-sm font-semibold transition ${
                    item.path === "/"
                      ? "bg-[#E9EEE5] text-[#606C5C]"
                      : "text-[#606C5C] hover:bg-[#F7F6F2]"
                  }`}
                >
                  <Icon size={19} />
                  {item.label}
                </button>
              );
            })}
          </nav>

          <p className="mb-4 mt-10 px-3 text-[10px] font-bold tracking-[2px] text-[#606C5C]">PREFERENCES</p>

          <button
            onClick={() => navigateTo("/settings")}
            className="flex items-center gap-3 rounded-2xl px-4 py-3.5 text-sm font-semibold text-[#606C5C] transition hover:bg-[#F7F6F2]"
          >
            <Settings size={19} /> Settings
          </button>

          <div className="mt-auto rounded-[23px] bg-gradient-to-br from-[#E9EEE5] to-[#e4f4fa] p-5">
            <Sparkles size={24} className="mb-4 text-[#606C5C]" />
            <p className="text-sm font-bold">Build better habits.</p>
            <p className="mt-1 text-xs leading-5 text-[#606C5C]">Your financial journey starts with small steps.</p>
          </div>

          <div className="mt-5 flex items-center gap-3 border-t border-[#E9EEE5] pt-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#E9EEE5] text-sm font-bold text-[#606C5C]">
              {userName ? userName[0].toUpperCase() : "U"}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-bold">{userName || "Your Account"}</p>
              <p className="text-xs text-[#606C5C]">Personal workspace</p>
            </div>
            <button onClick={handleLogout} title="Sign out" className="text-[#606C5C] hover:text-red-500">
              <LogOut size={19} />
            </button>
          </div>
        </aside>

        {menuOpen && (
          <button
            aria-label="Close menu"
            onClick={() => setMenuOpen(false)}
            className="fixed inset-0 z-40 bg-[#252823]/30 backdrop-blur-sm lg:hidden"
          />
        )}

        <section className="min-w-0 flex-1 px-1 py-3 sm:px-3 lg:px-5 lg:py-4">

          <header className="mb-10 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <button onClick={() => setMenuOpen(true)} className="rounded-xl bg-white p-3 shadow-sm lg:hidden">
                <Menu size={20} />
              </button>
              <div>
                <p className="text-xs font-semibold text-[#606C5C]">{new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" }).toUpperCase()}</p>
                <h2 className="mt-1 text-2xl font-black sm:text-3xl">Your finances<span className="text-[#606C5C]">.</span></h2>
                <p className="mt-1 text-xs text-[#606C5C]">Your money, clearly organised.</p>
              </div>
            </div>
            <button onClick={openAddModal} className="flex items-center gap-2 rounded-xl bg-[#526B4B] px-4 py-3 text-sm font-bold text-white shadow-lg shadow-violet-200 hover:bg-[#526B4B]">
              <Plus size={17} /> <span className="hidden sm:inline">Add transaction</span><span className="sm:hidden">Add</span>
            </button>
          </header>

          {error && !modalOpen && (
            <div className="mb-5 rounded-xl bg-red-50 p-4 text-sm text-red-600">{error}</div>
          )}

          <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-[10px] font-bold tracking-[2.5px] text-[#606C5C]">YOUR FINANCIAL SPACE</p>
              <h3 className="mt-1 text-xl font-black">Overview</h3>
            </div>
            <div className="flex items-center gap-2 rounded-xl border border-white bg-white px-4 py-3 text-xs font-semibold text-[#606C5C] shadow-sm">
              <CalendarDays size={15} /> All time
            </div>
          </div>

          {loading ? (
            <div className="flex min-h-[400px] items-center justify-center">
              <Loader2 className="animate-spin text-[#606C5C]" size={36} />
            </div>
          ) : (
            <>
              <div className="grid gap-5 xl:grid-cols-[1.65fr_1fr]">
                <div className="group relative min-h-[290px] overflow-hidden rounded-[30px] bg-gradient-to-br from-[#526B4B] via-[#526B4B] to-[#526B4B] p-7 text-white shadow-xl shadow-violet-200/60 sm:p-9">
                  <div className="absolute -right-24 -top-32 h-96 w-96 rounded-full border border-white/15 transition-transform duration-700 group-hover:scale-110" />
                  <div className="absolute -right-12 -top-20 h-72 w-72 rounded-full border border-white/15" />
                  <div className="absolute bottom-8 right-8 hidden h-28 w-28 items-center justify-center rounded-full border border-white/20 bg-white/10 sm:flex">
                    <Sparkles size={38} />
                  </div>
                  <div className="relative z-10">
                    <div className="flex items-center gap-2 text-sm font-medium text-white/75">
                      <Wallet size={17} /> Net balance
                      <span className="rounded-full border border-white/20 bg-white/15 px-2.5 py-1 text-[9px] font-bold">LIVE DATA</span>
                    </div>
                    <h3 className="mt-6 break-words text-4xl font-black tracking-tight sm:text-5xl">{money(balance)}</h3>
                    <div className="mt-4 flex items-center gap-2 text-xs text-white/65">
                      <TrendingUp size={15} /> Income minus expenses
                    </div>
                    <div className="mt-9 flex max-w-[370px] gap-12 border-t border-white/20 pt-5">
                      <div>
                        <p className="text-xs text-white/65">Total income</p>
                        <p className="mt-1 text-xl font-bold">{money(income)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-white/65">Total expenses</p>
                        <p className="mt-1 text-xl font-bold">{money(expenses)}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="rounded-[25px] border border-white bg-white p-5 shadow-sm">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#e8f7ef] text-[#4eae81]"><ArrowDownRight size={22} /></div>
                    <p className="mt-6 text-xs font-semibold text-[#606C5C]">Total income</p>
                    <p className="mt-1 break-all text-xl font-black">{money(income)}</p>
                    <p className="mt-2 text-[10px] font-bold text-[#4eae81]">All transactions</p>
                  </div>
                  <div className="rounded-[25px] border border-white bg-white p-5 shadow-sm">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#fff0e9] text-[#e89173]"><ArrowUpRight size={22} /></div>
                    <p className="mt-6 text-xs font-semibold text-[#606C5C]">Total expenses</p>
                    <p className="mt-1 break-all text-xl font-black">{money(expenses)}</p>
                    <p className="mt-2 text-[10px] font-bold text-[#e89173]">All transactions</p>
                  </div>
                  <div className="col-span-2 rounded-[25px] border border-white bg-white p-5 shadow-sm">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs font-semibold text-[#606C5C]">Monthly savings</p>
                        <p className="mt-1 text-2xl font-black">{money(monthlyIncome - monthlyExpenses)}</p>
                      </div>
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#eaf3ff] text-[#699bdb]"><Sparkles size={22} /></div>
                    </div>
                    <p className="mt-2 text-[10px] font-semibold text-[#606C5C]">Current month · income minus expenses</p>
                  </div>
                </div>
              </div>

              <div className="mt-6 grid gap-5 xl:grid-cols-[1.5fr_1fr]">
                <div className="rounded-[28px] border border-white bg-white p-6 shadow-sm sm:p-7">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-bold tracking-[2px] text-[#606C5C]">YOUR ACTIVITY</p>
                      <h3 className="mt-1 text-lg font-black">Recent transactions</h3>
                      <p className="mt-1 text-xs text-[#606C5C]">Your latest financial activity</p>
                    </div>
                    <button onClick={() => navigateTo("/transactions")} className="text-xs font-bold text-[#606C5C]">View all</button>
                  </div>

                  <div className="mt-6 space-y-3">
                    {transactions.length === 0 ? (
                      <div className="py-12 text-center">
                        <Wallet className="mx-auto mb-3 text-[#606C5C]" size={35} />
                        <p className="font-bold text-[#40583B]">No transactions yet</p>
                        <p className="mt-1 text-xs text-[#606C5C]">Add your first transaction to get started.</p>
                        <button onClick={openAddModal} className="mt-4 rounded-xl bg-[#526B4B] px-5 py-3 text-xs font-bold text-white">Add transaction</button>
                      </div>
                    ) : (
                      transactions.slice(0, 7).map((t) => {
                        const Icon = categoryIcon(t.category);
                        return (
                          <div key={t.id} className="flex items-center gap-3 rounded-2xl p-3 transition hover:bg-[#F7F6F2]">
                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#E9EEE5] text-[#606C5C]"><Icon size={19} /></div>
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-bold">{t.title}</p>
                              <p className="mt-1 text-[10px] text-[#606C5C]">{t.category} · {formattedDate(t.date)}</p>
                            </div>
                            <p className={`whitespace-nowrap text-sm font-black ${t.type === "income" ? "text-[#4eae81]" : "text-[#e89173]"}`}>
                              {t.type === "income" ? "+" : "-"}{money(Number(t.amount))}
                            </p>
                            <button onClick={() => openEditModal(t)} title="Edit" className="p-2 text-[#606C5C] hover:text-[#606C5C]"><Pencil size={15} /></button>
                            <button onClick={() => handleDelete(t.id)} title="Delete" className="p-2 text-[#606C5C] hover:text-red-500"><Trash2 size={15} /></button>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                <div className="rounded-[28px] border border-white bg-white p-6 shadow-sm sm:p-7">
                  <p className="text-[10px] font-bold tracking-[2px] text-[#606C5C]">SPENDING INSIGHTS</p>
                  <h3 className="mt-1 text-lg font-black">Expense categories</h3>
                  <p className="mt-1 text-xs text-[#606C5C]">Based on your actual transactions</p>

                  <div className="mt-7 space-y-6">
                    {expenseCategories.length === 0 ? (
                      <p className="py-8 text-center text-sm text-[#606C5C]">No expense data available yet.</p>
                    ) : (
                      expenseCategories.map((item, index) => {
                        const Icon = categoryIcon(item.name);
                        const percentage = expenses > 0 ? (item.amount / expenses) * 100 : 0;
                        return (
                          <div key={item.name}>
                            <div className="mb-2 flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2 text-xs font-bold">
                                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#F7F6F2] text-[#606C5C]"><Icon size={16} /></span>
                                {item.name}
                              </div>
                              <span className="text-xs font-semibold text-[#606C5C]">{money(item.amount)}</span>
                            </div>
                            <div className="h-2 overflow-hidden rounded-full bg-[#E9EEE5]">
                              <div style={{ width: `${percentage}%` }} className={`h-full rounded-full ${["bg-violet-400", "bg-orange-300", "bg-sky-400", "bg-emerald-400", "bg-pink-300"][index]}`} />
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </section>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-[#252823]/40 p-4 backdrop-blur-sm">
          <div className="my-auto w-full max-w-lg rounded-[28px] border border-white bg-white p-6 shadow-2xl sm:p-8">
            <div className="mb-7 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold tracking-[2px] text-[#606C5C]">TRANSACTION MANAGER</p>
                <h2 className="mt-1 text-2xl font-black">{editing ? "Edit transaction" : "New transaction"}</h2>
              </div>
              <button onClick={() => setModalOpen(false)} className="rounded-xl bg-[#E9EEE5] p-2 text-[#606C5C]"><X size={20} /></button>
            </div>

            <form onSubmit={handleSave} className="space-y-5">
              <div className="grid grid-cols-2 gap-3">
                <button type="button" onClick={() => setType("expense")}
                  className={`rounded-xl border py-3 text-sm font-bold ${type === "expense" ? "border-orange-200 bg-orange-50 text-orange-600" : "border-[#E9EEE5] text-[#606C5C]"}`}>
                  Expense
                </button>
                <button type="button" onClick={() => setType("income")}
                  className={`rounded-xl border py-3 text-sm font-bold ${type === "income" ? "border-emerald-200 bg-emerald-50 text-emerald-600" : "border-[#E9EEE5] text-[#606C5C]"}`}>
                  Income
                </button>
              </div>

              <div>
                <label className="mb-2 block text-xs font-bold text-[#40583B]">Transaction title</label>
                <input required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Grocery shopping"
                  className="w-full rounded-xl border border-[#E9EEE5] bg-[#F7F6F2] px-4 py-3.5 text-sm outline-none focus:border-[#526B4B]" />
              </div>

              <div>
                <label className="mb-2 block text-xs font-bold text-[#40583B]">Amount (₹)</label>
                <input required type="number" min="0.01" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Enter amount"
                  className="w-full rounded-xl border border-[#E9EEE5] bg-[#F7F6F2] px-4 py-3.5 text-sm outline-none focus:border-[#526B4B]" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-2 block text-xs font-bold text-[#40583B]">Category</label>
                  <select value={category} onChange={(e) => setCategory(e.target.value)}
                    className="w-full rounded-xl border border-[#E9EEE5] bg-[#F7F6F2] px-3 py-3.5 text-sm outline-none focus:border-[#526B4B]">
                    {categories.map((item) => <option key={item}>{item}</option>)}
                  </select>
                </div>
                <div>
                  <label className="mb-2 block text-xs font-bold text-[#40583B]">Date</label>
                  <input required type="date" value={date} onChange={(e) => setDate(e.target.value)}
                    className="w-full min-w-0 rounded-xl border border-[#E9EEE5] bg-[#F7F6F2] px-3 py-3.5 text-sm outline-none focus:border-[#526B4B]" />
                </div>
              </div>

              <div>
                
                
              </div>
              {error && <p className="rounded-xl bg-red-50 p-3 text-sm text-red-600">{error}</p>}

              <button type="submit" disabled={saving}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#526B4B] py-4 text-sm font-bold text-white shadow-lg shadow-purple-200 disabled:opacity-60">
                {saving && <Loader2 size={17} className="animate-spin" />}
                {saving ? "Saving..." : editing ? "Save changes" : "Add transaction"}
              </button>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
