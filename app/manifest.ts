import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Job Tracker",
    short_name: "Job Tracker",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    theme_color: "#1C3830",
    background_color: "#F0EDE8",
    display: "standalone",
    start_url: "/",
  };
}
