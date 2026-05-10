import { formatSize } from "#utils";
import { supabase, GenAI } from "../lib/client.js";
import { replyText, replyFlex } from "./line_reply_service.js";
import { buildBubble, buildCarousel } from "#templates";

const HELP_TEXT = `
  Commands:
  /help - Show help
  /find <keyword> - Search files by name
  /match <keyword> - Search similar files
  `.trim();

export async function handleCommand(event, userText, sourceData) {
  try {
    const [command, params] = userText.split(" ");

    switch (command.toLowerCase()) {
      case "/help": {
        const replymessage = HELP_TEXT;
        await replyText(event.replyToken, replymessage);
        break;
      }

      case "/find": {
        if (!params) {
          const replymessage = `未提供搜尋關鍵字`;
          await replyText(event.replyToken, replymessage);
          break;
        }

        const queryResult = await handleFindCommand(params, sourceData);

        if (queryResult.length === 0) {
          const replymessage = `找不到相關資料: ${params}`;
          console.log("no data");
          await replyText(event.replyToken, replymessage);
          break;
        }

        if (queryResult.length === 1) {
          const title = "🔍 搜尋結果";
          const flexMessage = buildBubble(queryResult[0], title);
          await replyFlex(event.replyToken, flexMessage);
          break;
        }

        const title = "🔍 搜尋結果";
        const flexMessage = buildCarousel(queryResult, title);
        console.log("many data");
        await replyFlex(event.replyToken, flexMessage);
        break;
      }

      case "/match": {
        if (!params) {
          const replymessage = `未提供搜尋關鍵字`;
          await replyText(event.replyToken, replymessage);
          break;
        }

        const queryResult = await handleMatchCommand(params, sourceData);

        if (queryResult.length === 0) {
          const replymessage = `找不到相關資料: ${params}`;
          await replyText(event.replyToken, replymessage);
          break;
        }
        const title = `⚖️ 相似度: `;
        const flexMessage = buildCarousel(queryResult, title);
        await replyFlex(event.replyToken, flexMessage);
        break;
      }

      default: {
        const replymessage = `未知的指令: ${command}\n\n${HELP_TEXT}`;
        await replyText(event.replyToken, replymessage);
        break;
      }
    }
  } catch (error) {
    console.error(`handleCommand error: ${error}`);
  }
}

async function handleFindCommand(params, sourceData) {
  const { data, error } = await supabase
    .from("line_files")
    .select("file_name, file_size, extension, download_url")
    .ilike("file_name", `%${params}%`)
    .eq("source_id", sourceData.sourceId);

  if (error) {
    console.error("database query error:", error);
    throw error;
  }

  return data;
}

async function handleMatchCommand(params, sourceData) {
  const res = await GenAI.models.embedContent({
    model: "gemini-embedding-001",
    contents: params,
    config: { outputDimensionality: 768 },
  });

  const { data, error } = await supabase.schema("public").rpc("match_files", {
    query_embedding: res.embeddings[0].values,
    source_id: sourceData.sourceId,
    result_limit: 3,
  });

  if (error) {
    console.error("match query error:", error);
    throw error;
  }

  return data;
}
