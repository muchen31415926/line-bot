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
  // get readable stream
  const stream = await blobClient.getMessageContent(messageId);

  if (!stream) {
    throw new Error("No stream available");
  }

  const file = bucket.file(messageId); // 先不用副檔名

  const writeStream = file.createWriteStream();

  let totalFileSize = 0;

  const headChunks = [];
  let headSize = 0;
  const MAX_HEAD = 4100;

  for await (const chunk of stream) {
    totalFileSize += chunk.length;

    // 收前 4KB 判斷格式
    if (headSize < MAX_HEAD) {
      headChunks.push(chunk);
      headSize += chunk.length;
    }

    writeStream.write(chunk);
  }

  writeStream.end();

  await new Promise((resolve, reject) => {
    writeStream.on("finish", resolve);
    writeStream.on("error", reject);
  });

  // 🔍 判斷檔案格式
  const headBuffer = Buffer.concat(headChunks);
  const type = await fileTypeFromBuffer(headBuffer);

  const ext = type?.ext ? `.${type.ext}` : "";
  const mime = type?.mime || "application/octet-stream";

  const newFileName = `${messageId}${ext}`;

  // 🔁 rename + 設 metadata
  await file.move(newFileName);

  const newFile = bucket.file(newFileName);

  await newFile.setMetadata({
    contentType: mime,
  });

  await newFile.makePublic();

  console.log(`${newFileName} uploaded`);

  return {
    fileName: newFileName,
    fileSize: totalFileSize,
  };
}

// 取得永久 URL
function getPublicUrl(fileName) {
  return `https://storage.googleapis.com/${bucket.name}/${fileName}`;
}

export default router;
