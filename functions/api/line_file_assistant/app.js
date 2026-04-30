import express from "express";
import { middleware } from "@line/bot-sdk";

import { lineConfig } from "./config.js";
import { getSourceData, formatSize, replyMessage } from "./utils.js";
import { runFilePipeline } from "./pipeline/file_pipeline.js";
import { handleCommand } from "./handle_commad.js";

const router = express.Router();

const ALLOWED_UPLOAD_GCS_TYPES = ["image", "video", "audio", "file"];
router.get("/", (req, res) => res.send("line file assistant test"));

router.post("/", middleware(lineConfig), async (req, res) => {
  try {
    const events = req.body.events || [];
    for (const event of events) {
      if (event.type !== "message") continue;

      if (event.message.type === "text") {
        const sourceData = getSourceData(event.source);
        const userText = event.message.text.trim();
        if (userText.startsWith("/")) {
          await handleCommand(event, userText, sourceData);
          continue;
        }
        continue;
      }

      if (ALLOWED_UPLOAD_GCS_TYPES.includes(event.message.type)) {
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

        const replyText = `檔名: ${result.fileName}\n檔案大小: ${formatSize(result.fileSize)}\n下載網址: ${result.downloadURL}`;
        await replyMessage(event.replyToken, replyText);
        continue;
      }
    }
    res.status(200).send("OK");
  } catch (error) {
    console.error("處理 webhook 錯誤:", error);
    res.status(500).send("Error");
  }
});

export default router;
