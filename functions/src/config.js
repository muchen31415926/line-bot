import { applicationDefault } from "firebase-admin/app";

export const config = {
  firebase: {
    credential: applicationDefault(),
    storageBucket: "gs://lineai-a74a2.firebasestorage.app",
  },

  line: {
    channelSecret: process.env.LINE_SECRET_ROB_V1,
    channelAccessToken: process.env.LINE_ACCESS_TOKEN_ROB_V1,
  },

  supabase: {
    url: process.env.SUPABASE_URL,
    secret: process.env.SUPABASE_SECRET_KEY,
  },

  genAi: { apiKey: process.env.GEMINI_API_KEY },
};
