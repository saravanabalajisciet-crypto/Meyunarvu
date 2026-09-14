import type { Metadata } from "next";
import { Lora, Inter } from "next/font/google";
import "./globals.css";
import { siteConfig } from "@/config/site";

const lora = Lora({
  subsets: ["latin"],
  variable: "--font-lora",
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url || "https://meyunarvu.vercel.app"),
  title: {
    default: siteConfig.name,
    template: `%s — ${siteConfig.name}`,
  },
  description: siteConfig.description,
  openGraph: {
    type: "website",
    siteName: siteConfig.name,
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    ...(siteConfig.twitterHandle && { creator: siteConfig.twitterHandle }),
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${lora.variable} ${inter.variable}`}>
      <body className="min-h-screen flex flex-col bg-white text-stone-900 font-serif antialiased">
        {children}
      </body>
    </html>
  );
}
