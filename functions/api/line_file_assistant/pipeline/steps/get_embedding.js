import { GenAI } from "../../config.js";

export async function getEmbedding(data) {
  const res = await GenAI.models.embedContent({
    model: "gemini-embedding-001",
    contents: data.fileName,
    config: { outputDimensionality: 768 },
  });

  return { ...data, embedding: res.embeddings[0].values };
}
