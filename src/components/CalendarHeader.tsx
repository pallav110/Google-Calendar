"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";
import { format, isSameMonth, weekGrid } from "@/lib/dates";
import type { ViewType } from "@/lib/types";

type User = { name: string | null; email: string | null; image: string | null };

function title(view: ViewType, cursor: Date): string {
  if (view === "day") return format(cursor, "EEEE, MMMM d, yyyy");
  if (view === "week") {
    const days = weekGrid(cursor);
    const a = days[0];
    const b = days[6];
    return isSameMonth(a, b)
      ? format(a, "MMMM yyyy")
      : `${format(a, "MMM")} – ${format(b, "MMM yyyy")}`;
  }
  return format(cursor, "MMMM yyyy");
}

export default function CalendarHeader({
  view,
  cursor,
  user,
  dark,
  onView,
  onNavigate,
  onToggleDark,
  onToggleSidebar,
}: {
  view: ViewType;
  cursor: Date;
  user: User;
  dark: boolean;
  onView: (v: ViewType) => void;
  onNavigate: (dir: -1 | 0 | 1) => void;
  onToggleDark: () => void;
  onToggleSidebar: () => void;
}) {
  const [menu, setMenu] = useState(false);
  const initial = (user.name ?? user.email ?? "?").charAt(0).toUpperCase();

  return (
    <header className="flex items-center gap-2 border-b border-neutral-200 px-4 py-2 dark:border-neutral-800">
      <button
        onClick={onToggleSidebar}
        title="Main menu"
        className="grid h-10 w-10 shrink-0 place-items-center rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <path d="M3 6h18M3 12h18M3 18h18" />
        </svg>
      </button>
      <div className="flex items-center gap-2 pr-2">
        <div className="grid h-9 w-9 place-items-center rounded-lg bg-blue-600 text-white">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="4" width="18" height="18" rx="2" />
            <path d="M3 9h18M8 2v4M16 2v4" />
          </svg>
        </div>
        <span className="hidden text-lg font-medium text-neutral-600 dark:text-neutral-300 sm:inline">
          Calendar
        </span>
      </div>

      <button
        onClick={() => onNavigate(0)}
        className="rounded-full border border-neutral-300 px-4 py-1.5 text-sm font-medium hover:bg-neutral-50 dark:border-neutral-700 dark:hover:bg-neutral-800"
      >
        Today
      </button>

      <div className="flex items-center">
        <Chevron dir="left" onClick={() => onNavigate(-1)} />
        <Chevron dir="right" onClick={() => onNavigate(1)} />
      </div>

      <h2 className="ml-2 truncate text-lg font-normal text-neutral-700 dark:text-neutral-200 sm:text-xl">
        {title(view, cursor)}
      </h2>

      <div className="ml-auto flex items-center gap-2">
        <div className="hidden rounded-lg border border-neutral-300 p-0.5 dark:border-neutral-700 sm:flex">
          {(["day", "week", "month"] as ViewType[]).map((v) => (
            <button
              key={v}
              onClick={() => onView(v)}
              className={`rounded-md px-3 py-1 text-sm capitalize transition ${
                view === v
                  ? "bg-blue-600 text-white"
                  : "text-neutral-600 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800"
              }`}
            >
              {v}
            </button>
          ))}
        </div>

        <button
          onClick={onToggleDark}
          title="Toggle theme"
          className="grid h-9 w-9 place-items-center rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800"
        >
          {dark ? "🌙" : "☀️"}
        </button>

        <div className="relative">
          <button
            onClick={() => setMenu((m) => !m)}
            className="grid h-9 w-9 place-items-center rounded-full bg-blue-600 text-sm font-medium text-white"
          >
            {initial}
          </button>
          {menu && (
            <div className="absolute right-0 z-50 mt-2 w-56 rounded-xl border border-neutral-200 bg-white p-2 shadow-lg dark:border-neutral-800 dark:bg-neutral-900">
              <p className="truncate px-3 py-1 text-sm font-medium">{user.name ?? "Account"}</p>
              <p className="truncate px-3 pb-2 text-xs text-neutral-500">{user.email}</p>
              <button
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-neutral-100 dark:hover:bg-neutral-800"
              >
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

function Chevron({ dir, onClick }: { dir: "left" | "right"; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="grid h-9 w-9 place-items-center rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800"
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d={dir === "left" ? "M15 18l-6-6 6-6" : "M9 18l6-6-6-6"} />
      </svg>
    </button>
  );
}
