import path from "path";

import express from "express";
import { fileTypeFromBuffer } from "file-type";
import { initializeApp } from "firebase-admin/app";
import { getStorage } from "firebase-admin/storage";
import { createClient } from "@supabase/supabase-js";
import { messagingApi, middleware } from "@line/bot-sdk";
import { GoogleGenAI } from "@google/genai";

const lineConfig = {
  channelSecret: process.env.LINE_SECRET_ROB_V1,
  channelAccessToken: process.env.LINE_ACCESS_TOKEN_ROB_V1,
};

// Create a single supabase client for interacting with your database
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SECRET_KEY,
);

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const client = new messagingApi.MessagingApiClient(lineConfig);
const blobClient = new messagingApi.MessagingApiBlobClient(lineConfig);
const router = express.Router();

initializeApp();
const bucket = getStorage().bucket();

router.get("/", (req, res) => {
  res.send("line file assistant test");
});

// webhook
const ALLOWED_UPLOAD_GCS_TYPES = ["image", "video", "audio", "file"];
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

        let data = {
          messageId,
          originalFileName,
          messageType,
          ...sourceData,
        };
        data = await handleFileMessage(data);

        const replyText = `檔名: ${data.fileName}\n檔案大小: ${formatSize(data.fileSize)}\n下載網址: ${data.downloadURL}`;
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

async function handleFileMessage(data) {
  data = await getLineMessageBuffer(data);
  data = await detectFileType(data);
  data = getFileSize(data);
  data = createFileName(data);
  data = createStoragePath(data);
  data = createFileRef(data);
  data = await uploadFile(data);
  data = await setFilePublic(data);
  data = getPublicUrl(data);
  data = await getEmbedding(data);
  data = await saveInDB(data);
  return data;
}

async function getLineMessageBuffer(data) {
  // get readable stream
  const stream = await blobClient.getMessageContent(data.messageId);

  //read the stream into a buffer
  const chunks = [];
  for await (const chunk of stream) {
    chunks.push(chunk);
  }

  return {
    ...data,
    buffer: Buffer.concat(chunks),
  };
}

function getFileSize(data) {
  return {
    ...data,
    fileSize: data.buffer.length,
  };
}

function createFileName(data) {
  const fileName = data.originalFileName
    ? path.parse(data.originalFileName).name
    : data.messageId;

  return { ...data, fileName };
}

async function detectFileType(data) {
  const type = await fileTypeFromBuffer(data.buffer);

  if (!type || !type.ext) {
    throw new Error("Can not determine file type");
  }

  return { ...data, mime: type.mime, ext: type.ext };
}

function createStoragePath(data) {
  const storagePath = `${data.sourceType}${data.sourceId}/${data.fileName}.${data.ext}`;
  return { ...data, storagePath };
}

function createFileRef(data) {
  const fileRef = bucket.file(data.storagePath);
  return { ...data, fileRef };
}

async function uploadFile(data) {
  // get writable stream for GCS upload
  const writeStream = data.fileRef.createWriteStream({
    metadata: {
      contentType: data.mime,
    },
  });

  // chunk( buffer ) -> writable buffer -> GCS
  // all chunks written to writable stream
  writeStream.end(data.buffer);

  // wait for upload to complete
  await new Promise((resolve, reject) => {
    writeStream.on("finish", resolve);
    writeStream.on("error", reject);
  });

  // remove buffer from data
  const { buffer, ...rest } = data;
  return rest;
}

async function setFilePublic(data) {
  // set file to public
  await data.fileRef.makePublic();
  return data;
}

function getPublicUrl(data) {
  const downloadURL = `https://storage.googleapis.com/${bucket.name}/${data.storagePath}`;
  return { ...data, downloadURL };
}

function getSourceData(source) {
  let idKey = `${source.type}Id`;
  return {
    sourceType: source.type,
    sourceId: source[idKey],
  };
}

async function getEmbedding(data) {
  const res = await ai.models.embedContent({
    model: "gemini-embedding-001",
    contents: data.fileName,
    config: { outputDimensionality: 768 },
  });
  return { ...data, embedding: res.embeddings[0].values };
}

async function saveInDB(data) {
  const row = {
    message_id: data.messageId,
    message_type: data.messageType,
    source_type: data.sourceType,
    source_id: data.sourceId,
    storage_path: data.storagePath,
    content_type: data.mime,
    file_size: data.fileSize,
    file_name: data.fileName,
    extension: data.ext,
    embedding: data.embedding,
    download_url: data.downloadURL,
  };

  const { error } = await supabase.from("line_files").insert(row);

  if (error) {
    console.error("database insert error:", error);
    throw error;
  }

  return data;
}

async function handleCommand(event, userText, sourceData) {
  const helpText = `
  Commands:
  /help - Show help
  /find <keyword> - Search data
  `.trim();

  try {
    const [command, params] = userText.split(" ");

    switch (command.toLowerCase()) {
      case "/help": {
        const replyText = helpText;
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

      default: {
        const replyText = `未知的指令: ${command}\n\n${helpText}`;
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

function formatSize(bytes) {
  if (bytes < 1000) return `${bytes} B`;
  if (bytes < 1000000) return `${parseFloat((bytes / 1000).toFixed(1))} KB`;
  return `${parseFloat((bytes / 1000000).toFixed(1))} MB`;
}

async function replyMessage(replyToken, text) {
  return client.replyMessage({
    replyToken: replyToken,
    messages: [
      {
        type: "text",
        text: text,
      },
    ],
  });
}

export default router;
