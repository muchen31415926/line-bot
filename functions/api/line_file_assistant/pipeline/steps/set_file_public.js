export async function setFilePublic(data) {
  // set file to public
  await data.fileRef.makePublic();
  return data;
}
