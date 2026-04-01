import express from "express";
import dotenv from "dotenv";
import * as line from "@line/bot-sdk";

dotenv.config();

const config = {
  channelSecret: process.env.LINE_SECRET_ROB_V1,
  channelAccessToken: process.env.LINE_ACCESS_TOKEN_ROB_V1,
};

const client = new line.messagingApi.MessagingApiClient(config);
const MBTI_DATA_URL = "https://lineai-a74a2.web.app/mbti_data.json";

const router = express.Router();

router.get("/", (req, res) => {
  res.send("我是 linebot_mbti webhook");
});

// 處理 line webhook
router.post("/", line.middleware(config), async (req, res) => {
  try {
    // LINE 會將事件放在 req.body.events 陣列中
    const events = req.body.events || [];

    // 處理每個事件
    for (const event of events) {
      // 檢查是否為文字訊息事件
      if (event.type === "message" && event.message.type === "text") {
        const text = event.message.text.trim(); // 取得文字內容並去除空白

        console.log("收到文字訊息:", text);

        // 將輸入轉換為大寫，以便查詢
        const mbtiType = text.toUpperCase();

        // 驗證是否為有效的 MBTI 類型（4個字母）
        if (mbtiType.length === 4 && /^[EI][NS][FT][PJ]$/.test(mbtiType)) {
          try {
            // 從 Firebase Hosting 獲取 MBTI 資料
            const mbtiData = await fetchMBTIData();

            if (mbtiData && mbtiData[mbtiType]) {
              const mbtiInfo = mbtiData[mbtiType];

              // 使用 Flex Message 回覆
              await client.replyMessage({
                replyToken: event.replyToken,
                messages: [createFlexMessage(mbtiType, mbtiInfo)],
              });

              console.log(`成功回覆 MBTI 類型: ${mbtiType}`);
            } else {
              // MBTI 類型不存在
              await client.replyMessage({
                replyToken: event.replyToken,
                messages: [
                  {
                    type: "text",
                    text: `抱歉，找不到 "${mbtiType}" 的資料。\n\n請輸入有效的 MBTI 類型（例如：ENFP、INTJ、ISFJ 等）`,
                  },
                ],
              });
            }
          } catch (error) {
            console.error("查詢 MBTI 資料時發生錯誤:", error);
            await client.replyMessage({
              replyToken: event.replyToken,
              messages: [
                {
                  type: "text",
                  text: "抱歉，查詢 MBTI 資料時發生錯誤，請稍後再試。",
                },
              ],
            });
          }
        } else {
          // 輸入格式不正確
          await client.replyMessage({
            replyToken: event.replyToken,
            messages: [
              {
                type: "text",
                text: "請輸入有效的 MBTI 類型（4個字母，例如：ENFP、INTJ、ISFJ 等）\n\n支援的類型：\nENFP, ENFJ, ENTP, ENTJ\nINFP, INFJ, INTP, INTJ\nESFP, ESFJ, ESTP, ESTJ\nISFP, ISFJ, ISTP, ISTJ",
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

// 從 Firebase Hosting 獲取 MBTI 資料
async function fetchMBTIData() {
  try {
    const response = await fetch(MBTI_DATA_URL);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("獲取 MBTI 資料失敗:", error);
    throw error;
  }
}

// 創建 Flex Message
function createFlexMessage(mbtiType, mbtiInfo) {
  // 將優點和缺點轉換為文字
  const strengthsText = mbtiInfo.strengths
    .map((s, i) => `${i + 1}. ${s}`)
    .join("\n");
  const weaknessesText = mbtiInfo.weaknesses
    .map((w, i) => `${i + 1}. ${w}`)
    .join("\n");
  const careerText = mbtiInfo.careerSuggestions.join("、");

  return {
    type: "flex",
    altText: `${mbtiType} - ${mbtiInfo.name}`,
    contents: {
      type: "bubble",
      header: {
        type: "box",
        layout: "vertical",
        contents: [
          {
            type: "text",
            text: mbtiType,
            weight: "bold",
            size: "xl",
            color: "#FFFFFF",
            align: "center",
          },
          {
            type: "text",
            text: mbtiInfo.name,
            size: "sm",
            color: "#FFFFFF",
            align: "center",
            margin: "md",
          },
          {
            type: "text",
            text: mbtiInfo.englishName,
            size: "xs",
            color: "#FFFFFFCC",
            align: "center",
            margin: "xs",
          },
        ],
        paddingAll: "20px",
        backgroundColor: "#DC143C",
        paddingTop: "22px",
        paddingBottom: "22px",
      },
      body: {
        type: "box",
        layout: "vertical",
        contents: [
          {
            type: "text",
            text: "簡介",
            weight: "bold",
            size: "md",
            margin: "md",
          },
          {
            type: "text",
            text: mbtiInfo.description,
            wrap: true,
            size: "sm",
            color: "#666666",
            margin: "sm",
          },
          {
            type: "separator",
            margin: "xl",
          },
          {
            type: "text",
            text: "優點",
            weight: "bold",
            size: "md",
            margin: "xl",
          },
          {
            type: "text",
            text: strengthsText,
            wrap: true,
            size: "sm",
            color: "#666666",
            margin: "sm",
          },
          {
            type: "separator",
            margin: "xl",
          },
          {
            type: "text",
            text: "缺點",
            weight: "bold",
            size: "md",
            margin: "xl",
          },
          {
            type: "text",
            text: weaknessesText,
            wrap: true,
            size: "sm",
            color: "#666666",
            margin: "sm",
          },
          {
            type: "separator",
            margin: "xl",
          },
          {
            type: "text",
            text: "適合職業",
            weight: "bold",
            size: "md",
            margin: "xl",
          },
          {
            type: "text",
            text: careerText,
            wrap: true,
            size: "sm",
            color: "#666666",
            margin: "sm",
          },
        ],
      },
    },
  };
}

export default router;
