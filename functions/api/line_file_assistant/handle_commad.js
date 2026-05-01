import { supabase, GenAI } from "./services.js";
import { replyMessage, formatSize } from "./utils.js";

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
        const replyText = HELP_TEXT;
        await replyMessage(event.replyToken, replyText);
        break;
      }

      case "/find": {
        if (!params) {
          const replyText = `未提供搜尋關鍵字`;
          await replyMessage(event.replyToken, replyText);
          break;
        }

        const queryResult = await handleFindCommand(params, sourceData);

        if (queryResult.length === 0) {
          const replyText = `找不到相關資料: ${params}`;
          await replyMessage(event.replyToken, replyText);
          break;
        }

        const replyText = queryResult
          .map((row, i) =>
            [
              `${i + 1}. ${row.file_name}`,
              `大小: ${formatSize(row.file_size)}`,
              `類型: ${row.content_type}`,
              `下載: ${row.download_url}`,
            ].join("\n"),
          )
          .join("\n\n");
        await replyMessage(event.replyToken, replyText);
        break;
      }

      case "/match": {
        if (!params) {
          const replyText = `未提供搜尋關鍵字`;
          await replyMessage(event.replyToken, replyText);
          break;
        }

        const queryResult = await handleMatchCommand(params, sourceData);

        if (queryResult.length === 0) {
          const replyText = `找不到相關資料: ${params}`;
          await replyMessage(event.replyToken, replyText);
          break;
        }

        const replyText = queryResult
          .map((row, i) =>
            [
              `${i + 1}. ${row.file_name}`,
              `相似度: ${(row.similarity * 100).toFixed(1)}%`,
              `類型: ${row.extension}`,
              `大小: ${formatSize(row.file_size)}`,
              `下載: ${row.download_url}`,
            ].join("\n"),
          )
          .join("\n\n");
        await replyMessage(event.replyToken, replyText);
        break;
      }

      default: {
        const replyText = `未知的指令: ${command}\n\n${HELP_TEXT}`;
        await replyMessage(event.replyToken, replyText);
        break;
      }
    }
  } catch (error) {
    const replyText = "處理指令時發生錯誤";
    console.error(`handleCommand error: ${error}`);
    await replyMessage(event.replyToken, replyText);
  }
}

async function handleFindCommand(params, sourceData) {
  const { data, error } = await supabase
    .from("line_files")
    .select()
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
    result_limit: 5,
  });

  if (error) {
    console.error("match query error:", error);
    throw error;
  }

  return data;
}
