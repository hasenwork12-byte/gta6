import Link from "next/link";
import DemoBadge from "../DemoBadge";

/** Preview card: small label top-left, "Open →" top-right linking to the full page. */
export default function BentoCard({
  label,
  href,
  demo = false,
  className = "",
  children,
}: {
  label: string;
  href: string;
  demo?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={`card card-hover group flex min-w-0 flex-col p-5 ${className}`}>
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <p className="label">{label}</p>
          {demo && <DemoBadge className="!px-2 !py-0.5" />}
        </div>
        <Link href={href} className="shrink-0 text-xs text-muted transition hover:text-fg group-hover:text-fg">
          Open →
        </Link>
      </div>
      {children}
    </div>
  );
}
