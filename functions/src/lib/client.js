import { initializeApp } from "firebase-admin/app";
import { getStorage } from "firebase-admin/storage";
import { createClient } from "@supabase/supabase-js";
import { messagingApi } from "@line/bot-sdk";
import { GoogleGenAI } from "@google/genai";

import { Config } from "#config";

// Initialize firebase admin sdk (app of name: default)
initializeApp(Config.firebase);

export const GenAI = new GoogleGenAI(Config.genAi);

export const supabase = createClient(
  Config.supabase.url,
  Config.supabase.secret,
);

export const lineBlobClient = new messagingApi.MessagingApiBlobClient(
  Config.line,
);

export const lineClient = new messagingApi.MessagingApiClient(Config.line);

export const bucket = getStorage().bucket();
