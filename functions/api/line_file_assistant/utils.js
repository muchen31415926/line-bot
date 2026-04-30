import { lineClient } from "./config.js";

export function getSourceData(source) {
  const idKey = `${source.type}Id`;
  return {
    sourceType: source.type,
    sourceId: source[idKey],
  };
}

export function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 ** 2) return `${+(bytes / 1024).toFixed(1)} KB`;
  return `${+(bytes / 1024 ** 2).toFixed(1)} MB`;
}

export async function replyMessage(replyToken, text) {
  return lineClient.replyMessage({
    replyToken,
    messages: [
      {
        type: "text",
        text,
      },
    ],
  });
}
