export function createStoragePath(data) {
  const storagePath = `${data.sourceType}${data.sourceId}/${data.fileName}.${data.ext}`;
  return { ...data, storagePath };
}
