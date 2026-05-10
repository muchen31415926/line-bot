import { buildBubble } from "./flex_bubble.js";

export function buildCarousel(fileInfoList, title) {
  return {
    type: "carousel",
    contents: fileInfoList.map((fileInfo) => buildBubble(fileInfo, title)),
  };
}
