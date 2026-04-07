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
  let data = await detectFileType(messageId);
  data = createFileRef(data);
  data = await uploadFile(data);
  data = getPublicUrl(data);
  return data;
}

async function uploadFile(data) {
  // get readable stream for file upload
  const uploadStream = await blobClient.getMessageContent(data.messageId);

  // get writable stream for GCS upload
  const writeStream = data.fileRef.createWriteStream({
    metadata: {
      contentType: data.mime,
    },
  });

  // chunk( buffer ) -> writable buffer -> GCS
  // count file size and upload
  let totalFileSize = 0;
  for await (const chunk of uploadStream) {
    totalFileSize += chunk.length;
    writeStream.write(chunk);
  }

  // all chunks written to writable stream
  writeStream.end();

  // wait for upload to complete
  await new Promise((resolve, reject) => {
    writeStream.on("finish", resolve);
    writeStream.on("error", reject);
  });

  // set file to public
  await data.fileRef.makePublic();
  console.log(`${data.fileName} is now public`);

  data.fileSize = totalFileSize;

  return { ...data, fileSize: totalFileSize };
}

async function detectFileType(messageId) {
  // get readable steam for detecting file type
  const detectionStream = await blobClient.getMessageContent(messageId);

  if (!detectionStream) {
    throw new Error("No stream available");
  }

  // get only the first 4.1 KB of data
  const headChunks = [];
  let headSize = 0;
  const MAX_DETECTION_BYTES = 4100;

  for await (const chunk of detectionStream) {
    headChunks.push(chunk);
    headSize += chunk.length;

    if (headSize >= MAX_DETECTION_BYTES) break;
  }

  const headBuffer = Buffer.concat(headChunks);
  const type = await fileTypeFromBuffer(headBuffer);

  if (!type || !type.ext) {
    throw new Error("Can not determine file type");
  }

  return {
    messageId,
    mime: type.mime,
    ext: type.ext,
  };
}

function createFileRef(data) {
  const fileName = `${data.messageId}.${data.ext}`;
  const fileRef = bucket.file(fileName);

  return {
    ...data,
    fileName,
    fileRef,
  };
}

function getPublicUrl(data) {
  data.downloadURL = `https://storage.googleapis.com/${bucket.name}/${data.fileName}`;
  return { ...data, downloadURL: data.downloadURL };
}

export default router;
