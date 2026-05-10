import { bucket } from "../../../lib/client.js";

export function getPublicUrl(data) {
  const downloadURL = `https://storage.googleapis.com/${bucket.name}/${data.storagePath}`;
  return { ...data, downloadURL };
}
