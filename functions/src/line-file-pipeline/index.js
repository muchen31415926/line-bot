import {
  getLineMessageBuffer,
  detectFileType,
  getFileSize,
  createFileName,
  createStoragePath,
  createFileRef,
  uploadFile,
  setFilePublic,
  getPublicUrl,
  getEmbedding,
  saveInDB,
} from "#steps";

const steps = [
  getLineMessageBuffer,
  detectFileType,
  getFileSize,
  createFileName,
  createStoragePath,
  createFileRef,
  uploadFile,
  setFilePublic,
  getPublicUrl,
  getEmbedding,
  saveInDB,
];

export default async function runFilePipeline(payload) {
  let context = payload;
  try {
    for (const step of steps) {
      context = await step(context);
    }
  } catch (error) {
    console.error("Error occurred while running file pipeline:", error);
    throw error;
  }

  return context;
}
