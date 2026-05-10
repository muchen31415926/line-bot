import { supabase } from "../../../lib/client.js";

export async function saveInDB(data) {
  const row = {
    message_id: data.messageId,
    message_type: data.messageType,
    source_type: data.sourceType,
    source_id: data.sourceId,
    storage_path: data.storagePath,
    content_type: data.mime,
    file_size: data.fileSize,
    file_name: data.fileName,
    extension: data.ext,
    embedding: data.embedding,
    download_url: data.downloadURL,
  };

  const { error } = await supabase.from("line_files").insert(row);

  if (error) {
    console.error("database insert error:", error);
    throw error;
  }

  return data;
}
