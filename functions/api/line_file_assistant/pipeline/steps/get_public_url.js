import { bucket } from "../../services.js";

export function getPublicUrl(data) {
  const downloadURL = `https://storage.googleapis.com/${bucket.name}/${data.storagePath}`;
  return { ...data, downloadURL };
}
