/** A one-shot burst of coins, for celebrating a redemption. Hidden with reduced motion. */
const N = 14;

export default function CoinBurst() {
  return (
    <div className="pointer-events-none absolute left-1/2 top-10 h-0 w-0" aria-hidden>
      {Array.from({ length: N }, (_, i) => {
        const angle = (i / N) * Math.PI * 2;
        const dist = 90 + (i % 3) * 35;
        return (
          <span
            key={i}
            className="absolute -ml-2 -mt-2 h-4 w-4 animate-burst rounded-full border border-[#c97a10] bg-gradient-to-br from-[#ffe29a] to-[#f5a524]"
            style={
              {
                "--dx": `${Math.round(Math.cos(angle) * dist)}px`,
                "--dy": `${Math.round(Math.sin(angle) * dist * 0.7)}px`,
                animationDelay: `${(i % 4) * 40}ms`,
              } as React.CSSProperties
            }
          />
        );
      })}
    </div>
  );
}
