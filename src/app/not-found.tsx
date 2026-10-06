import Link from "next/link";
import HeroPig from "@/components/HeroPig";

export default function NotFound() {
  return (
    <div className="section flex flex-col items-center py-20 text-center">
      <HeroPig className="w-44" />
      <p className="label mt-8">404</p>
      <h1 className="mt-2 font-display text-4xl font-extrabold tracking-tight sm:text-5xl">This page got eaten.</h1>
      <p className="mt-3 max-w-md text-muted">Oink. Whatever was here went into the piggy bank. Let&apos;s get you back.</p>
      <Link href="/" className="btn-primary mt-8 !px-6">
        Back home
      </Link>
    </div>
  );
}
