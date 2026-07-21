import type { Metadata, Viewport } from "next";
import { DM_Serif_Display } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";

const dmSerifDisplay = DM_Serif_Display({ weight: "400", subsets: ["latin"], variable: "--font-dm-serif" });

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export const metadata: Metadata = {
  title: "Job Tracker",
  description: "Track your job search",
  robots: { index: false, follow: false },
  icons: {
    icon: [
      { url: "/favicon.ico", rel: "shortcut icon" },
      { url: "/favicon-96x96.png", sizes: "96x96", type: "image/png" },
      { url: "/favicon.svg", type: "image/svg+xml" },
    ],
    apple: { url: "/apple-touch-icon.png", sizes: "180x180" },
  },
  appleWebApp: { title: "Job Tracker" },
  manifest: "/site.webmanifest",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={dmSerifDisplay.variable}>
        {children}
        <Analytics />
        <SpeedInsights />
        <script dangerouslySetInnerHTML={{ __html: `
          document.addEventListener('touchstart', function(e) {
            if (e.touches.length > 1) e.preventDefault();
          }, { passive: false });
          var lastTap = 0;
          document.addEventListener('touchend', function(e) {
            var now = Date.now();
            if (now - lastTap < 300) e.preventDefault();
            lastTap = now;
          }, { passive: false });
        `}} />
      </body>
    </html>
  );
}
