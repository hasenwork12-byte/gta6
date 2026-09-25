import { readFile } from "fs/promises";
import { join } from "path";
import { ImageResponse } from "next/og";
import { points, site } from "@/config";

export const alt = `${site.name} ($${site.ticker}): hold, earn points, redeem GTA 6`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const PINK = "#ff3d8b";
const ORANGE = "#ff9f43";

export default async function OpengraphImage() {
  const logo = await readFile(join(process.cwd(), "public", "logo.svg"));
  const logoSrc = `data:image/svg+xml;base64,${logo.toString("base64")}`;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          position: "relative",
          background: "#07060a",
          color: "#f4f1f7",
          fontFamily: "sans-serif",
          overflow: "hidden",
        }}
      >
        {/* sunset glow + striped sun */}
        <div
          style={{
            position: "absolute",
            right: -120,
            bottom: -260,
            width: 760,
            height: 760,
            borderRadius: 9999,
            background: `radial-gradient(circle, ${PINK}55 0%, ${PINK}00 65%)`,
          }}
        />
        <div
          style={{
            position: "absolute",
            left: 800,
            top: 290,
            width: 340,
            height: 340,
            borderRadius: 9999,
            background: `linear-gradient(180deg, ${ORANGE} 0%, ${PINK} 75%)`,
          }}
        />
        {/* sun stripes */}
        {[
          [430, 5],
          [452, 8],
          [476, 11],
          [502, 14],
        ].map(([top, h]) => {
          // Trim each stripe to the sun's chord at its lower edge (sun centre 970,460 r=170).
          const dy = Math.max(Math.abs(top - 460), Math.abs(top + h - 460));
          const half = Math.sqrt(170 * 170 - dy * dy);
          return (
            <div key={top} style={{ position: "absolute", left: 970 - half, width: half * 2, top, height: h, background: "#07060a" }} />
          );
        })}
        {/* horizon */}
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: 540,
            bottom: 0,
            background: "#07060a",
            borderTop: `2px solid ${ORANGE}`,
          }}
        />

        <div style={{ position: "absolute", left: 80, top: 70, display: "flex", flexDirection: "column", width: 760 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={logoSrc} width={120} height={120} alt="" />
            <div
              style={{
                fontSize: 26,
                letterSpacing: 6,
                color: "#8b8794",
                border: "2px solid #2a2530",
                borderRadius: 999,
                padding: "8px 20px",
              }}
            >
              {`$${site.ticker} · SOLANA`}
            </div>
          </div>
          <div style={{ fontSize: 92, fontWeight: 700, lineHeight: 1.02, marginTop: 36, letterSpacing: -2 }}>{site.name}</div>
          <div style={{ fontSize: 44, marginTop: 18, display: "flex", gap: 14 }}>
            <span>Hold. Earn points.</span>
            <span style={{ color: ORANGE }}>Redeem GTA 6.</span>
          </div>
          <div style={{ fontSize: 26, marginTop: 22, color: "#8b8794" }}>
            {`${points.redeemCost.toLocaleString("en-US")} points = one copy · paid by a public treasury`}
          </div>
        </div>
      </div>
    ),
    size,
  );
}
