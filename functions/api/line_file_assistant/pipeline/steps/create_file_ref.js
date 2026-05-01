import { bucket } from "../../services.js";

export function createFileRef(data) {
  const fileRef = bucket.file(data.storagePath);
  return { ...data, fileRef };
}
