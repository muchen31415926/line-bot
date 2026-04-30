import { fileTypeFromBuffer } from "file-type";

export async function detectFileType(data) {
  const type = await fileTypeFromBuffer(data.buffer);

  if (!type || !type.ext) {
    throw new Error("Can not determine file type");
  }

  return { ...data, mime: type.mime, ext: type.ext };
}
