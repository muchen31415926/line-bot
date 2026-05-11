import { getSourceData, formatSize } from "#utils";
import { buildFileBubble } from "#templates";
import { replyText, replyFlex } from "../services/line_reply_service.js";
import { runFilePipeline } from "#line_file_pipeline";
import { handleCommand } from "../services/line_handle_command.js";

const ALLOWED_UPLOAD_GCS_TYPES = ["image", "video", "audio", "file"];

export async function handleWebhook(req, res) {
  try {
    const events = req.body.events || [];
    for (const event of events) {
      if (event.type !== "message") continue;

      if (event.message.type === "text") {
        handleCommandEvent(event);
        continue;
      }

      if (ALLOWED_UPLOAD_GCS_TYPES.includes(event.message.type)) {
        handleUploadEvent(event);
        continue;
      }
    }
    res.status(200).send("OK");
  } catch (error) {
    console.error("處理 webhook 錯誤:", error);
    res.status(500).send("Error");
  }
}

async function handleCommandEvent(event) {
  const userText = event.message.text.trim();
  if (userText.startsWith("/")) {
    const sourceData = getSourceData(event.source);

    await handleCommand(event, userText, sourceData);
  }
}

async function handleUploadEvent(event) {
  const messageType = event.message.type;
  const originalFileName =
    messageType === "file" ? event.message.fileName : null;
  const sourceData = getSourceData(event.source);
  const messageId = event.message.id;

  const payload = {
    messageId,
    originalFileName,
    messageType,
    ...sourceData,
  };

  const result = await runFilePipeline(payload);
  const title = "📃 檔案上傳成功";
  const replyMessage = buildFileBubble(result, title);
  await replyFlex(event.replyToken, replyMessage);
}
