export function getFileSize(data) {
  return {
    ...data,
    fileSize: data.buffer.length,
  };
}
