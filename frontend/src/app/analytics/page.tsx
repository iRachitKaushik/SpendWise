
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, TrendingUp, TrendingDown, Wallet,
  Loader2, CalendarDays, Sparkles,
} from "lucide-react";
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis,
  CartesianGrid, Tooltip, BarChart, Bar, Legend,
  PieChart, Pie, Cell,
} from "recharts";
import { supabase } from "@/lib/supabase";

type Transaction = {
  id: string | number;
  title: string;
  amount: number;
  type: "income" | "expense";
  category: string;
  date: string;
};

const COLORS = [
  "#8068e5", "#65b99a", "#f2a47e",
  "#70a9df", "#d68cbd", "#e3c76d",
  "#8c9de0", "#86c4cf",
];

const money = (n: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(n);

export default function AnalyticsPage() {
  const router = useRouter();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [period, setPeriod] = useState("6");

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");

    const { data: auth } = await supabase.auth.getUser();

    if (!auth.user) {
      router.replace("/login");
      return;
    }

    const { data, error: fetchError } = await supabase
      .from("transactions")
      .select("id,title,amount,type,category,date")
      .eq("user_id", auth.user.id)
      .order("date", { ascending: true });

    if (fetchError) setError(fetchError.message);
    else setTransactions((data ?? []) as Transaction[]);

    setLoading(false);
  }, [router]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const income = transactions
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const expenses = transactions
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const savings = income - expenses;
  const savingsRate = income > 0 ? (savings / income) * 100 : 0;

  const monthlyData = useMemo(() => {
    const now = new Date();
    const months = [];

    for (let i = Number(period) - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;

      const monthTransactions = transactions.filter(
        (t) => t.date.startsWith(key)
      );

      months.push({
        month: d.toLocaleDateString("en-IN", { month: "short" }),
        income: monthTransactions
          .filter((t) => t.type === "income")
          .reduce((s, t) => s + Number(t.amount), 0),
        expenses: monthTransactions
          .filter((t) => t.type === "expense")
          .reduce((s, t) => s + Number(t.amount), 0),
      });
    }

    return months;
  }, [transactions, period]);

  const categoryData = useMemo(() => {
    const totals: Record<string, number> = {};

    transactions
      .filter((t) => t.type === "expense")
      .forEach((t) => {
        totals[t.category] = (totals[t.category] || 0) + Number(t.amount);
      });

    return Object.entries(totals)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [transactions]);

  const maxCategory = Math.max(...categoryData.map((c) => c.value), 1);

  const averageExpense = transactions.length
    ? monthlyData.reduce((s, m) => s + m.expenses, 0) / Number(period)
    : 0;

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;

    return (
      <div className="rounded-xl border border-[#eeeaf5] bg-white p-4 shadow-xl">
        <p className="mb-2 text-xs font-bold text-[#89849c]">{label}</p>
        {payload.map((entry: any) => (
          <p key={entry.name} className="mt-1 text-xs font-bold" style={{ color: entry.color }}>
            {entry.name}: {money(entry.value)}
          </p>
        ))}
      </div>
    );
  };

  return (
    <main className="min-h-screen bg-[#f7f6fb] px-4 py-6 text-[#29263d] sm:px-8 lg:px-12">
      <div className="mx-auto max-w-[1300px]">

        <header className="mb-9 flex flex-wrap items-center justify-between gap-4">
          <div>
            <button onClick={() => router.push("/")}
              className="mb-4 flex items-center gap-2 text-xs font-bold text-[#8874cf]">
              <ArrowLeft size={15} /> Back to dashboard
            </button>
            <p className="text-[10px] font-bold tracking-[2px] text-[#aaa5bb]">UNDERSTAND YOUR MONEY</p>
            <h1 className="mt-1 text-3xl font-black">Analytics<span className="text-[#8068e5]">.</span></h1>
            <p className="mt-1 text-sm text-[#9994aa]">Insights built from your actual transactions.</p>
          </div>

          <div className="flex items-center gap-2 rounded-xl border border-white bg-white px-4 py-3 shadow-sm">
            <CalendarDays size={16} className="text-[#8068e5]" />
            <select value={period} onChange={(e) => setPeriod(e.target.value)}
              className="bg-transparent text-sm font-semibold outline-none">
              <option value="3">Last 3 months</option>
              <option value="6">Last 6 months</option>
              <option value="12">Last 12 months</option>
            </select>
          </div>
        </header>

        {error && (
          <div className="mb-5 rounded-xl bg-red-50 p-4 text-sm text-red-600">{error}</div>
        )}

        {loading ? (
          <div className="flex min-h-[400px] items-center justify-center">
            <Loader2 size={35} className="animate-spin text-[#8068e5]" />
          </div>
        ) : (
          <>
            <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {[
                { label: "Total income", value: income, icon: TrendingUp, color: "text-[#4eae81]", bg: "bg-[#e8f7ef]" },
                { label: "Total expenses", value: expenses, icon: TrendingDown, color: "text-[#e89173]", bg: "bg-[#fff0e9]" },
                { label: "Net savings", value: savings, icon: Wallet, color: "text-[#8068e5]", bg: "bg-[#eeeaff]" },
                { label: "Savings rate", value: savingsRate, icon: Sparkles, color: "text-[#70a9df]", bg: "bg-[#eaf3ff]" },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.label} className="rounded-[23px] border border-white bg-white p-5 shadow-sm">
                    <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${item.bg} ${item.color}`}>
                      <Icon size={21} />
                    </div>
                    <p className="mt-5 text-xs font-semibold text-[#aaa5bb]">{item.label}</p>
                    <p className="mt-1 break-all text-2xl font-black">
                      {item.label === "Savings rate"
                        ? `${savingsRate.toFixed(1)}%`
                        : money(item.value)}
                    </p>
                  </div>
                );
              })}
            </section>

            <section className="mt-6 rounded-[27px] border border-white bg-white p-6 shadow-sm sm:p-8">
              <div className="mb-7">
                <p className="text-[10px] font-bold tracking-[2px] text-[#aaa5bb]">CASH FLOW</p>
                <h2 className="mt-1 text-xl font-black">Income vs expenses</h2>
                <p className="mt-1 text-xs text-[#aaa5bb]">Monthly financial activity</p>
              </div>

              {transactions.length === 0 ? (
                <p className="py-16 text-center text-sm text-[#aaa5bb]">Add transactions to generate your analytics.</p>
              ) : (
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={monthlyData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="incomeGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#65b99a" stopOpacity={0.25} />
                          <stop offset="95%" stopColor="#65b99a" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="expenseGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#e99a79" stopOpacity={0.25} />
                          <stop offset="95%" stopColor="#e99a79" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#f0eef6" />
                      <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fill: "#aaa5bb", fontSize: 12 }} />
                      <YAxis tickLine={false} axisLine={false} tick={{ fill: "#aaa5bb", fontSize: 11 }} tickFormatter={(v) => `₹${v >= 1000 ? `${v / 1000}k` : v}`} />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend />
                      <Area type="monotone" dataKey="income" name="Income" stroke="#65b99a" strokeWidth={3} fill="url(#incomeGradient)" />
                      <Area type="monotone" dataKey="expenses" name="Expenses" stroke="#e99a79" strokeWidth={3} fill="url(#expenseGradient)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}
            </section>

            <section className="mt-6 grid gap-6 xl:grid-cols-2">
              <div className="rounded-[27px] border border-white bg-white p-6 shadow-sm sm:p-8">
                <p className="text-[10px] font-bold tracking-[2px] text-[#aaa5bb]">SPENDING DISTRIBUTION</p>
                <h2 className="mt-1 text-xl font-black">Where your money goes</h2>

                {categoryData.length === 0 ? (
                  <p className="py-16 text-center text-sm text-[#aaa5bb]">No expense categories available.</p>
                ) : (
                  <>
                    <div className="mt-5 h-[240px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={categoryData} dataKey="value" nameKey="name" innerRadius={65} outerRadius={100} paddingAngle={4}>
                            {categoryData.map((entry, index) => (
                              <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value) => money(Number(value))} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="mt-4 space-y-3">
                      {categoryData.map((item, index) => (
                        <div key={item.name} className="flex items-center justify-between gap-3 text-xs">
                          <div className="flex items-center gap-2">
                            <span className="h-3 w-3 rounded-full" style={{ background: COLORS[index % COLORS.length] }} />
                            <span className="font-semibold">{item.name}</span>
                          </div>
                          <span className="font-bold">{money(item.value)}</span>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>

              <div className="rounded-[27px] border border-white bg-white p-6 shadow-sm sm:p-8">
                <p className="text-[10px] font-bold tracking-[2px] text-[#aaa5bb]">CATEGORY COMPARISON</p>
                <h2 className="mt-1 text-xl font-black">Spending breakdown</h2>

                {categoryData.length === 0 ? (
                  <p className="py-16 text-center text-sm text-[#aaa5bb]">No expense data available.</p>
                ) : (
                  <div className="mt-7 space-y-6">
                    {categoryData.map((item, index) => (
                      <div key={item.name}>
                        <div className="mb-2 flex justify-between gap-3 text-xs">
                          <span className="font-bold">{item.name}</span>
                          <span className="font-semibold text-[#89849c]">{money(item.value)}</span>
                        </div>
                        <div className="h-2.5 overflow-hidden rounded-full bg-[#f0eef6]">
                          <div className="h-full rounded-full transition-all duration-700"
                            style={{ width: `${(item.value / maxCategory) * 100}%`, background: COLORS[index % COLORS.length] }} />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </section>

            <section className="mt-6 rounded-[27px] border border-white bg-white p-6 shadow-sm sm:p-8">
              <p className="text-[10px] font-bold tracking-[2px] text-[#aaa5bb]">MONTHLY PERFORMANCE</p>
              <h2 className="mt-1 text-xl font-black">Monthly comparison</h2>

              <div className="mt-7 h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#f0eef6" />
                    <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fill: "#aaa5bb", fontSize: 12 }} />
                    <YAxis tickLine={false} axisLine={false} tick={{ fill: "#aaa5bb", fontSize: 11 }} tickFormatter={(v) => `₹${v >= 1000 ? `${v / 1000}k` : v}`} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Bar dataKey="income" name="Income" fill="#65b99a" radius={[6, 6, 0, 0]} />
                    <Bar dataKey="expenses" name="Expenses" fill="#e99a79" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </section>

            <section className="mt-6 grid gap-4 sm:grid-cols-2">
              <div className="rounded-[23px] border border-white bg-white p-6 shadow-sm">
                <p className="text-xs font-semibold text-[#aaa5bb]">Average monthly expenses</p>
                <p className="mt-2 text-2xl font-black">{money(averageExpense)}</p>
                <p className="mt-2 text-[10px] text-[#aaa5bb]">Across selected calendar months</p>
              </div>
              <div className="rounded-[23px] border border-white bg-white p-6 shadow-sm">
                <p className="text-xs font-semibold text-[#aaa5bb]">Recorded transactions</p>
                <p className="mt-2 text-2xl font-black">{transactions.length}</p>
                <p className="mt-2 text-[10px] text-[#aaa5bb]">All-time transaction count</p>
              </div>
            </section>
          </>
        )}
      </div>
    </main>
  );
}
