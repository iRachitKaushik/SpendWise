import Link from "next/link";
import {
  Wallet, ArrowUpRight, ChartNoAxesCombined,
  Target, Brain, Repeat, ArrowLeftRight, ShieldCheck
} from "lucide-react";

const features = [
  {
    icon: ArrowLeftRight,
    title: "Track every rupee.",
    description: "Organize your income and expenses in one simple space."
  },
  {
    icon: Target,
    title: "Save with purpose.",
    description: "Set meaningful financial goals and monitor your progress."
  },
  {
    icon: Brain,
    title: "Understand your money.",
    description: "Discover spending patterns with smart financial insights."
  },
  {
    icon: ChartNoAxesCombined,
    title: "See the bigger picture.",
    description: "Visualize your financial activity with clear analytics."
  },
  {
    icon: Repeat,
    title: "Stay ahead of bills.",
    description: "Manage recurring expenses and subscriptions."
  },
  {
    icon: ShieldCheck,
    title: "Your personal space.",
    description: "Manage your finances through your own account."
  }
];

export default function WelcomePage() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#F7F6F2] text-[#252823]">

      <header className="mx-auto flex max-w-7xl items-center justify-between px-6 py-7 lg:px-12">
        <Link href="/" className="flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-2xl bg-[#526B4B] text-white">
            <svg viewBox="0 0 64 64" width="36" height="36" aria-hidden="true">
  <path d="M43 19H28C15 19 15 32 28 32H36C49 32 49 45 36 45H21" fill="none" stroke="#F7F6F2" strokeWidth="4.5" strokeLinecap="round"/>
  <circle cx="46" cy="45" r="3" fill="#BBCBB4"/>
</svg>
          </div>
          <h2 className="text-2xl">SpendWise.</h2>
        </Link>

        <Link href="/login" className="rounded-full border border-[#BBC8B5] px-5 py-2.5 text-sm font-semibold hover:bg-[#E9EEE5]">
          Sign in
        </Link>
      </header>

      <section className="mx-auto max-w-7xl px-6 pb-20 pt-16 text-center lg:px-12 lg:pt-24">

        <p className="mb-8 text-[11px] font-bold tracking-[0.22em] text-[#526B4B]">
          A BETTER RELATIONSHIP WITH MONEY
        </p>

        <h1 className="mx-auto max-w-5xl text-5xl leading-[1.12] sm:text-7xl lg:text-8xl">
          Master your money.
          <span className="mt-2 block italic text-[#526B4B]">
            Live with clarity.
          </span>
        </h1>

        <p className="mx-auto mt-7 max-w-xl text-base leading-relaxed text-[#687363] sm:text-lg">
          A thoughtful space to track spending, build savings
          and take control of your financial life.
        </p>

        <div className="mt-9 flex flex-wrap justify-center gap-3">
          <Link href="/login" className="inline-flex items-center gap-3 rounded-full bg-[#526B4B] px-8 py-4 text-sm font-semibold text-white transition hover:bg-[#40583B]">
            Get started <ArrowUpRight size={18} />
          </Link>

          <a href="#features" className="rounded-full border border-[#BBC8B5] px-8 py-4 text-sm font-semibold transition hover:bg-[#E9EEE5]">
            Explore features
          </a>
        </div>

        <div className="mx-auto mt-20 max-w-4xl rounded-[32px] border border-[#E0E5DA] bg-white p-5 text-left shadow-xl shadow-[#526B4B]/5 sm:p-9">

          <div className="mb-6 flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-3xl">Your financial overview.</h2>
            <span className="text-xs text-[#687363]">
              Preview · Sample data
            </span>
          </div>

          <div className="rounded-[26px] bg-[#526B4B] p-7 text-white sm:p-10">
            <p className="text-sm text-[#DCE5D7]">Net balance</p>
            <p className="mt-3 text-4xl font-semibold tracking-tight sm:text-6xl">
              ₹84,250
            </p>
            <svg viewBox="0 0 600 150" className="mt-7 w-full" aria-hidden="true">
  <defs>
    <linearGradient id="balanceFill" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stopColor="#DCE5D7" stopOpacity="0.25" />
      <stop offset="100%" stopColor="#DCE5D7" stopOpacity="0" />
    </linearGradient>
  </defs>

  {[40, 85, 130].map(y => (
    <line key={y} x1="0" y1={y} x2="600" y2={y}
      stroke="white" opacity="0.10" strokeDasharray="4 6" />
  ))}

  <path
    d="M0 125 C40 125 50 100 90 105 S150 120 190 85 S250 65 285 80 S350 65 390 45 S450 65 490 30 S550 25 590 12 L590 145 L0 145 Z"
    fill="url(#balanceFill)"
  />

  <path
    d="M0 125 C40 125 50 100 90 105 S150 120 190 85 S250 65 285 80 S350 65 390 45 S450 65 490 30 S550 25 590 12"
    fill="none"
    stroke="#E4EDE0"
    strokeWidth="3"
    strokeLinecap="round"
  />

  <circle cx="590" cy="12" r="8" fill="#DCE5D7" opacity="0.2" />
  <circle cx="590" cy="12" r="4" fill="#F7F6F2" />
</svg>

<div className="mt-2 flex justify-between text-[11px] text-[#DCE5D7]">
  {["Jun", "Jul", "Aug", "Sep", "Oct", "Nov"].map(month => (
    <span key={month}>{month}</span>
  ))}
</div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-4">
            <div className="rounded-[22px] bg-[#E9EEE5] p-5 sm:p-7">
              <p className="text-sm text-[#526B4B]">Total income</p>
              <p className="mt-2 text-xl font-bold sm:text-3xl">
                ₹1,20,000
              </p>
            </div>
            <div className="rounded-[22px] bg-[#F0E6DF] p-5 sm:p-7">
              <p className="text-sm text-[#896454]">Total expenses</p>
              <p className="mt-2 text-xl font-bold sm:text-3xl">
                ₹35,750
              </p>
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="mx-auto max-w-7xl px-6 py-20 lg:px-12">

        <p className="text-center text-xs font-bold tracking-[0.2em] text-[#526B4B]">
          DESIGNED FOR EVERYDAY LIFE
        </p>

        <h2 className="mx-auto mt-5 max-w-3xl text-center text-4xl sm:text-6xl">
          Everything you need.
          <br />
          Nothing you don't.
        </h2>

        <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {features.map(feature => (
            <div key={feature.title} className="rounded-[26px] border border-[#E0E5DA] bg-white p-8 transition duration-300 hover:-translate-y-1 hover:shadow-lg">

              <div className="mb-8 grid h-12 w-12 place-items-center rounded-2xl bg-[#E9EEE5] text-[#526B4B]">
                <feature.icon size={24} />
              </div>

              <h3 className="text-xl font-semibold">
                {feature.title}
              </h3>

              <p className="mt-3 text-sm leading-relaxed text-[#687363]">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-5 mb-12 rounded-[32px] bg-[#E4EDE0] px-6 py-20 text-center sm:mx-12">
        <h2 className="text-4xl sm:text-6xl">
          Small steps.
          <br />
          Better financial habits.
        </h2>

        <Link href="/login" className="mt-8 inline-flex items-center gap-3 rounded-full bg-[#526B4B] px-8 py-4 font-semibold text-white hover:bg-[#40583B]">
          Start your journey <ArrowUpRight size={18} />
        </Link>
      </section>

      <footer className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 border-t border-[#E0E5DA] px-6 py-8 text-sm text-[#687363] lg:px-12">
        <span className="font-semibold">SpendWise.</span>
        <span>Money, made clear.</span>
        <span>© 2026 SpendWise</span>
      </footer>

    </main>
  );
}
