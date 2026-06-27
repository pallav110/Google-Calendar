import { ImageResponse } from "next/og";

export const alt = "Calora — a calendar that keeps up with you";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Og() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "80px",
          background: "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)",
          color: "white",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
          <div
            style={{
              width: 96,
              height: 96,
              borderRadius: 22,
              background: "rgba(255,255,255,0.15)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" />
              <path d="M3 10h18M8 2v4M16 2v4" />
            </svg>
          </div>
          <div style={{ fontSize: 60, fontWeight: 700 }}>Calora</div>
        </div>
        <div style={{ marginTop: 48, fontSize: 76, fontWeight: 700, lineHeight: 1.1, maxWidth: 900 }}>
          A calendar that keeps up with you
        </div>
        <div style={{ marginTop: 28, fontSize: 34, color: "rgba(255,255,255,0.85)", maxWidth: 820 }}>
          Plan your week, drag to reschedule, and set events that repeat.
        </div>
      </div>
    ),
    { ...size }
  );
}
