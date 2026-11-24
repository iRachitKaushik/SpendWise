"use client";

import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import {
  Banknote, Smartphone, Wallet,
  Plus, X, RefreshCw, Loader2, ArrowLeftRight, History, Trash2
} from "lucide-react";
import { supabase } from "@/lib/supabase";

type WalletType = "cash" | "upi";

type Account = {
  id: string;
  wallet_type: WalletType;
  opening_balance: number;
  opening_date: string;
};

type Entry = {
  id: string | number;
  title: string;
  created_at?: string;
  amount: number;
  type: "income" | "expense";
  payment_method: WalletType | null;
  date: string;
};

type Topup = {
  id: string;
  wallet_id: string;
  amount: number;
  funding_date: string;
  created_at: string;
};

type Transfer = {
  id: string;
  from_wallet_id: string;
  to_wallet_id: string;
  amount: number;
  transfer_date: string;
  created_at: string;
};

const money = (value: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2
  }).format(value);

const paise = (value: number) =>
  Math.round(Number(value) * 100);

async function fetchAll<T>(
  fetchPage: (from: number, to: number) => PromiseLike<{
    data: T[] | null;
    error: { message: string } | null;
  }>
): Promise<T[]> {
  const result: T[] = [];
  const size = 500;

  for (let from = 0; ; from += size) {
    const { data, error } = await fetchPage(
      from, from + size - 1
    );

    if (error) throw new Error(error.message);

    const rows = data ?? [];
    result.push(...rows);

    if (rows.length < size) break;
  }

  return result;
}

export default function WalletsPage() {
  const [balances, setBalances] = useState({
    cash: 0,
    upi: 0
  });

  const [loading, setLoading] = useState(true);
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [selected, setSelected] = useState<WalletType>("cash");
  const [amount, setAmount] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [transferFrom, setTransferFrom] = useState<WalletType>("cash");
  const [transferAmount, setTransferAmount] = useState("");
  const [transferring, setTransferring] = useState(false);
  const [transferError, setTransferError] = useState("");
  const [deleting, setDeleting] = useState<string | null>(null);
  const [activityError, setActivityError] = useState("");
  const [activity, setActivity] = useState<{
    id: string;
    title: string;
    date: string;
    amount: number;
    kind: "topup" | "transfer" | "income" | "expense";
  }[]>([]);

  const transferTo: WalletType =
    transferFrom === "cash" ? "upi" : "cash";

  async function loadWallets() {
    setLoading(true);
    setError("");

    try {
      const { data, error: authError } =
        await supabase.auth.getUser();

      if (authError || !data.user) {
        throw new Error("Please sign in again.");
      }

      const uid = data.user.id;

      const now = new Date();

      const today = [
        now.getFullYear(),
        String(now.getMonth() + 1).padStart(2, "0"),
        String(now.getDate()).padStart(2, "0")
      ].join("-");

      const [
        accounts,
        transactions,
        topups,
        transfers
      ] = await Promise.all([

        fetchAll<Account>((from, to) =>
          supabase.from("wallet_accounts")
            .select("id,wallet_type,opening_balance,opening_date")
            .eq("user_id", uid)
            .order("id")
            .range(from, to)
        ),

        fetchAll<Entry>((from, to) =>
          supabase.from("transactions")
            .select("*")
            .eq("user_id", uid)
            .in("payment_method", ["cash", "upi"])
            .lte("date", today)
            .order("id")
            .range(from, to)
        ),

        fetchAll<Topup>((from, to) =>
          supabase.from("wallet_topups")
            .select("id,wallet_id,amount,funding_date,created_at")
            .eq("user_id", uid)
            .lte("funding_date", today)
            .order("id")
            .range(from, to)
        ),

        fetchAll<Transfer>((from, to) =>
          supabase.from("wallet_transfers")
            .select("id,from_wallet_id,to_wallet_id,amount,transfer_date,created_at")
            .eq("user_id", uid)
            .lte("transfer_date", today)
            .order("id")
            .range(from, to)
        )

      ]);

      const next = { cash: 0, upi: 0 };

      for (const account of accounts) {
        if (account.opening_date > today) continue;

        let balance = paise(account.opening_balance);

        for (const item of topups) {
          if (
            item.wallet_id === account.id &&
            item.funding_date >= account.opening_date
          ) {
            balance += paise(item.amount);
          }
        }

        for (const item of transactions) {
          if (
            item.payment_method === account.wallet_type &&
            item.date >= account.opening_date
          ) {
            balance += item.type === "income"
              ? paise(item.amount)
              : -paise(item.amount);
          }
        }

        for (const item of transfers) {
          if (item.transfer_date < account.opening_date) {
            continue;
          }

          if (item.from_wallet_id === account.id) {
            balance -= paise(item.amount);
          }

          if (item.to_wallet_id === account.id) {
            balance += paise(item.amount);
          }
        }

        next[account.wallet_type] = balance / 100;
      }

      const walletName = (id: string) =>
        accounts.find(a => a.id === id)?.wallet_type.toUpperCase()
        ?? "Wallet";

      setActivity([
        ...transactions.filter(item =>
          accounts.some(account =>
            account.wallet_type === item.payment_method &&
            item.date >= account.opening_date &&
            account.opening_date <= today
          )
        ).map(item => ({
          id: String(item.id),
          title: `${item.title} · ${item.payment_method?.toUpperCase()}`,
          date: item.date,
          created_at: item.created_at || `${item.date}T00:00:00Z`,
          amount: Number(item.amount),
          kind: item.type
        })),
        ...topups.map(item => ({
          id: item.id,
          title: `Money added to ${walletName(item.wallet_id)}`,
          date: item.funding_date,
          created_at: item.created_at,
          amount: Number(item.amount),
          kind: "topup" as const
        })),
        ...transfers.map(item => ({
          id: item.id,
          title: `${walletName(item.from_wallet_id)} → ${walletName(item.to_wallet_id)}`,
          date: item.transfer_date,
          created_at: item.created_at,
          amount: Number(item.amount),
          kind: "transfer" as const
        }))
      ].sort((a, b) => b.date.localeCompare(a.date) ||
        Date.parse(b.created_at) - Date.parse(a.created_at)));

      setBalances(next);
      setLoaded(true);

    } catch (err) {
      setLoaded(false);
      setError(
        err instanceof Error
          ? err.message
          : "Could not load wallets."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadWallets();
  }, []);

  async function transferMoney(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (transferring || saving || loading || !loaded) return;

    setTransferError("");
    setMessage("");

    const value = Number(transferAmount);

    if (!Number.isFinite(value) || value <= 0 ||
        !/^\d+(\.\d{1,2})?$/.test(transferAmount.trim())) {
      setTransferError("Enter a valid transfer amount.");
      return;
    }

    if (value > balances[transferFrom]) {
      setTransferError("Insufficient wallet balance.");
      return;
    }

    setTransferring(true);

    try {
      const { error } = await supabase.rpc(
        "transfer_wallet_money",
        {
          p_from: transferFrom,
          p_to: transferTo,
          p_amount: value
        }
      );

      if (error) throw new Error(error.message);

      setTransferAmount("");
      setMessage(
        `${money(value)} transferred from ${transferFrom.toUpperCase()} to ${transferTo.toUpperCase()}.`
      );

      await loadWallets();

    } catch (err) {
      setTransferError(
        err instanceof Error ? err.message : "Transfer failed."
      );
    } finally {
      setTransferring(false);
    }
  }

  async function deleteActivity(item: typeof activity[number]) {
    if (item.kind !== "topup" && item.kind !== "transfer") return;
    if (deleting || saving || transferring || loading) return;

    const confirmed = window.confirm(
      `Delete "${item.title}" (${money(item.amount)})? Your wallet balances will be recalculated.`
    );

    if (!confirmed) return;

    setDeleting(item.id);
    setActivityError("");
    setMessage("");

    try {
      const { data, error: authError } =
        await supabase.auth.getUser();

      if (authError || !data.user) {
        throw new Error("Please sign in again.");
      }

      const table = item.kind === "topup"
        ? "wallet_topups"
        : "wallet_transfers";

      const { data: removed, error } = await supabase
        .from(table)
        .delete()
        .eq("id", item.id)
        .eq("user_id", data.user.id)
        .select("id")
        .single();

      if (error || !removed) {
        throw new Error(error?.message || "Entry not found.");
      }

      await loadWallets();
      setMessage("Wallet entry removed. Balances recalculated.");

    } catch (err) {
      setActivityError(
        err instanceof Error ? err.message : "Deletion failed."
      );
    } finally {
      setDeleting(null);
    }
  }

  function openAdd(type: WalletType) {
    setSelected(type);
    setAmount("");
    setError("");
    setMessage("");
    setShowAdd(true);
  }

  async function addMoney(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (saving) return;

    const value = Number(amount);

    if (
      !Number.isFinite(value) ||
      value <= 0 ||
      !/^\d+(\.\d{1,2})?$/.test(amount.trim())
    ) {
      setError("Enter a valid positive amount.");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const { error } = await supabase.rpc(
        "add_wallet_money",
        {
          p_wallet_type: selected,
          p_amount: value
        }
      );

      if (error) throw new Error(error.message);

      setShowAdd(false);
      setAmount("");
      setMessage(
        `${money(value)} added to your ${selected.toUpperCase()} wallet.`
      );

      await loadWallets();

    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not add money."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#F7F6F2] px-4 py-6 text-[#252823] sm:px-7">

      <div className="mx-auto max-w-6xl">

        <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="mb-2 text-[10px] font-bold tracking-[0.2em] text-[#526B4B]">
              YOUR MONEY, ORGANIZED
            </p>

            <h1 className="text-4xl">Your wallets.</h1>

            <p className="mt-3 text-sm text-[#687363]">
              Keep track of your available cash and UPI money.
            </p>
          </div>

          <button
            disabled={loading || saving}
            onClick={() => void loadWallets()}
            className="flex items-center gap-2 rounded-xl border border-[#DCE5D7] bg-white px-4 py-3 text-sm disabled:opacity-50"
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
        </header>

        {!showAdd && error && (
          <div role="alert" className="mb-5 rounded-xl bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {message && (
          <div role="status" className="mb-5 rounded-xl bg-[#E4EDE0] p-4 text-sm text-[#40583B]">
            {message}
          </div>
        )}

        <section className="rounded-[28px] bg-[#526B4B] p-8 text-white">

          <Wallet size={28} className="mb-7 text-[#DCE5D7]" />

          <p className="text-sm text-[#DCE5D7]">
            Total available balance
          </p>

          <p className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">
            {loading ? "Loading..." : loaded
              ? money(balances.cash + balances.upi)
              : "Unavailable"}
          </p>

          <p className="mt-4 text-xs text-[#DCE5D7]">
            Across Cash and UPI
          </p>

        </section>

        <div className="mt-5 grid gap-5 sm:grid-cols-2">

          {([
            {
              type: "cash",
              title: "Cash wallet",
              subtitle: "Physical money",
              icon: Banknote
            },
            {
              type: "upi",
              title: "UPI wallet",
              subtitle: "Digital money",
              icon: Smartphone
            }
          ] as const).map(item => (

            <section
              key={item.type}
              className="rounded-[24px] border border-[#E0E5DA] bg-white p-6"
            >

              <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#E4EDE0] text-[#526B4B]">
                <item.icon size={25} />
              </div>

              <p className="font-semibold">{item.title}</p>

              <p className="mt-1 text-xs text-[#687363]">
                {item.subtitle}
              </p>

              <p className="mt-5 text-3xl font-semibold tracking-tight">
                {loading ? "..." : loaded
                  ? money(balances[item.type])
                  : "Unavailable"}
              </p>

              {loaded && balances[item.type] < 0 && (
                <p className="mt-2 text-xs text-red-600">
                  Negative balance. Review your recorded transactions.
                </p>
              )}

              <button
                disabled={loading || !loaded || saving}
                onClick={() => openAdd(item.type)}
                className="mt-7 flex w-full items-center justify-center gap-2 rounded-xl bg-[#E4EDE0] py-3 text-sm font-semibold text-[#40583B] hover:bg-[#DCE5D7] disabled:opacity-50"
              >
                <Plus size={17} />
                Add money
              </button>

            </section>
          ))}

        </div>

        <div className="mt-6 grid gap-5 xl:grid-cols-2">

          <section className="rounded-[24px] border border-[#E0E5DA] bg-white p-6">

            <ArrowLeftRight size={25} className="mb-4 text-[#526B4B]" />
            <h2 className="text-2xl">Transfer money.</h2>

            <p className="mt-2 text-sm text-[#687363]">
              Move money between your wallets.
            </p>

            <form onSubmit={transferMoney} className="mt-6 space-y-4">

              <div>
                <label className="mb-2 block text-sm font-semibold">
                  Transfer from
                </label>
                <select
                  value={transferFrom}
                  disabled={transferring}
                  onChange={e => {
                    setTransferFrom(e.target.value as WalletType);
                    setTransferError("");
                  }}
                  className="w-full rounded-xl border border-[#DCE5D7] bg-[#FAFBF9] p-3 text-sm"
                >
                  <option value="cash">Cash wallet</option>
                  <option value="upi">UPI wallet</option>
                </select>
              </div>

              <div>
                <p className="mb-2 text-sm font-semibold">
                  Transfer to
                </p>
                <div className="rounded-xl bg-[#E9EEE5] p-3 text-sm font-medium text-[#40583B]">
                  {transferTo === "cash" ? "Cash wallet" : "UPI wallet"}
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold">
                  Amount (₹)
                </label>
                <input
                  required
                  disabled={transferring}
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={transferAmount}
                  onChange={e => setTransferAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full rounded-xl border border-[#DCE5D7] bg-[#FAFBF9] p-4"
                />
                {loaded && (
                  <p className="mt-2 text-xs text-[#687363]">
                    Available: {money(balances[transferFrom])}
                  </p>
                )}
              </div>

              {transferError && (
                <p role="alert" className="text-sm text-red-600">
                  {transferError}
                </p>
              )}

              <button
                type="submit"
                disabled={loading || !loaded || saving || transferring}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#526B4B] py-4 text-sm font-semibold text-white hover:bg-[#40583B] disabled:opacity-50"
              >
                <ArrowLeftRight size={17} />
                {transferring ? "Transferring..." : "Transfer money"}
              </button>

            </form>
          </section>

          <section className="rounded-[24px] border border-[#E0E5DA] bg-white p-6">

            <History size={25} className="mb-4 text-[#526B4B]" />
            <h2 className="text-2xl">Recent activity.</h2>

            <p className="mt-2 text-sm text-[#687363]">
              Your wallet funding, transfers, income and expenses.
            </p>

            {activityError && (
              <p role="alert" className="mt-4 text-sm text-red-600">
                {activityError}
              </p>
            )}

            <div className="mt-5 max-h-[400px] divide-y divide-[#E0E5DA] overflow-y-auto">

              {!loaded ? (
                <p className="py-8 text-center text-sm text-[#687363]">
                  Activity unavailable.
                </p>
              ) : activity.length === 0 ? (
                <p className="py-8 text-center text-sm text-[#687363]">
                  No wallet activity yet.
                </p>
              ) : activity.slice(0, 50).map(item => (

                <div key={`${item.kind}-${item.id}`} className="flex items-center gap-3 py-4">

                  <div className="rounded-xl bg-[#E9EEE5] p-3 text-[#526B4B]">
                    {item.kind === "topup"
                      ? <Plus size={18} />
                      : <ArrowLeftRight size={18} />}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold">
                      {item.title}
                    </p>
                    <p className="mt-1 text-xs text-[#687363]">
                      {item.date}
                    </p>
                  </div>

                  <p className={`text-sm font-bold ${
                    item.kind === "expense"
                      ? "text-red-600"
                      : "text-[#526B4B]"
                  }`}>
                    {item.kind === "topup" || item.kind === "income"
                      ? "+"
                      : item.kind === "expense" ? "−" : ""}
                    {money(item.amount)}
                  </p>

                  {(item.kind === "topup" || item.kind === "transfer") ? (
                  <button
                    type="button"
                    disabled={!!deleting || loading || saving || transferring}
                    onClick={() => void deleteActivity(item)}
                    aria-label="Delete wallet entry"
                    title="Delete entry"
                    className="rounded-xl p-2 text-red-500 transition hover:bg-red-50 disabled:opacity-40"
                  >
                    {deleting === item.id
                      ? <Loader2 size={17} className="animate-spin" />
                      : <Trash2 size={17} />}
                  </button>
                  ) : (
                    <a href="/transactions"
                      className="text-xs font-medium text-[#526B4B] hover:underline">
                      View
                    </a>
                  )}

                </div>
              ))}

            </div>
          </section>
        </div>

        <section className="mt-6 rounded-[24px] border border-[#E0E5DA] bg-white p-6">
          <h2 className="text-xl">How your wallets work.</h2>

          <p className="mt-3 text-sm leading-relaxed text-[#687363]">
            Money added here represents funds you already have.
            It is not recorded as new income. Your UPI balance is
            manually tracked and is not connected to your bank account.
          </p>
        </section>

      </div>

      {showAdd && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/30 p-4 backdrop-blur-sm">

          <div role="dialog" aria-modal="true" aria-labelledby="add-money-title" className="w-full max-w-md rounded-[28px] bg-white p-7 shadow-xl">

            <div className="mb-6 flex items-center justify-between">

              <h2 id="add-money-title" className="text-2xl">Add money.</h2>

              <button
                disabled={saving}
                onClick={() => {
                  setShowAdd(false);
                  setError("");
                }}
                aria-label="Close"
              >
                <X size={21} />
              </button>

            </div>

            <form onSubmit={addMoney} className="space-y-5">

              <div>
                <label htmlFor="wallet-type" className="mb-2 block text-sm font-semibold">
                  Select wallet
                </label>

                <select
                  id="wallet-type"
                  disabled={saving}
                  value={selected}
                  onChange={e => setSelected(e.target.value as WalletType)}
                  className="w-full rounded-xl border border-[#DCE5D7] bg-[#FAFBF9] p-4"
                >
                  <option value="cash">Cash wallet</option>
                  <option value="upi">UPI wallet</option>
                </select>
              </div>

              <div>
                <label htmlFor="wallet-amount" className="mb-2 block text-sm font-semibold">
                  Amount (₹)
                </label>

                <input
                  id="wallet-amount"
                  autoFocus
                  disabled={saving}
                  required
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full rounded-xl border border-[#DCE5D7] bg-[#FAFBF9] p-4 text-2xl"
                />
              </div>

              {error && (
                <p role="alert" className="text-sm text-red-600">{error}</p>
              )}

              <p className="text-xs leading-relaxed text-[#687363]">
                Only add money that you already hold.
                Do not add income that has already been recorded in this wallet.
              </p>

              <button
                disabled={saving}
                type="submit"
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#526B4B] py-4 text-sm font-semibold text-white hover:bg-[#40583B] disabled:opacity-50"
              >
                {saving
                  ? <Loader2 size={18} className="animate-spin" />
                  : <Plus size={18} />}

                {saving ? "Adding..." : "Add money"}
              </button>

            </form>
          </div>
        </div>
      )}

    </main>
  );
}
