import { lineBlobClient } from "../../config.js";

export async function getLineMessageBuffer(data) {
  // get readable stream
  const stream = await lineBlobClient.getMessageContent(data.messageId);

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
