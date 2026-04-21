import { initializeApp } from "firebase-admin/app";
import { getStorage } from "firebase-admin/storage";
import { createClient } from "@supabase/supabase-js";
import express from "express";

import { messagingApi, middleware } from "@line/bot-sdk";
import { fileTypeFromBuffer } from "file-type";

const config = {
  channelSecret: process.env.LINE_SECRET_ROB_V1,
  channelAccessToken: process.env.LINE_ACCESS_TOKEN_ROB_V1,
};

// Create a single supabase client for interacting with your database
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SECRET_KEY,
);

const client = new messagingApi.MessagingApiClient(config);
const blobClient = new messagingApi.MessagingApiBlobClient(config);
const router = express.Router();

initializeApp();
const bucket = getStorage().bucket();

router.get("/", (req, res) => {
  res.send("line file assistant test");
});

// webhook
router.post("/", middleware(config), async (req, res) => {
  try {
    const events = req.body.events || [];
    const allowedMessageTypes = ["image", "video", "audio", "file"];

    for (const event of events) {
      if (event.type === "message" && event.message.type === "text") {
        const text = event.message.text.trim();
        if (text.startsWith("/")) {
          await handleCommand(event, text);
        }
      } else if (
        event.type === "message" &&
        allowedMessageTypes.includes(event.message.type)
      ) {
        const messageType = event.message.type;
        const fileName = messageType === "file" ? event.message.fileName : null;
        const sourceData = getSourceData(event.source);
        const messageId = event.message.id;

        let data = { messageId, fileName, messageType, ...sourceData };
        data = await handleFileMessage(data);

        await client.replyMessage({
          replyToken: event.replyToken,
          messages: [
            {
              type: "text",
              text: `檔名: ${data.fileName}\n檔案大小: ${data.fileSize} bytes\n${data.downloadURL}`,
            },
          ],
        });
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
  data = createFileRef(data);
  data = await uploadFile(data);
  data = await setFilePublic(data);
  data = getPublicUrl(data);
  data = await saveInDB(data);
  return data;
}

async function getLineMessageBuffer(data) {
  // get readable stream
  const Stream = await blobClient.getMessageContent(data.messageId);

  //read the stream into a buffer
  let chunks = [];
  for await (const chunk of Stream) {
    chunks.push(chunk);
  }
  return {
    ...data,
    buffer: Buffer.concat(chunks),
  };
}

async function detectFileType(data) {
  const type = await fileTypeFromBuffer(data.buffer);

  if (!type || !type.ext) {
    throw new Error("Can not determine file type");
  }

  return {
    ...data,
    mime: type.mime,
    ext: type.ext,
  };
}

function getFileSize(data) {
  return {
    ...data,
    fileSize: data.buffer.length,
  };
}

function createFileRef(data) {
  let fileName;
  data.fileName
    ? (fileName = data.fileName)
    : (fileName = `${data.messageId}.${data.ext}`);
  const filePath = `${data.sourceType}${data.sourceId}/${fileName}`;
  const fileRef = bucket.file(filePath);

  return {
    ...data,
    fileName,
    filePath,
    fileRef,
  };
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
  const downloadURL = `https://storage.googleapis.com/${bucket.name}/${data.filePath}`;
  return { ...data, downloadURL };
}

function getSourceData(source) {
  let idKey = `${source.type}Id`;
  return {
    sourceType: source.type,
    sourceId: source[idKey],
  };
}

async function saveInDB(data) {
  const { error } = await supabase.from("line_files").insert({
    message_id: data.messageId,
    message_type: data.messageType,
    source_type: data.sourceType,
    source_id: data.sourceId,
    storage_path: data.filePath,
    content_type: data.mime,
    file_size: data.fileSize,
    file_name: data.fileName,
    download_url: data.downloadURL,
  });

  if (error) {
    console.error("database insert error:", error);
    throw error;
  }
  return data;
}

async function handleCommand(event, text) {
  const helpText = `
  Commands:
  /help - Show help
  /find <keyword> - Search data
  `.trim();

  try {
    const [command, params] = text.toLowerCase().split(" ");

    switch (command) {
      case "/help":
        await client.replyMessage({
          replyToken: event.replyToken,
          messages: [
            {
              type: "text",
              text: `${helpText}`,
            },
          ],
        });
        break;

      case "/find":
        const queryResult = await handleFindCommand(params);
        const findText = queryResult
          .map((row, i) =>
            [
              `${i + 1}. `,
              `${row.file_name}`,
              `大小: ${row.file_size} bytes`,
              `類型: ${row.content_type}`,
              `下載連結: ${row.download_url}`,
            ].join("\n"),
          )
          .join("\n\n");
        await client.replyMessage({
          replyToken: event.replyToken,
          messages: [
            {
              type: "text",
              text: `${findText}`,
            },
          ],
        });
        break;

      default:
        await client.replyMessage({
          replyToken: event.replyToken,
          messages: [
            {
              type: "text",
              text: `未知的指令: ${command}\n${helpText}`,
            },
          ],
        });
        break;
    }
  } catch (error) {
    console.error("處理指令錯誤:", error);
    await client.replyMessage({
      replyToken: event.replyToken,
      messages: [
        {
          type: "text",
          text: "處理指令時發生錯誤",
        },
      ],
    });
  }
}

async function handleFindCommand(params) {
  const { data, error } = await supabase
    .from("line_files")
    .select()
    .ilike("file_name", `%${params}%`);

  if (error) {
    console.error("database query error:", error);
    throw error;
  }

  return data;
}

export default router;
