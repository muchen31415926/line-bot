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

export async function runFilePipeline(payload) {
  let context = payload;
  for (const step of steps) {
    context = await step(context);
  }

  return context;
}
