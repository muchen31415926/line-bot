import { initializeApp } from "firebase-admin/app";
import { getStorage } from "firebase-admin/storage";
import express from "express";
import dotenv from "dotenv";
import { messagingApi, middleware } from "@line/bot-sdk";
import { fileTypeFromBuffer } from "file-type";

dotenv.config();

const config = {
  channelSecret: process.env.LINE_SECRET_ROB_V1,
  channelAccessToken: process.env.LINE_ACCESS_TOKEN_ROB_V1,
};

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
    const messageType = ["image", "video", "audio", "file"];

    for (const event of events) {
      if (
        event.type === "message" &&
        messageType.includes(event.message.type)
      ) {
        const messageId = event.message.id;
        let data = await handleFileMessage(messageId);

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

async function handleFileMessage(messageId) {
  let data = await uploadFile(messageId);
  data.downloadURL = getPublicUrl(data.fileName);

  return data;
}

async function uploadFile(messageId) {
  // ① 先拿 stream（只為了判斷格式）
  const detectionStream = await blobClient.getMessageContent(messageId);

  if (!detectionStream) {
    throw new Error("No stream available");
  }

  const headChunks = [];
  let headSize = 0;
  const MAX_HEAD = 4100;

  for await (const chunk of detectionStream) {
    headChunks.push(chunk);
    headSize += chunk.length;

    if (headSize >= MAX_HEAD) break;
  }

  const headBuffer = Buffer.concat(headChunks);
  const type = await fileTypeFromBuffer(headBuffer);

  if (!type || !type.ext) {
    throw new Error("Cannot determine file type");
  }

  const ext = `.${type.ext}`;
  const mime = type.mime;

  const fileName = `${messageId}${ext}`;
  const file = bucket.file(fileName);

  // ② 再拿一次 stream（真正寫入）
  const uploadStream = await blobClient.getMessageContent(messageId);
  const writeStream = file.createWriteStream({
    metadata: {
      contentType: mime,
    },
  });

  let totalFileSize = 0;

  for await (const chunk of uploadStream) {
    totalFileSize += chunk.length;
    writeStream.write(chunk);
  }

  writeStream.end();

  await new Promise((resolve, reject) => {
    writeStream.on("finish", resolve);
    writeStream.on("error", reject);
  });

  await file.makePublic();

  console.log(`${fileName} uploaded`);

  return {
    fileName,
    fileSize: totalFileSize,
  };
}

// 取得永久 URL
function getPublicUrl(fileName) {
  return `https://storage.googleapis.com/${bucket.name}/${fileName}`;
}

export default router;
