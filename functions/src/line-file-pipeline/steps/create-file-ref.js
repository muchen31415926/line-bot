import { bucket } from "../../infra/firebase.js";

export function createFileRef(data) {
  const fileRef = bucket.file(data.storagePath);
  return { ...data, fileRef };
}
