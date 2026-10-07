/**
 * A pig face generated from a wallet address: same wallet, same pig, everywhere.
 * Background hue, skin tone and accessory all come from a hash of the address.
 * No gradients or ids, so any number can render on one page.
 */
function hash(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}

const SKINS = ["#ff8fb8", "#ff7aa8", "#ffa3c2", "#f98aa0", "#ffb08a"];
const ACCESSORIES = ["none", "shades", "party", "band", "bow", "cap"] as const;

export default function PigAvatar({ wallet, crown = false, className = "h-10 w-10" }: { wallet: string; crown?: boolean; className?: string }) {
  const h = hash(wallet);
  const bg = `hsl(${h % 360} 55% 24%)`;
  const ring = `hsl(${h % 360} 70% 55%)`;
  const skin = SKINS[(h >>> 9) % SKINS.length];
  const acc = crown ? "crown" : ACCESSORIES[(h >>> 13) % ACCESSORIES.length];
  const blush = (h >>> 17) % 2 === 0;

  return (
    <svg viewBox="0 0 40 40" className={className} aria-hidden>
      <circle cx="20" cy="20" r="19" fill={bg} stroke={ring} strokeWidth="1.5" />
      {/* ears */}
      <path d="M9 14 L12 6 L17 12 Z" fill={skin} stroke="#7a1740" strokeWidth=".8" strokeLinejoin="round" />
      <path d="M31 14 L28 6 L23 12 Z" fill={skin} stroke="#7a1740" strokeWidth=".8" strokeLinejoin="round" />
      {/* head */}
      <ellipse cx="20" cy="22" rx="12" ry="11" fill={skin} stroke="#7a1740" strokeWidth=".8" />
      {/* eyes */}
      <circle cx="15.5" cy="19" r="1.6" fill="#1a0d14" />
      <circle cx="24.5" cy="19" r="1.6" fill="#1a0d14" />
      <circle cx="16" cy="18.5" r=".5" fill="#fff" />
      <circle cx="25" cy="18.5" r=".5" fill="#fff" />
      {blush && (
        <>
          <ellipse cx="12.5" cy="24" rx="2" ry="1.1" fill="#ff3d8b" opacity=".45" />
          <ellipse cx="27.5" cy="24" rx="2" ry="1.1" fill="#ff3d8b" opacity=".45" />
        </>
      )}
      {/* snout */}
      <ellipse cx="20" cy="25.5" rx="5" ry="3.6" fill="#ff5f96" stroke="#7a1740" strokeWidth=".7" />
      <ellipse cx="18.2" cy="25.5" rx=".9" ry="1.3" fill="#7a1740" />
      <ellipse cx="21.8" cy="25.5" rx=".9" ry="1.3" fill="#7a1740" />

      {acc === "shades" && (
        <g>
          <rect x="11.5" y="16.6" width="7.5" height="4.2" rx="1.6" fill="#120a18" />
          <rect x="21" y="16.6" width="7.5" height="4.2" rx="1.6" fill="#120a18" />
          <rect x="18.8" y="17.8" width="2.4" height="1" fill="#120a18" />
          <rect x="12.5" y="17.3" width="2.4" height=".8" rx=".4" fill="#fff" opacity=".5" />
        </g>
      )}
      {acc === "party" && (
        <g>
          <path d="M20 2 L25 12 L15 12 Z" fill="#ffc93c" stroke="#7a1740" strokeWidth=".7" strokeLinejoin="round" />
          <circle cx="20" cy="2.5" r="1.6" fill="#ff3d8b" />
        </g>
      )}
      {acc === "band" && <rect x="8.5" y="13" width="23" height="2.6" rx="1.3" fill="#4ade80" />}
      {acc === "bow" && (
        <path d="M24 9 L28 6.5 L28 11.5 Z M24 9 L20 6.5 L20 11.5 Z" fill="#ff3d8b" stroke="#7a1740" strokeWidth=".6" strokeLinejoin="round" />
      )}
      {acc === "cap" && (
        <g>
          <path d="M10 14 Q20 3 30 14 Z" fill="#3b82f6" stroke="#1e3a8a" strokeWidth=".7" />
          <rect x="22" y="12.6" width="11" height="2.2" rx="1.1" fill="#1e3a8a" />
        </g>
      )}
      {acc === "crown" && (
        <path
          d="M11 13 L12.5 4.5 L16.5 9.5 L20 3 L23.5 9.5 L27.5 4.5 L29 13 Z"
          fill="#ffc93c"
          stroke="#a16207"
          strokeWidth=".8"
          strokeLinejoin="round"
        />
      )}
    </svg>
  );
}
