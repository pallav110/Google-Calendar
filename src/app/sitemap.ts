import type { MetadataRoute } from "next";

const base = "https://calora-calendar.vercel.app";

export default function sitemap(): MetadataRoute.Sitemap {
  return ["", "/login", "/register"].map((path) => ({
    url: `${base}${path}`,
    changeFrequency: "monthly",
    priority: path === "" ? 1 : 0.6,
  }));
}
