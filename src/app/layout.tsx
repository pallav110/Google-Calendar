import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const description =
  "A fast, beautiful calendar in your browser. Plan your week, drag to reschedule, set repeating events, and never double-book — with day, week, and month views.";

export const metadata: Metadata = {
  metadataBase: new URL("https://calora-calendar.vercel.app"),
  title: {
    default: "Calora — your time, organized",
    template: "%s · Calora",
  },
  description,
  applicationName: "Calora",
  keywords: [
    "calendar",
    "scheduling",
    "events",
    "planner",
    "week view",
    "recurring events",
    "google calendar alternative",
  ],
  authors: [{ name: "Calora" }],
  openGraph: {
    type: "website",
    siteName: "Calora",
    title: "Calora — your time, organized",
    description,
    url: "/",
  },
  twitter: {
    card: "summary_large_image",
    title: "Calora — your time, organized",
    description,
  },
};

export const viewport: Viewport = {
  themeColor: "#2563eb",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
