import type { Metadata } from "next";
import localFont from "next/font/local";
import { Providers } from "@/components/layout/Providers";
import "./globals.css";

// Self-hosted rather than next/font/google: that fetches from
// fonts.gstatic.com at *build* time, which made the Cloud Build step
// flaky/fail outright when that network call didn't go through. These are
// the same files Google Fonts serves (latin subset, Apache/OFL-licensed),
// just vendored so the build has zero external dependency.
const spaceGrotesk = localFont({
  src: "./fonts/space-grotesk-variable.woff2",
  weight: "500 700",
  variable: "--font-space-grotesk",
  display: "swap",
});

const ibmPlexSans = localFont({
  src: "./fonts/ibm-plex-sans-variable.woff2",
  weight: "400 600",
  variable: "--font-ibm-plex-sans",
  display: "swap",
});

const ibmPlexMono = localFont({
  src: [
    { path: "./fonts/ibm-plex-mono-400.woff2", weight: "400", style: "normal" },
    { path: "./fonts/ibm-plex-mono-500.woff2", weight: "500", style: "normal" },
  ],
  variable: "--font-ibm-plex-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "WI-TP Console",
  description:
    "Live console for the Webhook Ingestion & Transformation Pipeline — every GitHub delivery, verified and normalized.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${spaceGrotesk.variable} ${ibmPlexSans.variable} ${ibmPlexMono.variable}`}
    >
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
