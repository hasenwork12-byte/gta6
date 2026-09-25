import type { Metadata, Viewport } from "next";
import { JetBrains_Mono, Space_Grotesk } from "next/font/google";
import "./globals.css";
import { site } from "@/config";
import Sidebar from "@/components/Sidebar";
import Footer from "@/components/Footer";
import WalletProviders from "@/components/WalletProviders";

const sans = Space_Grotesk({ subsets: ["latin"], variable: "--font-sans" });
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono" });

const title = `${site.name} ($${site.ticker}) — hold, earn points, redeem GTA 6`;

// Favicon, iOS icon and share images are file-based: app/icon.svg, app/apple-icon.tsx,
// app/opengraph-image.tsx and app/twitter-image.tsx.
export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title,
  description: site.tagline,
  applicationName: site.name,
  openGraph: { type: "website", siteName: site.name, title, description: site.tagline },
  twitter: { card: "summary_large_image", title, description: site.tagline },
};

export const viewport: Viewport = { themeColor: "#07060a" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${sans.variable} ${mono.variable}`}>
      <body className="min-h-screen font-sans">
        <WalletProviders>
          <div className="md:flex">
            <Sidebar />
            <div className="min-w-0 flex-1">
              <main>{children}</main>
              <Footer />
            </div>
          </div>
        </WalletProviders>
      </body>
    </html>
  );
}
