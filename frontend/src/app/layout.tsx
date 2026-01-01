import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Providers from "@/components/providers";
import { ThemeProvider } from "@/components/theme-provider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Dataview AI - Enterprise Data Analytics",
    template: "%s | Dataview AI"
  },
  description: "Enterprise-grade AI data analytics workspace. Visualize, clean, and analyze your data with advanced AI insights.",
  metadataBase: new URL('https://dataview-ai.vercel.app'),
  keywords: ["Data Analytics", "AI", "Visualization", "Business Intelligence", "Dashboard", "SQL", "Pandas", "DuckDB"],
  authors: [{ name: "Dataview Team" }],
  openGraph: {
    title: "Dataview AI - Enterprise Data Analytics",
    description: "Enterprise-grade AI data analytics workspace. Visualize, clean, and analyze your data with advanced AI insights.",
    url: 'https://dataview-ai.vercel.app',
    siteName: 'Dataview AI',
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: "Dataview AI - Enterprise Data Analytics",
    description: "Enterprise-grade AI data analytics workspace.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning
      >
        <ThemeProvider defaultTheme="system" storageKey="analytics-theme">
          <Providers>{children}</Providers>
        </ThemeProvider>
      </body>
    </html>
  );
}
