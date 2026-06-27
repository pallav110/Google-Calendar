"use client";

import Link from "next/link";
import { motion } from "framer-motion";

const FEATURES = [
  { icon: "🗓️", title: "Day, week & month", desc: "Switch views instantly — or with a keystroke. Your schedule, at every zoom level." },
  { icon: "🖱️", title: "Drag, drop & resize", desc: "Grab an event to move it, drag its edge to resize, or sweep across the grid to create one." },
  { icon: "🔁", title: "Repeating events", desc: "Daily, weekly or monthly. Edit a single occurrence or the whole series." },
  { icon: "🧱", title: "Clash detection", desc: "We warn you the moment a new event overlaps something already on your calendar." },
  { icon: "🌍", title: "Timezone smart", desc: "Stored in UTC, shown in your local time — correct wherever you are." },
  { icon: "🌗", title: "Light & dark", desc: "A crisp light theme and an easy-on-the-eyes dark mode, remembered between visits." },
];

const fade = {
  hidden: { opacity: 0, y: 24 },
  show: (i = 0) => ({ opacity: 1, y: 0, transition: { delay: i * 0.08, duration: 0.5 } }),
};

export default function Landing() {
  return (
    <div className="min-h-screen bg-white text-neutral-800">
      {/* Nav */}
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <div className="flex items-center gap-2">
          <Logo />
          <span className="text-xl font-medium text-neutral-700">Calendar</span>
        </div>
        <nav className="flex items-center gap-3">
          <Link href="/login" className="rounded-full px-4 py-2 text-sm font-medium text-neutral-600 hover:bg-neutral-100">
            Sign in
          </Link>
          <Link href="/register" className="rounded-full bg-blue-600 px-5 py-2 text-sm font-medium text-white transition hover:bg-blue-700">
            Get started
          </Link>
        </nav>
      </header>

      {/* Hero */}
      <section className="mx-auto grid max-w-6xl items-center gap-12 px-6 py-12 md:grid-cols-2 md:py-20">
        <motion.div initial="hidden" animate="show" variants={fade}>
          <span className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-sm font-medium text-blue-700">
            📅 Your time, organized
          </span>
          <h1 className="mt-5 text-5xl font-semibold leading-tight tracking-tight text-neutral-900 md:text-6xl">
            A calendar that
            <br />
            keeps up with you
          </h1>
          <p className="mt-5 max-w-md text-lg text-neutral-600">
            Plan your week, drag to reschedule, and set events that repeat — a fast,
            beautiful calendar that lives in your browser.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/register" className="rounded-full bg-blue-600 px-6 py-3 text-sm font-medium text-white shadow-sm transition hover:bg-blue-700">
              Get started — it&apos;s free
            </Link>
            <Link href="/login" className="rounded-full border border-neutral-300 px-6 py-3 text-sm font-medium text-neutral-700 transition hover:bg-neutral-50">
              Sign in
            </Link>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, scale: 0.96, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.1 }}>
          <CalendarPreview />
        </motion.div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-6xl px-6 py-16">
        <h2 className="text-center text-3xl font-semibold tracking-tight text-neutral-900">
          Everything you need to plan your days
        </h2>
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f, i) => (
            <motion.div
              key={f.title}
              custom={i}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: "-60px" }}
              variants={fade}
              className="rounded-2xl border border-neutral-200 p-6 transition hover:shadow-md"
            >
              <div className="text-3xl">{f.icon}</div>
              <h3 className="mt-3 text-lg font-medium text-neutral-900">{f.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-neutral-600">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA band */}
      <section className="mx-auto max-w-6xl px-6 pb-20">
        <div className="rounded-3xl bg-gradient-to-br from-blue-600 to-blue-700 px-8 py-14 text-center text-white">
          <h2 className="text-3xl font-semibold tracking-tight">Ready to take control of your schedule?</h2>
          <p className="mx-auto mt-3 max-w-md text-blue-100">Create an account in seconds — no credit card, no setup.</p>
          <Link href="/register" className="mt-7 inline-block rounded-full bg-white px-7 py-3 text-sm font-medium text-blue-700 transition hover:bg-blue-50">
            Get started
          </Link>
        </div>
      </section>

      <footer className="border-t border-neutral-200">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-6 py-8 text-sm text-neutral-500 sm:flex-row">
          <div className="flex items-center gap-2">
            <Logo small />
            <span>Calendar</span>
          </div>
          <p>Built with Next.js · Prisma · Neon · Auth.js</p>
        </div>
      </footer>
    </div>
  );
}

function Logo({ small }: { small?: boolean }) {
  const s = small ? 28 : 36;
  return (
    <div className="grid place-items-center rounded-xl bg-blue-600 text-white" style={{ width: s, height: s }}>
      <svg width={s * 0.55} height={s * 0.55} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="4" width="18" height="18" rx="2" />
        <path d="M3 9h18M8 2v4M16 2v4" />
      </svg>
    </div>
  );
}

// A decorative week-grid mockup echoing the real app.
function CalendarPreview() {
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri"];
  const events = [
    { col: 0, top: 18, h: 22, c: "#dbeafe", b: "#3b82f6", label: "Standup" },
    { col: 1, top: 34, h: 30, c: "#dcfce7", b: "#16a34a", label: "Design review" },
    { col: 2, top: 24, h: 26, c: "#f3e8ff", b: "#9333ea", label: "1:1" },
    { col: 3, top: 44, h: 34, c: "#fee2e2", b: "#ef4444", label: "Interview" },
    { col: 2, top: 56, h: 20, c: "#fef3c7", b: "#f59e0b", label: "Lunch" },
    { col: 4, top: 30, h: 40, c: "#ccfbf1", b: "#0d9488", label: "Focus time" },
  ];
  return (
    <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-xl">
      <div className="flex items-center justify-between border-b border-neutral-100 px-4 py-3">
        <span className="text-sm font-medium text-neutral-700">June 2026</span>
        <div className="flex gap-1">
          <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
          <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
          <span className="h-2.5 w-2.5 rounded-full bg-green-400" />
        </div>
      </div>
      <div className="grid grid-cols-5 border-b border-neutral-100 text-center text-xs text-neutral-500">
        {days.map((d, i) => (
          <div key={d} className="py-2">
            {d} <span className={`ml-1 rounded-full px-1 ${i === 2 ? "bg-blue-600 text-white" : ""}`}>{22 + i}</span>
          </div>
        ))}
      </div>
      <div className="relative grid h-72 grid-cols-5">
        {days.map((_, i) => (
          <div key={i} className="relative border-r border-neutral-100 last:border-r-0">
            {[0, 1, 2, 3].map((r) => (
              <div key={r} className="border-b border-neutral-50" style={{ height: "25%" }} />
            ))}
          </div>
        ))}
        {events.map((e, i) => (
          <div
            key={i}
            className="absolute rounded-md px-2 py-1 text-[11px] font-medium shadow-sm"
            style={{
              left: `calc(${e.col * 20}% + 4px)`,
              width: "calc(20% - 8px)",
              top: `${e.top}%`,
              height: `${e.h}%`,
              background: e.c,
              color: e.b,
              borderLeft: `3px solid ${e.b}`,
            }}
          >
            {e.label}
          </div>
        ))}
        {/* current-time line */}
        <div className="absolute inset-x-0 z-10 flex items-center" style={{ top: "48%" }}>
          <span className="h-2 w-2 -translate-x-1/2 rounded-full bg-red-500" />
          <span className="h-px flex-1 bg-red-500" />
        </div>
      </div>
    </div>
  );
}
