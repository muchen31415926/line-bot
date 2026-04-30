import path from "path";

export function createFileName(data) {
  const fileName = data.originalFileName
    ? path.parse(data.originalFileName).name
    : data.messageId;

  return { ...data, fileName };
}
