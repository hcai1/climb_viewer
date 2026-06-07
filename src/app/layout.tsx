import type { Metadata } from "next";
import { DM_Sans, Fraunces } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const sans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
});

const display = Fraunces({
  subsets: ["latin"],
  variable: "--font-display",
});

export const metadata: Metadata = {
  title: "Peak Paths — Mountain Climb Showcase",
  description:
    "Upload GPX files and showcase your mountain climbs with 3D terrain, elevation profiles, and fitness stats.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${sans.variable} ${display.variable} font-sans antialiased`}>
        <div className="relative min-h-screen overflow-hidden">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(245,158,11,0.08)_0%,_transparent_50%)]" />
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,_rgba(74,124,140,0.12)_0%,_transparent_40%)]" />

          <header className="relative border-b border-mountain-800/80 bg-mountain-950/70 backdrop-blur-md">
            <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
              <Link href="/" className="group flex items-center gap-2">
                <span className="text-2xl">⛰️</span>
                <span className="font-display text-xl text-mountain-100 group-hover:text-summit-400">
                  Peak Paths
                </span>
              </Link>
              <nav className="flex items-center gap-4 text-sm">
                <Link
                  href="/"
                  className="text-mountain-300 transition hover:text-mountain-100"
                >
                  Climbs
                </Link>
                <Link
                  href="/upload"
                  className="rounded-lg bg-summit-500/90 px-4 py-2 font-medium text-mountain-950 transition hover:bg-summit-400"
                >
                  Upload GPX
                </Link>
              </nav>
            </div>
          </header>

          <main className="relative mx-auto max-w-6xl px-6 py-10">{children}</main>

          <footer className="relative border-t border-mountain-800/60 py-6 text-center text-xs text-mountain-500">
            Built for climbers — GPX in, 3D terrain out.
          </footer>
        </div>
      </body>
    </html>
  );
}
