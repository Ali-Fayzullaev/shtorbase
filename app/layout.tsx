import type { Metadata } from "next";
import { Geist, Geist_Mono, DM_Serif_Display } from "next/font/google";
import Script from "next/script";
import { ThemeProvider } from "@/components/theme/theme-provider";
import { ResponsiveToaster } from "@/components/ui/responsive-toaster";
import { OfflineBanner } from "@/components/ui/offline-banner";
import { KeyboardShortcuts } from "@/components/shortcuts/keyboard-shortcuts";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const dmSerif = DM_Serif_Display({
  variable: "--font-serif",
  subsets: ["latin"],
  weight: "400",
});

export const metadata: Metadata = {
  title: "ШторБаза — Управление ассортиментом",
  description: "Внутренняя платформа для управления ценами, остатками и каталогом товаров для штор",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ru"
      className={`${geistSans.variable} ${geistMono.variable} ${dmSerif.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head />
      <body className="h-full bg-background text-foreground" suppressHydrationWarning>
        <Script src="/theme-init.js" strategy="beforeInteractive" />
        <ThemeProvider>
          {children}
          <KeyboardShortcuts />
          <OfflineBanner />
        </ThemeProvider>
        <ResponsiveToaster />
      </body>
    </html>
  );
}
