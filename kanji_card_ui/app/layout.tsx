import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

import { Providers } from "@/components/ui/providers";

const mapleMono = localFont({
  src: "../fonts/MapleMono[wght].ttf",
  variable: "--font-maple-mono",
  display: "swap",
  weight: "100 900",
  style: "normal",
  fallback: [
    "ui-sans-serif",
    "system-ui",
    "-apple-system",
    "BlinkMacSystemFont",
    "Segoe UI",
    "Roboto",
    "Helvetica Neue",
    "Arial",
    "sans-serif",
  ],
});

export const metadata: Metadata = {
  title: "Kanji Card",
  description:
    "Japanese kanji learning app with flashcards and spaced repetition",
  icons: {
    icon: "/logo.svg",
    apple: "/logo.svg",
    shortcut: "/logo.svg",
  },
  manifest: "/manifest.json",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${mapleMono.variable} antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
