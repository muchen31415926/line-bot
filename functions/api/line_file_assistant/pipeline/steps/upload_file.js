export async function uploadFile(data) {
  // get writable stream for GCS upload
  const writeStream = data.fileRef.createWriteStream({
    metadata: {
      contentType: data.mime,
    },
  });

  // chunk( buffer ) -> writable buffer -> GCS
  // all chunks written to writable stream
  writeStream.end(data.buffer);

  // wait for upload to complete
  await new Promise((resolve, reject) => {
    writeStream.on("finish", resolve);
    writeStream.on("error", reject);
  });

  // remove buffer from data
  const { buffer, ...rest } = data;
  return rest;
}
