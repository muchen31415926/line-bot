import { supabase, GenAI } from "../../lib/client.js";
import { replyText, replyFlex } from "../../services/line_reply_service.js";
import { matchFiles } from "../../services/line_file_service.js";
import { buildFileBubble, buildFileCarousel } from "#templates";

export async function handleMatchCommand(event, arg, sourceData) {
  if (!arg) {
    return await replyText(event.replyToken, `未提供匹配關鍵字`);
  }

  const files = await matchFiles(arg, sourceData);

  if (files.length === 0) {
    return await replyText(event.replyToken, `找不到相關資料: ${arg}`);
  }

  const title = `⚖️ 相似度: `;
  const flexMessage = buildFileCarousel(files, title);
  await replyFlex(event.replyToken, flexMessage);
}
