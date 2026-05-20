import { replyText, replyFlex } from "../services/line-reply.js";
import { findFiles } from "../repositories/line-file.js";
import { buildFileBubble, buildFileCarousel } from "#templates";

export async function handleFindCommand(event, arg, sourceData) {
  if (!arg) {
    return await replyText(event.replyToken, "未提供搜尋關鍵字");
  }

  const files = await findFiles(arg, sourceData);

  if (files.length === 0) {
    return await replyText(event.replyToken, `找不到相關資料: ${arg}`);
  }

  const title = "🔍 搜尋結果";
  const flexMessage =
    files.length === 1
      ? buildFileBubble(files[0], title)
      : buildFileCarousel(files, title);
  await replyFlex(event.replyToken, flexMessage);
}
