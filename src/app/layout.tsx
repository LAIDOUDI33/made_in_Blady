import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin", "latin-ext"],
});

export const metadata: Metadata = {
  title: "AlgeriaTrade - The B2B Digital Marketplace for Algerian Industry & African Trade",
  description: "Source from Algeria. Connect with trusted manufacturers, suppliers, and exporters. Post RFQs, get quotations, and grow your business on Algeria's premier B2B marketplace.",
  keywords: ["Algeria", "B2B", "marketplace", "manufacturers", "suppliers", "RFQ", "trade", "Algerian products", "wholesale"],
  authors: [{ name: "AlgeriaTrade" }],
  icons: {
    icon: "/favicon.ico",
  },
  openGraph: {
    title: "AlgeriaTrade - B2B Marketplace for Algerian Industry",
    description: "Connect with verified Algerian manufacturers, suppliers, and exporters",
    siteName: "AlgeriaTrade",
    type: "website",
    locale: "fr_DZ",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased bg-background text-foreground`}>
        <div className="flex min-h-screen flex-col">
          <Header />
          <main className="flex-1">
            {children}
          </main>
          <Footer />
        </div>
        <Toaster />
      </body>
    </html>
  );
}
