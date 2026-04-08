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
        let data = { messageId };
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
  data = await publicUrl(data);
  data = getPublicUrl(data);
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
  const fileName = `${data.messageId}.${data.ext}`;
  const fileRef = bucket.file(fileName);

  return {
    ...data,
    fileName,
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

  return data;
}

async function publicUrl(data) {
  // set file to public
  await data.fileRef.makePublic();
  console.log(`${data.fileName} is now public`);
  return data;
}

function getPublicUrl(data) {
  data.downloadURL = `https://storage.googleapis.com/${bucket.name}/${data.fileName}`;
  return { ...data, downloadURL: data.downloadURL };
}

export default router;
