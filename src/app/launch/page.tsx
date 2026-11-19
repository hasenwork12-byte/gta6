import type { Metadata } from "next";
import { site } from "@/config";

export const metadata: Metadata = { title: `Launch — ${site.name}` };

export default function LaunchPage() {
  return (
    <div className="section flex min-h-[60vh] items-center justify-center py-20 text-center">
      <h1 className="font-display text-5xl font-extrabold tracking-tight sm:text-7xl">
        Coming <span className="accent-text">soon</span>
      </h1>
    </div>
  );
}
