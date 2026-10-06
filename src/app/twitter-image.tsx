import OpengraphImage from "./opengraph-image";
import { site } from "@/config";

export const alt = `${site.name} ($${site.ticker}): hold, stack XP, claim GTA 6`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default OpengraphImage;
