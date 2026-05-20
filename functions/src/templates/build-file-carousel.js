import { buildFileBubble } from "./file-bubble.js";

export function buildFileCarousel(fileInfoList, title) {
  return {
    type: "carousel",
    contents: fileInfoList.map((fileInfo) => buildFileBubble(fileInfo, title)),
  };
}
