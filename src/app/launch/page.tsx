import type { Metadata } from "next";
import Link from "next/link";
import HeroPig from "@/components/HeroPig";
import { site, xSocial } from "@/config";

export const metadata: Metadata = { title: `Launch — ${site.name}` };

export default function LaunchPage() {
  return (
    <div className="section flex flex-col items-center py-20 text-center">
      <HeroPig className="w-44" />
      <p className="label mt-8 !text-gold">Launch</p>
      <h1 className="mt-2 font-display text-5xl font-extrabold tracking-tight sm:text-7xl">
        Coming <span className="accent-text">soon</span>
      </h1>
      <p className="mt-4 max-w-md text-muted">
        ${site.ticker} isn&apos;t live yet. The contract address will be posted here and on our X at launch.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        {xSocial && (
          <a href={xSocial.url} target="_blank" rel="noreferrer" className="btn-primary !px-6">
            Follow {xSocial.label}
          </a>
        )}
        <Link href="/how-it-works" className="btn-ghost !px-6">
          How it works
        </Link>
      </div>
    </div>
  );
}
