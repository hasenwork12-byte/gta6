"use client";

const DIGITS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];

/**
 * Odometer-style number: each digit is a vertical strip that rolls to its
 * new position whenever `value` changes.
 */
export default function RollingNumber({
  value,
  format,
  className = "",
}: {
  value: number;
  format: (n: number) => string;
  className?: string;
}) {
  const str = format(value);
  const chars = str.split("");

  return (
    <span className={`inline-flex items-start whitespace-pre font-mono leading-none tabular ${className}`} role="text" aria-label={str}>
      {chars.map((c, i) => {
        const key = chars.length - i; // key from the right so columns stay stable as length changes
        if (!/\d/.test(c))
          return (
            <span key={`${key}-${c}`} className="h-[1em] leading-none" aria-hidden>
              {c}
            </span>
          );
        const d = Number(c);
        return (
          <span key={key} className="roll-col" aria-hidden>
            <span className="roll-strip" style={{ transform: `translateY(-${d * 10}%)` }}>
              {DIGITS.map((n) => (
                <span key={n}>{n}</span>
              ))}
            </span>
          </span>
        );
      })}
    </span>
  );
}
