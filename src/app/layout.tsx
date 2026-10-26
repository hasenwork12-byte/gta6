import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, JetBrains_Mono, Space_Grotesk } from "next/font/google";
import "./globals.css";
import { site } from "@/config";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import WalletProviders from "@/components/WalletProviders";
import ThemeMusic from "@/components/ThemeMusic";

const sans = Space_Grotesk({ subsets: ["latin"], variable: "--font-sans" });
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono" });
// Chunky display face for headlines only; body text stays Space Grotesk.
const display = Bricolage_Grotesque({ subsets: ["latin"], weight: ["600", "800"], variable: "--font-display" });

const title = `${site.name} ($${site.ticker}): hold, stack XP, claim GTA 6`;

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

export const viewport: Viewport = { themeColor: "#0e0814" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${sans.variable} ${mono.variable} ${display.variable}`}>
      <body className="min-h-screen font-sans">
        <WalletProviders>
          <Nav />
          <ThemeMusic />
          {/* bottom padding clears the phone tab bar */}
          <div className="pb-24 lg:pb-0">
            <main>{children}</main>
            <Footer />
          </div>
        </WalletProviders>
      </body>
    </html>
  );
}
