import { bucket } from "../../config.js";

export function createFileRef(data) {
  const fileRef = bucket.file(data.storagePath);
  return { ...data, fileRef };
}
