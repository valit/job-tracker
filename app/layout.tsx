import type { Metadata, Viewport } from "next";
import { DM_Serif_Display } from "next/font/google";
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
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={dmSerifDisplay.variable}>
        {children}
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
