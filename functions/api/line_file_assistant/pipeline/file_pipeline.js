import { getLineMessageBuffer } from "./steps/get_line_message_buffer.js";
import { detectFileType } from "./steps/detect_file_type.js";
import { getFileSize } from "./steps/get_file_size.js";
import { createFileName } from "./steps/create_file_name.js";
import { createStoragePath } from "./steps/create_storage_path.js";
import { createFileRef } from "./steps/create_file_ref.js";
import { uploadFile } from "./steps/upload_file.js";
import { setFilePublic } from "./steps/set_file_public.js";
import { getPublicUrl } from "./steps/get_public_url.js";
import { getEmbedding } from "./steps/get_embedding.js";
import { saveInDB } from "./steps/save_in_db.js";

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

export async function runFilePipeline(data) {
  let ctx = data;
  for (const step of steps) {
    ctx = await step(ctx);
  }

  return ctx;
}
