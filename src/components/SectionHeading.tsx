export default function SectionHeading({
  eyebrow,
  title,
  sub,
  index,
}: {
  eyebrow: string;
  title: string;
  sub?: string;
  /** Optional chapter number, drawn as a big outlined numeral beside the title. */
  index?: number;
}) {
  return (
    <div className="mb-6 flex max-w-2xl items-end gap-3 sm:mb-7 sm:gap-4">
      {index !== undefined && (
        <span className="outline-num -mb-1 font-display text-6xl font-extrabold leading-none sm:text-7xl" aria-hidden>
          {String(index).padStart(2, "0")}
        </span>
      )}
      <div>
        <p className="label">{eyebrow}</p>
        <h2 className="mt-2 font-display text-[1.7rem] font-extrabold leading-[1.05] tracking-tight sm:text-4xl">{title}</h2>
        {sub && <p className="mt-2 text-sm leading-relaxed text-muted sm:text-base">{sub}</p>}
      </div>
    </div>
  );
}
