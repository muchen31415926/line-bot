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

// 內存儲存對話歷史（不持久）
let conversationHistory = [];

const router = express.Router();

router.get("/", (req, res) => {
  res.send(getAIResponse("今天溫度是幾度"));
});

// LINE webhook
router.post("/", line.middleware(config), async (req, res) => {
  try {
    const events = req.body.events || [];

    for (const event of events) {
      if (event.type === "message" && event.message.type === "text") {
        const userMessage = event.message.text.trim();

        console.log("收到文字訊息:", userMessage);

        try {
          const aiResponse = await getAIResponse(userMessage);

          await client.replyMessage({
            replyToken: event.replyToken,
            messages: [
              {
                type: "text",
                text: aiResponse,
              },
            ],
          });

          console.log("成功回覆訊息");
        } catch (error) {
          console.error("處理 AI 回應時發生錯誤:", error);

          await client.replyMessage({
            replyToken: event.replyToken,
            messages: [
              {
                type: "text",
                text: "抱歉，我現在有點忙，請稍後再試！😅",
              },
            ],
          });
        }
      }
    }

    res.status(200).send("OK");
  } catch (error) {
    console.error("處理 webhook 時發生錯誤:", error);
    res.status(500).send("Error");
  }
});

// ======================
// Gemini 回應函式
// ======================
async function getAIResponse(userMessage) {
  // 準備 contents，包含歷史 + 新訊息
  const contents = [
    ...conversationHistory.map((msg) => ({
      role: msg.role,
      parts: [{ text: msg.text }],
    })),
    {
      role: "user",
      parts: [{ text: userMessage }],
    },
  ];

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",

    // 系統人格（對應 instructions）
    systemInstruction: `你是一個友善、幽默的 LINE AI 聊天機器人助手。
- 使用繁體中文
- 回答簡潔
- 適度幽默
- 像朋友聊天
- 如果需要最新資訊，可以使用搜尋功能`,

    contents,

    // 搜尋工具（對應 web_search）
    tools: [
      {
        googleSearch: {},
      },
    ],

    // 控制生成
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 50,
    },
  });

  const aiText = response.text;

  // 更新對話歷史
  conversationHistory.push({ role: "user", text: userMessage });
  conversationHistory.push({ role: "model", text: aiText });

  // 限制為20輪（40條訊息）
  if (conversationHistory.length > 40) {
    conversationHistory.splice(0, conversationHistory.length - 40);
  }

  return aiText;
}

export default router;
