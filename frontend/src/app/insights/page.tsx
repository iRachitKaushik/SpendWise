
"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, ArrowUpRight, ArrowDownRight, Sparkles,
  TrendingUp, TrendingDown, Wallet, Target, Lightbulb,
  CalendarDays, Loader2, RefreshCw, AlertTriangle,
  CheckCircle2, PieChart, Brain
} from "lucide-react";
import { supabase } from "@/lib/supabase";

type Transaction = {
  id: number;
  title: string;
  amount: number;
  type: string;
  category: string;
  date: string;
};

const money = (value: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);

const COLORS = [
  "#526B4B", "#55BFA5", "#F5A66C", "#70A8E8",
  "#E88CA8", "#526B4B", "#E4BE62", "#78B7C5",
];

export default function InsightsPage() {
  const router = useRouter();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState("3");
  const [error, setError] = useState("");

  async function loadData() {
    setLoading(true);
    setError("");

    const { data: authData, error: authError } =
      await supabase.auth.getUser();

    if (authError || !authData.user) {
      router.replace("/login");
      return;
    }

    const { data, error: fetchError } = await supabase
      .from("transactions")
      .select("id,title,amount,type,category,date")
      .eq("user_id", authData.user.id)
      .order("date", { ascending: false });

    if (fetchError) {
      setError(fetchError.message);
      setLoading(false);
      return;
    }

    setTransactions((data || []) as Transaction[]);
    setLoading(false);
  }

  useEffect(() => {
    loadData();
  }, []);

  const analysis = useMemo(() => {
    const now = new Date();
    const months = Number(period);
    const currentStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const previousStart = new Date(
      now.getFullYear(),
      now.getMonth() - 1,
      1
    );

    const selectedStart = new Date(
      now.getFullYear(),
      now.getMonth() - months + 1,
      1
    );

    const current = transactions.filter(
      (t) => new Date(t.date + "T00:00:00") >= currentStart
    );

    const previous = transactions.filter((t) => {
      const date = new Date(t.date + "T00:00:00");
      return date >= previousStart && date < currentStart;
    });

    const selected = transactions.filter(
      (t) => new Date(t.date + "T00:00:00") >= selectedStart
    );

    const sum = (items: Transaction[], type: string) =>
      items
        .filter((t) => t.type.toLowerCase() === type)
        .reduce((total, t) => total + Number(t.amount || 0), 0);

    const income = sum(current, "income");
    const expenses = sum(current, "expense");
    const previousExpenses = sum(previous, "expense");
    const previousIncome = sum(previous, "income");

    const categories = new Map<string, number>();

    selected
      .filter((t) => t.type.toLowerCase() === "expense")
      .forEach((t) => {
        const category = t.category || "Other";
        categories.set(
          category,
          (categories.get(category) || 0) + Number(t.amount || 0)
        );
      });

    const categoryData = Array.from(categories.entries())
      .map(([name, amount]) => ({ name, amount }))
      .sort((a, b) => b.amount - a.amount);

    const totalSelectedExpenses = categoryData.reduce(
      (total, item) => total + item.amount,
      0
    );

    const change =
      previousExpenses > 0
        ? ((expenses - previousExpenses) / previousExpenses) * 100
        : null;

    const savings = income - expenses;
    const savingsRate =
      income > 0 ? (savings / income) * 100 : null;

    const averageExpense =
      categoryData.length > 0
        ? totalSelectedExpenses / months
        : 0;

    const topCategory = categoryData[0];

    const monthLabel = now.toLocaleDateString("en-IN", {
      month: "long",
      year: "numeric",
    });

    return {
      income,
      expenses,
      savings,
      savingsRate,
      previousExpenses,
      previousIncome,
      change,
      categoryData,
      totalSelectedExpenses,
      averageExpense,
      topCategory,
      monthLabel,
      transactionCount: current.length,
    };
  }, [transactions, period]);

  const insights = useMemo(() => {
    const result: {
      title: string;
      description: string;
      icon: typeof Lightbulb;
      color: string;
    }[] = [];

    const a = analysis;

    if (a.transactionCount === 0) {
      result.push({
        title: "No transactions this month",
        description:
          "Add your income and expenses to start generating personalized insights.",
        icon: Lightbulb,
        color: "#526B4B",
      });
      return result;
    }

    if (a.savingsRate !== null) {
      if (a.savingsRate >= 20) {
        result.push({
          title: "Healthy savings rate",
          description: `You are saving ${a.savingsRate.toFixed(1)}% of your recorded income this month.`,
          icon: CheckCircle2,
          color: "#38A98B",
        });
      } else if (a.savingsRate >= 0) {
        result.push({
          title: "Room to improve savings",
          description:
            "Your savings rate is below 20%. Review discretionary expenses and identify areas to reduce spending.",
          icon: Target,
          color: "#D99A43",
        });
      } else {
        result.push({
          title: "Expenses exceed income",
          description:
            "Your recorded expenses are higher than your income this month. Review your largest spending categories.",
          icon: AlertTriangle,
          color: "#E07878",
        });
      }
    }

    if (a.change !== null) {
      if (a.change > 10) {
        result.push({
          title: "Spending has increased",
          description: `Your expenses are ${a.change.toFixed(1)}% higher than last month.`,
          icon: TrendingUp,
          color: "#E07878",
        });
      } else if (a.change < -10) {
        result.push({
          title: "Spending has decreased",
          description: `Your expenses are ${Math.abs(a.change).toFixed(1)}% lower than last month.`,
          icon: TrendingDown,
          color: "#38A98B",
        });
      } else {
        result.push({
          title: "Spending is relatively stable",
          description:
            "Your expenses are within 10% of last month's recorded spending.",
          icon: CheckCircle2,
          color: "#70A8E8",
        });
      }
    }

    if (a.topCategory) {
      const share =
        a.totalSelectedExpenses > 0
          ? (a.topCategory.amount / a.totalSelectedExpenses) * 100
          : 0;

      result.push({
        title: `${a.topCategory.name} is your top expense`,
        description: `This category represents ${share.toFixed(1)}% of your recorded expenses over the selected period.`,
        icon: PieChart,
        color: "#526B4B",
      });
    }

    return result;
  }, [analysis]);

  const maxCategory = analysis.categoryData[0]?.amount || 1;

  return (
    <main className="min-h-screen bg-[#F7F6F2] text-[#252823]">
      <div className="mx-auto max-w-[1450px] px-5 py-7 md:px-10 md:py-10">

        <header className="mb-9 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push("/dashboard")}
              className="rounded-xl border border-[#E9EEE5] bg-white p-3 transition hover:bg-[#E9EEE5]"
            >
              <ArrowLeft size={19} />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <Sparkles size={17} className="text-[#606C5C]" />
                <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[#606C5C]">
                  SpendWise Intelligence
                </span>
              </div>
              <h1 className="mt-1 text-2xl font-bold tracking-tight md:text-3xl">
                Smart Insights
              </h1>
            </div>
          </div>

          <button
            onClick={loadData}
            disabled={loading}
            className="flex items-center gap-2 rounded-xl border border-[#E9EEE5] bg-white px-4 py-3 text-sm font-semibold hover:bg-[#E9EEE5] disabled:opacity-50"
          >
            <RefreshCw size={16} />
            Refresh
          </button>
        </header>

        {loading ? (
          <div className="flex min-h-[400px] items-center justify-center">
            <Loader2 className="animate-spin text-[#606C5C]" size={34} />
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-red-100 bg-white p-8 text-center">
            <AlertTriangle className="mx-auto mb-3 text-red-400" size={30} />
            <p className="font-semibold">Unable to load insights</p>
            <p className="mt-2 text-sm text-gray-500">{error}</p>
            <button
              onClick={loadData}
              className="mt-5 rounded-xl bg-[#526B4B] px-5 py-3 text-sm font-semibold text-white"
            >
              Try again
            </button>
          </div>
        ) : (
          <>
            <section className="mb-7 flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-sm text-[#606C5C]">Financial overview</p>
                <h2 className="mt-1 text-xl font-bold">{analysis.monthLabel}</h2>
              </div>
              <select
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
                className="rounded-xl border border-[#E9EEE5] bg-white px-4 py-3 text-sm font-semibold outline-none"
              >
                <option value="3">Last 3 months</option>
                <option value="6">Last 6 months</option>
                <option value="12">Last 12 months</option>
              </select>
            </section>

            <section className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
              {[
                {
                  label: "Monthly income",
                  value: analysis.income,
                  icon: ArrowDownRight,
                  color: "#38A98B",
                  bg: "#E8F7F1",
                },
                {
                  label: "Monthly expenses",
                  value: analysis.expenses,
                  icon: ArrowUpRight,
                  color: "#E07878",
                  bg: "#FFF0EE",
                },
                {
                  label: "Net savings",
                  value: analysis.savings,
                  icon: Wallet,
                  color: "#526B4B",
                  bg: "#E9EEE5",
                },
                {
                  label: "Savings rate",
                  value:
                    analysis.savingsRate === null
                      ? null
                      : `${analysis.savingsRate.toFixed(1)}%`,
                  icon: Target,
                  color: "#70A8E8",
                  bg: "#EDF5FF",
                  isText: true,
                },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.label}
                    className="rounded-[24px] border border-[#E9EEE5] bg-white p-6 shadow-[0_4px_24px_rgba(43,35,78,0.035)]"
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-[#606C5C]">{item.label}</p>
                      <div
                        className="rounded-xl p-3"
                        style={{ background: item.bg, color: item.color }}
                      >
                        <Icon size={19} />
                      </div>
                    </div>
                    <h3 className="mt-5 text-2xl font-bold tracking-tight">
                      {item.isText
                        ? item.value ?? "N/A"
                        : money(Number(item.value))}
                    </h3>
                    <p className="mt-2 text-xs text-[#606C5C]">
                      Current month
                    </p>
                  </div>
                );
              })}
            </section>

            <section className="mt-7 grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
              <div className="rounded-[26px] border border-[#E9EEE5] bg-white p-6 md:p-8">
                <div className="mb-7 flex items-center gap-3">
                  <div className="rounded-xl bg-[#E9EEE5] p-3 text-[#606C5C]">
                    <Brain size={21} />
                  </div>
                  <div>
                    <h3 className="font-bold">Your financial insights</h3>
                    <p className="mt-1 text-xs text-[#606C5C]">
                      Generated from your transaction history
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  {insights.map((item, index) => {
                    const Icon = item.icon;
                    return (
                      <div
                        key={index}
                        className="flex gap-4 rounded-2xl bg-[#F7F6F2] p-5"
                      >
                        <div
                          className="h-fit rounded-xl p-3"
                          style={{
                            background: `${item.color}18`,
                            color: item.color,
                          }}
                        >
                          <Icon size={20} />
                        </div>
                        <div>
                          <h4 className="text-sm font-bold">{item.title}</h4>
                          <p className="mt-2 text-sm leading-6 text-[#606C5C]">
                            {item.description}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="rounded-[26px] border border-[#E9EEE5] bg-white p-6 md:p-8">
                <div className="mb-7 flex items-center gap-3">
                  <div className="rounded-xl bg-[#EAF7F2] p-3 text-[#38A98B]">
                    <PieChart size={21} />
                  </div>
                  <div>
                    <h3 className="font-bold">Expense breakdown</h3>
                    <p className="mt-1 text-xs text-[#606C5C]">
                      Selected period
                    </p>
                  </div>
                </div>

                {analysis.categoryData.length === 0 ? (
                  <p className="py-12 text-center text-sm text-[#606C5C]">
                    No expense data available.
                  </p>
                ) : (
                  <>
                    <div className="mb-7 text-center">
                      <p className="text-xs text-[#606C5C]">
                        Total expenses
                      </p>
                      <h3 className="mt-2 text-3xl font-bold">
                        {money(analysis.totalSelectedExpenses)}
                      </h3>
                    </div>

                    <div className="space-y-5">
                      {analysis.categoryData.slice(0, 7).map((item, i) => (
                        <div key={item.name}>
                          <div className="mb-2 flex justify-between gap-3 text-sm">
                            <span className="font-medium">{item.name}</span>
                            <span className="text-[#606C5C]">
                              {money(item.amount)}
                            </span>
                          </div>
                          <div className="h-2 overflow-hidden rounded-full bg-[#E9EEE5]">
                            <div
                              className="h-full rounded-full"
                              style={{
                                width: `${(item.amount / maxCategory) * 100}%`,
                                background: COLORS[i % COLORS.length],
                              }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </section>

            <section className="mt-7 grid gap-5 md:grid-cols-2">
              <div className="rounded-[24px] border border-[#E9EEE5] bg-white p-6">
                <div className="flex items-center gap-3">
                  <div className="rounded-xl bg-[#FFF3E8] p-3 text-[#E39A55]">
                    <CalendarDays size={20} />
                  </div>
                  <h3 className="font-bold">Month comparison</h3>
                </div>
                <div className="mt-6 space-y-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-[#606C5C]">Last month expenses</span>
                    <strong>{money(analysis.previousExpenses)}</strong>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-[#606C5C]">This month expenses</span>
                    <strong>{money(analysis.expenses)}</strong>
                  </div>
                  <div className="rounded-xl bg-[#F7F6F2] p-4">
                    <p className="text-xs text-[#606C5C]">
                      Change compared to last month
                    </p>
                    <p
                      className={`mt-2 text-xl font-bold ${
                        analysis.change === null
                          ? "text-[#606C5C]"
                          : analysis.change > 0
                            ? "text-[#E07878]"
                            : "text-[#38A98B]"
                      }`}
                    >
                      {analysis.change === null
                        ? "Not enough data"
                        : `${analysis.change > 0 ? "+" : ""}${analysis.change.toFixed(1)}%`}
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-[24px] border border-[#E9EEE5] bg-white p-6">
                <div className="flex items-center gap-3">
                  <div className="rounded-xl bg-[#EDF5FF] p-3 text-[#70A8E8]">
                    <Lightbulb size={20} />
                  </div>
                  <h3 className="font-bold">Spending summary</h3>
                </div>
                <div className="mt-6 space-y-5">
                  <div>
                    <p className="text-xs text-[#606C5C]">
                      Average monthly expenses
                    </p>
                    <h3 className="mt-2 text-2xl font-bold">
                      {money(analysis.averageExpense)}
                    </h3>
                  </div>
                  <div>
                    <p className="text-xs text-[#606C5C]">
                      Top spending category
                    </p>
                    <h3 className="mt-2 text-xl font-bold">
                      {analysis.topCategory?.name || "No data"}
                    </h3>
                  </div>
                  <div>
                    <p className="text-xs text-[#606C5C]">
                      Transactions this month
                    </p>
                    <h3 className="mt-2 text-2xl font-bold">
                      {analysis.transactionCount}
                    </h3>
                  </div>
                </div>
              </div>
            </section>

            <p className="mt-7 text-center text-xs leading-5 text-[#606C5C]">
              Insights are calculated from recorded transactions. They are
              informational estimates, not financial advice. The current
              month may be incomplete.
            </p>
          </>
        )}
      </div>
    </main>
  );
}
