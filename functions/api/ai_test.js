import express from "express";
import dotenv from "dotenv";
import * as line from "@line/bot-sdk";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

const config = {
  channelSecret: process.env.LINE_SECRET_ROB_V1,
  channelAccessToken: process.env.LINE_ACCESS_TOKEN_ROB_V1,
};

const client = new line.messagingApi.MessagingApiClient(config);

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

const router = express.Router();

router.get("/", async (req, res) => {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: "請給我五個表情符號",
  });
  res.send(response.text);
});

export default router;
