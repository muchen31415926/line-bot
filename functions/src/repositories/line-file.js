import { supabase } from "../infra/supabase.js";
import { GenAI } from "../infra/genai.js";

export async function findFiles(arg, sourceData) {
  const { data, error } = await supabase
    .from("line_files")
    .select("file_name, file_size, extension, download_url")
    .ilike("file_name", `%${arg}%`)
    .eq("source_id", sourceData.sourceId);

  if (error) {
    console.error("database query error:", error);
    throw error;
  }

  return data;
}

export async function matchFiles(arg, sourceData) {
  const res = await GenAI.models.embedContent({
    model: "gemini-embedding-001",
    contents: arg,
    config: { outputDimensionality: 768 },
  });

  const { data, error } = await supabase.schema("public").rpc("match_files", {
    query_embedding: res.embeddings[0].values,
    source_id: sourceData.sourceId,
    result_limit: 3,
  });

  if (error) {
    console.error("match query error:", error);
    throw error;
  }

  return data;
}
