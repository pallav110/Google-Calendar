"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { AlertTriangle, Calendar, Globe, Layers, Move, Moon, Repeat } from "./icons";

const FEATURES = [
  { Icon: Calendar, title: "Day, week & month", desc: "Switch views instantly — or with a keystroke. Your schedule, at every zoom level." },
  { Icon: Move, title: "Drag, drop & resize", desc: "Grab an event to move it, drag its edge to resize, or sweep across the grid to create one." },
  { Icon: Repeat, title: "Repeating events", desc: "Daily, weekly or monthly. Edit a single occurrence or the whole series." },
  { Icon: Layers, title: "Clash detection", desc: "We warn you the moment a new event overlaps something already on your calendar." },
  { Icon: Globe, title: "Timezone smart", desc: "Stored in UTC, shown in your local time — correct wherever you are." },
  { Icon: Moon, title: "Light & dark", desc: "A crisp light theme and an easy-on-the-eyes dark mode, remembered between visits." },
];

const FAQS = [
  { q: "Where can I access Calora?", a: "Calora runs in any modern browser on desktop, tablet, or phone — the layout is fully responsive. Just sign in and your events are there." },
  { q: "How do I sign in?", a: "Use email and password, or continue with your Google account. Either way you land straight in your calendar." },
  { q: "Does it support recurring events?", a: "Yes — daily, weekly, and monthly repeats using the iCalendar RRULE standard. You can edit or delete a single occurrence or the entire series." },
  { q: "How are timezones handled?", a: "Every event is stored in UTC on the server and rendered in your device's local timezone, so times stay correct as you travel or collaborate across regions." },
  { q: "Is my data private?", a: "Each account's events are isolated — every request is checked server-side against your session, and passwords are hashed. You only ever see your own calendar." },
  { q: "What happens if events overlap?", a: "When you create or edit an event that clashes with an existing one, Calora warns you before saving — but lets you proceed if the overlap is intentional." },
];

const fade = {
  hidden: { opacity: 0, y: 24 },
  show: (i = 0) => ({ opacity: 1, y: 0, transition: { delay: i * 0.08, duration: 0.5 } }),
};

export default function Landing() {
  return (
    <div className="min-h-screen bg-white text-neutral-800">
      {/* Nav */}
      <header className="sticky top-0 z-30 border-b border-neutral-100 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <Logo />
            <span className="text-xl font-medium text-neutral-700">Calora</span>
          </div>
          <nav className="flex items-center gap-1 sm:gap-3">
            <a href="#features" className="hidden rounded-full px-4 py-2 text-sm font-medium text-neutral-600 hover:bg-neutral-100 sm:block">Features</a>
            <a href="#faq" className="hidden rounded-full px-4 py-2 text-sm font-medium text-neutral-600 hover:bg-neutral-100 sm:block">FAQ</a>
            <Link href="/login" className="rounded-full px-4 py-2 text-sm font-medium text-neutral-600 hover:bg-neutral-100">Sign in</Link>
            <Link href="/register" className="rounded-full bg-blue-600 px-5 py-2 text-sm font-medium text-white transition hover:bg-blue-700">Get started</Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto grid max-w-6xl items-center gap-12 px-6 py-12 md:grid-cols-2 md:py-20">
        <motion.div initial="hidden" animate="show" variants={fade}>
          <span className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-sm font-medium text-blue-700">
            <Calendar className="h-4 w-4" /> Your time, organized
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

      {/* Feature grid */}
      <section id="features" className="mx-auto max-w-6xl scroll-mt-20 px-6 py-16">
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
              <div className="grid h-11 w-11 place-items-center rounded-xl bg-blue-50 text-blue-600">
                <f.Icon className="h-5 w-5" />
              </div>
              <h3 className="mt-3 text-lg font-medium text-neutral-900">{f.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-neutral-600">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Showcase rows */}
      <section className="mx-auto max-w-6xl space-y-20 px-6 py-12">
        <Showcase
          eyebrow="Reschedule in a flick"
          title="Drag to move, pull to resize"
          desc="Plans change. Grab any event and drop it on a new time or day, or drag its edge to stretch it — everything snaps to clean 15-minute steps and saves instantly."
          visual={<DragVisual />}
        />
        <Showcase
          reverse
          eyebrow="Set it and forget it"
          title="Events that repeat themselves"
          desc="Standups, paydays, weekly 1:1s — create them once and let them recur daily, weekly, or monthly. Need to change just one? Edit a single occurrence without touching the rest."
          visual={<RepeatVisual />}
        />
        <Showcase
          eyebrow="No more double-booking"
          title="Spot clashes before they happen"
          desc="Calora checks every new event against your schedule and flags overlaps before you save — so two meetings never quietly land on the same slot."
          visual={<OverlapVisual />}
        />
      </section>

      {/* FAQ */}
      <section id="faq" className="mx-auto max-w-3xl scroll-mt-20 px-6 py-16">
        <h2 className="text-center text-3xl font-semibold tracking-tight text-neutral-900">
          Curious about Calora?
        </h2>
        <p className="mt-3 text-center text-neutral-600">A few answers to common questions.</p>
        <div className="mt-10 divide-y divide-neutral-200 rounded-2xl border border-neutral-200">
          {FAQS.map((f, i) => (
            <FaqItem key={i} q={f.q} a={f.a} />
          ))}
        </div>
      </section>

      {/* CTA band */}
      <section className="mx-auto max-w-6xl px-6 pb-20">
        <div className="rounded-3xl bg-linear-to-br from-blue-600 to-blue-700 px-8 py-14 text-center text-white">
          <h2 className="text-3xl font-semibold tracking-tight">Ready to take control of your schedule?</h2>
          <p className="mx-auto mt-3 max-w-md text-blue-100">Create an account in seconds — no credit card, no setup.</p>
          <Link href="/register" className="mt-7 inline-block rounded-full bg-white px-7 py-3 text-sm font-medium text-blue-700 transition hover:bg-blue-50">
            Get started
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}

function Showcase({
  eyebrow,
  title,
  desc,
  visual,
  reverse,
}: {
  eyebrow: string;
  title: string;
  desc: string;
  visual: React.ReactNode;
  reverse?: boolean;
}) {
  return (
    <motion.div
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "-80px" }}
      variants={fade}
      className="grid items-center gap-10 md:grid-cols-2"
    >
      <div className={reverse ? "md:order-2" : ""}>
        <span className="text-sm font-semibold uppercase tracking-wide text-blue-600">{eyebrow}</span>
        <h3 className="mt-2 text-3xl font-semibold tracking-tight text-neutral-900">{title}</h3>
        <p className="mt-3 text-neutral-600">{desc}</p>
      </div>
      <div className={reverse ? "md:order-1" : ""}>{visual}</div>
    </motion.div>
  );
}

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
      >
        <span className="font-medium text-neutral-800">{q}</span>
        <span className={`text-xl text-neutral-400 transition-transform ${open ? "rotate-45" : ""}`}>+</span>
      </button>
      {open && <p className="px-5 pb-4 text-sm leading-relaxed text-neutral-600">{a}</p>}
    </div>
  );
}

function Footer() {
  const cols = [
    { h: "Product", links: [["Features", "#features"], ["FAQ", "#faq"], ["Sign in", "/login"], ["Get started", "/register"]] },
    { h: "Built with", links: [["Next.js", "https://nextjs.org"], ["Prisma", "https://prisma.io"], ["Neon Postgres", "https://neon.tech"], ["Auth.js", "https://authjs.dev"]] },
    { h: "About", links: [["Tailwind CSS", "https://tailwindcss.com"], ["Framer Motion", "https://www.framer.com/motion/"], ["Vercel", "https://vercel.com"]] },
  ];
  return (
    <footer className="border-t border-neutral-200 bg-neutral-50">
      <div className="mx-auto max-w-6xl px-6 py-14">
        <div className="grid gap-10 sm:grid-cols-2 md:grid-cols-4">
          <div>
            <div className="flex items-center gap-2">
              <Logo />
              <span className="text-lg font-medium text-neutral-700">Calora</span>
            </div>
            <p className="mt-3 max-w-xs text-sm text-neutral-500">
              A Google Calendar–style scheduling app. Plan, drag, repeat — beautifully.
            </p>
          </div>
          {cols.map((c) => (
            <div key={c.h}>
              <h4 className="text-sm font-semibold text-neutral-800">{c.h}</h4>
              <ul className="mt-3 space-y-2">
                {c.links.map(([label, href]) => (
                  <li key={label}>
                    <a href={href} className="text-sm text-neutral-500 transition hover:text-blue-600">
                      {label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-12 flex flex-col items-center justify-between gap-3 border-t border-neutral-200 pt-6 text-sm text-neutral-500 sm:flex-row">
          <p>© 2026 Calora — a portfolio project.</p>
          <p>Built with Next.js · Prisma · Neon · Auth.js</p>
        </div>
      </div>
    </footer>
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

// ---- Decorative visuals ----

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
        <div className="absolute inset-x-0 z-10 flex items-center" style={{ top: "48%" }}>
          <span className="h-2 w-2 -translate-x-1/2 rounded-full bg-red-500" />
          <span className="h-px flex-1 bg-red-500" />
        </div>
      </div>
    </div>
  );
}

function VisualFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative h-56 overflow-hidden rounded-2xl border border-neutral-200 bg-linear-to-br from-neutral-50 to-blue-50/40 p-6 shadow-sm">
      {children}
    </div>
  );
}

function DragVisual() {
  return (
    <VisualFrame>
      <div className="absolute left-10 top-8 w-40 rounded-md border-l-4 border-blue-500 bg-blue-100 px-3 py-2 text-xs font-medium text-blue-800 shadow">
        Team sync
      </div>
      <div className="absolute left-28 top-24 w-40 rotate-3 rounded-md border-2 border-dashed border-blue-400 bg-blue-200/50 px-3 py-2 text-xs font-medium text-blue-700 shadow-lg">
        Team sync
        <span className="absolute -bottom-5 -right-2 text-blue-600"><Move className="h-5 w-5" /></span>
      </div>
      <div className="absolute bottom-3 left-6 text-xs text-neutral-400">snaps to 15-minute steps</div>
    </VisualFrame>
  );
}

function RepeatVisual() {
  return (
    <VisualFrame>
      <div className="flex h-full flex-col justify-center gap-2">
        {[0, 1, 2].map((i) => (
          <div key={i} className="flex items-center gap-2" style={{ opacity: 1 - i * 0.25 }}>
            <span className="w-12 text-xs text-neutral-400">Mon {8 + i}</span>
            <div className="flex-1 rounded-md border-l-4 border-green-500 bg-green-100 px-3 py-1.5 text-xs font-medium text-green-800">
              Weekly standup
            </div>
          </div>
        ))}
        <div className="mt-2 inline-flex w-fit items-center gap-1.5 rounded-full bg-white px-3 py-1 text-xs font-medium text-green-700 shadow">
          <Repeat className="h-3.5 w-3.5" /> Repeats weekly
        </div>
      </div>
    </VisualFrame>
  );
}

function OverlapVisual() {
  return (
    <VisualFrame>
      <div className="flex h-full items-center justify-center">
        <div className="w-full max-w-xs space-y-2">
          <div className="rounded-md border-l-4 border-purple-500 bg-purple-100 px-3 py-2 text-xs font-medium text-purple-800">
            2:00 – 3:00 · Design review
          </div>
          <div className="-mt-1 ml-6 rounded-md border-l-4 border-red-500 bg-red-100 px-3 py-2 text-xs font-medium text-red-800">
            2:30 – 3:30 · Client call
          </div>
          <div className="flex items-center gap-1.5 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800 shadow-sm">
            <AlertTriangle className="h-3.5 w-3.5 shrink-0" /> Overlaps with “Design review”. Save anyway?
          </div>
        </div>
      </div>
    </VisualFrame>
  );
}
