import { initializeApp, applicationDefault } from "firebase-admin/app";
import { getStorage } from "firebase-admin/storage";
import { createClient } from "@supabase/supabase-js";
import { messagingApi } from "@line/bot-sdk";
import { GoogleGenAI } from "@google/genai";

export const lineConfig = {
  channelSecret: process.env.LINE_SECRET_ROB_V1,
  channelAccessToken: process.env.LINE_ACCESS_TOKEN_ROB_V1,
};

export const lineBlobClient = new messagingApi.MessagingApiBlobClient(
  lineConfig,
);

export const lineClient = new messagingApi.MessagingApiClient(lineConfig);

export const GenAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SECRET_KEY,
);

console.log("BUCKET:", process.env.FIREBASE_STORAGE_BUCKET);
// Initialize firebase admin sdk (app of name: default)
initializeApp({
  credential: applicationDefault(),
  storageBucket: "bucket reference",
});

export const bucket = getStorage().bucket();
