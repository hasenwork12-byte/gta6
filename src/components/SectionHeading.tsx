export default function SectionHeading({ eyebrow, title, sub }: { eyebrow: string; title: string; sub?: string }) {
  return (
    <div className="mb-7 max-w-2xl">
      <p className="label">{eyebrow}</p>
      <h2 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">{title}</h2>
      {sub && <p className="mt-2 text-sm leading-relaxed text-muted sm:text-base">{sub}</p>}
    </div>
  );
}
