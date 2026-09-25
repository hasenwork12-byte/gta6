import type { Metadata, Viewport } from "next";
import { JetBrains_Mono, Space_Grotesk } from "next/font/google";
import "./globals.css";
import { site } from "@/config";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import WalletProviders from "@/components/WalletProviders";

const sans = Space_Grotesk({ subsets: ["latin"], variable: "--font-sans" });
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono" });

export const metadata: Metadata = {
  title: `${site.name} ($${site.ticker}) — a public treasury for GTA 6 giveaways`,
  description: site.tagline,
  icons: { icon: "/icon.svg" },
  openGraph: { title: site.name, description: site.tagline },
};

export const viewport: Viewport = { themeColor: "#07060a" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${sans.variable} ${mono.variable}`}>
      <body className="min-h-screen font-sans">
        <WalletProviders>
          <Header />
          <main>{children}</main>
          <Footer />
        </WalletProviders>
      </body>
    </html>
  );
}
