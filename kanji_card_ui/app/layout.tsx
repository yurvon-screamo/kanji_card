import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { colors } from "@/lib/colors";
import { ThemeProvider } from "next-themes";

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
  description: "Japanese kanji learning application built with Next.js",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${mapleMono.variable} antialiased ${colors.ui.background.main}`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
