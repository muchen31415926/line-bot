import { lineClient } from "../infra/line.js";

export async function replyText(replyToken, textMessage) {
  return lineClient.replyMessage({
    replyToken,
    messages: [
      {
        type: "text",
        text: textMessage,
      },
    ],
  });
}

export async function replyFlex(replyToken, flexMessage) {
  return lineClient.replyMessage({
    replyToken,
    messages: [
      {
        type: "flex",
        altText: "您有一則訊息",
        contents: flexMessage,
      },
    ],
  });
}
