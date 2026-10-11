import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Suspense } from "react";
import SiteShell from "@/components/site-shell";
import { CartProvider } from "@/lib/cart";
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
  title: "Dunfeto | Premium Living, Reliable Appliances",
  description:
    "Shop reliable home appliances for Nigerian homes. Premium living, dependable service, and delivery across Nigeria.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <CartProvider>
          <Suspense fallback={<div aria-busy="true" className="min-h-screen bg-[#fffefa]" />}>
            <SiteShell>{children}</SiteShell>
          </Suspense>
        </CartProvider>
      </body>
    </html>
  );
}
