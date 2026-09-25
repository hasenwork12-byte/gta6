import { readFile } from "fs/promises";
import { join } from "path";
import { ImageResponse } from "next/og";

// iOS home-screen icon (PNG), rendered from the same logo as the favicon.
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default async function AppleIcon() {
  const logo = await readFile(join(process.cwd(), "public", "logo.svg"));
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "#07060a" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={`data:image/svg+xml;base64,${logo.toString("base64")}`} width={150} height={150} alt="" />
      </div>
    ),
    size,
  );
}
