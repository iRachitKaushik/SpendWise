"use client";

import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard, ArrowLeftRight, Repeat, Target,
  Brain, Wallet, ChartNoAxesCombined, Settings,
  Sparkles, LogOut, Menu, X
} from "lucide-react";
import { supabase } from "@/lib/supabase";

const navigation = [
  { label: "Overview", icon: LayoutDashboard, path: "/dashboard" },
  { label: "Transactions", icon: ArrowLeftRight, path: "/transactions" },
  { label: "Recurring", icon: Repeat, path: "/recurring" },
  { label: "Savings Goals", icon: Target, path: "/goals" },
  { label: "Smart Insights", icon: Brain, path: "/insights" },
  { label: "Budgets", icon: Wallet, path: "/budgets" },
  { label: "Analytics", icon: ChartNoAxesCombined, path: "/analytics" },
];

export function SpendWiseSidebar({
  menuOpen,
  onClose,
}: {
  menuOpen: boolean;
  onClose: () => void;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [name, setName] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setName(data.user?.user_metadata?.full_name?.trim() || "Your Account");
    });
  }, []);

  async function logout() {
    const { error } = await supabase.auth.signOut();

    if (error) {
      setError(error.message);
      return;
    }

    router.replace("/login");
    router.refresh();
  }

  function linkStyle(active: boolean) {
    return `flex items-center gap-3 rounded-2xl px-4 py-3
      text-[14px] font-medium transition-all duration-200
      ${active
        ? "bg-[#E4EDE0] text-[#40583B]"
        : "text-[#687363] hover:bg-[#F4F6F2] hover:text-[#354D30]"
      }`;
  }

  return (
    <aside className={`
      ${menuOpen ? "translate-x-0" : "-translate-x-[120%]"}
      fixed inset-y-3 left-3 z-50 flex w-[260px] shrink-0
      flex-col overflow-y-auto rounded-[28px] border
      border-[#E5E8E0] bg-white p-6 transition-transform
      duration-300 lg:sticky lg:top-7
      lg:h-[calc(100vh-56px)] lg:translate-x-0
    `}>

      <div className="mb-10 flex items-center gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#526B4B] text-white">
          <svg viewBox="0 0 64 64" width="36" height="36" aria-hidden="true">
  <path d="M43 19H28C15 19 15 32 28 32H36C49 32 49 45 36 45H21" fill="none" stroke="#F7F6F2" strokeWidth="4.5" strokeLinecap="round"/>
  <circle cx="46" cy="45" r="3" fill="#BBCBB4"/>
</svg>
        </div>

        <div className="min-w-0 flex-1">
          <h2 className="text-xl text-[#252823]">
            SpendWise<span className="text-[#81977B]">.</span>
          </h2>
          <p className="text-[8px] font-semibold tracking-[0.19em] text-[#687363]">
            MONEY, MADE CLEAR
          </p>
        </div>

        <button
          onClick={onClose}
          aria-label="Close navigation"
          className="lg:hidden"
        >
          <X size={19} />
        </button>
      </div>

      <p className="mb-3 px-3 text-[10px] font-semibold tracking-[0.2em] text-[#687363]">
        MENU
      </p>

      <nav className="space-y-1">
        {navigation.map(item => (
          <Link
            key={item.path}
            href={item.path}
            onClick={onClose}
            aria-current={pathname === item.path ? "page" : undefined}
            className={linkStyle(pathname === item.path)}
          >
            <item.icon size={19} />
            {item.label}
          </Link>
        ))}
      </nav>

      <p className="mb-3 mt-8 px-3 text-[10px] font-semibold tracking-[0.2em] text-[#687363]">
        PREFERENCES
      </p>

      <Link
        href="/settings"
        onClick={onClose}
        aria-current={pathname === "/settings" ? "page" : undefined}
        className={linkStyle(pathname === "/settings")}
      >
        <Settings size={19} />
        Settings
      </Link>

      <div className="mt-5 rounded-[22px] bg-[#E9EEE5] p-5">
        <Sparkles size={24} className="mb-4 text-[#526B4B]" />
        <p className="text-sm font-bold text-[#354D30]">
          Build better habits.
        </p>
        <p className="mt-2 text-xs leading-relaxed text-[#606C5C]">
          Your financial journey starts with small steps.
        </p>
      </div>

      <div className="mt-auto pt-5">
        <p className="truncate px-2 text-xs text-[#687363]">
          {name || "Your Account"}
        </p>

        <button
          onClick={logout}
          className="mt-2 flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm text-[#687363] hover:bg-[#F4F6F2]"
        >
          <LogOut size={17} />
          Sign out
        </button>

        {error && <p role="alert" className="text-xs text-red-600">{error}</p>}
      </div>
    </aside>
  );
}

export function SpendWiseNavigation({
  children,
}: {
  children: ReactNode;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const pages = [
    "/transactions", "/recurring", "/goals",
    "/insights", "/budgets", "/analytics", "/settings"
  ];

  if (!pages.includes(pathname)) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-[#F7F6F2] text-[#252823]">

      {open && (
        <button
          aria-label="Close navigation"
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-40 bg-black/25 lg:hidden"
        />
      )}

      <div className="mx-auto flex max-w-[1600px] gap-5 p-3 lg:p-7">

        <SpendWiseSidebar
          menuOpen={open}
          onClose={() => setOpen(false)}
        />

        <div className="min-w-0 flex-1">

          <div className="flex items-center gap-3 px-3 py-4 lg:hidden">
            <button
              onClick={() => setOpen(true)}
              aria-label="Open navigation"
              className="rounded-xl border border-[#E5E8E0] bg-white p-3"
            >
              <Menu size={21} />
            </button>
            <h2 className="text-xl">SpendWise.</h2>
          </div>

          {children}

        </div>
      </div>
    </div>
  );
}
