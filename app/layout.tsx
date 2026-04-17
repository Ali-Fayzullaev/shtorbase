import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { headers } from "next/headers";
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

export const metadata: Metadata = {
  title: "ШторБаза — Управление ассортиментом",
  description: "Внутренняя платформа для управления ценами, остатками и каталогом товаров для штор",
};

const themeScript = `try{var t=localStorage.getItem('theme'),a=localStorage.getItem('accent'),g=localStorage.getItem('glass');if(t==='dark'||(!t&&window.matchMedia('(prefers-color-scheme:dark)').matches))document.documentElement.classList.add('dark');if(a&&a!=='indigo')document.documentElement.setAttribute('data-accent',a);if(g!=='0')document.documentElement.setAttribute('data-glass','')}catch(e){}`;

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // CSP nonce генерируется в middleware и приходит через request-headers.
  const nonce = (await headers()).get('x-nonce') ?? undefined;

  return (
    <html
      lang="ru"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script nonce={nonce} dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="h-full bg-background text-foreground" suppressHydrationWarning>
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
