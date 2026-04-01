import express from "express";
import dotenv from "dotenv";
import * as line from "@line/bot-sdk";

dotenv.config();

const config = {
  channelSecret: process.env.LINE_SECRET_ROB_V1,
  channelAccessToken: process.env.LINE_ACCESS_TOKEN_ROB_V1,
};

const client = new line.messagingApi.MessagingApiClient(config);

const router = express.Router();

router.get("/", (req, res) => {
  res.send("我是 linebot_demo webhook");
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
        const text = event.message.text; // 取得文字內容

        console.log("收到文字訊息:", text);

        // 自動回覆相同的文字
        await client.replyMessage({
          replyToken: event.replyToken,
          messages: [
            {
              type: "text",
              text: text,
            },
          ],
        });

        const source = event.source;
        const sourceId = getPushTargetFromSource(source);
        // Push Message 範例 - 發送到個人、群組或聊天室
        // sourceId 可以是 userId、groupId 或 roomId
        if (sourceId) {
          try {
            await client.pushMessage({
              to: sourceId, // 可以是個人、群組或聊天室的 ID
              messages: [
                {
                  type: "text",
                  text: `這是透過 Push Message 發送到${source.type}的訊息！`,
                },
              ],
            });
            console.log(`Push Message 發送到${source.type}成功`);
          } catch (error) {
            console.error(`Push Message 發送到${source.type}失敗:`, error);
          }
        }
      }
    }

    res.status(200).send("OK");
  } catch (error) {
    console.error("處理 webhook 時發生錯誤:", error);
    res.status(500).send("Error");
  }
});

function getPushTargetFromSource(source) {
  if (source.type === "user" && source.userId) return source.userId;
  if (source.type === "group" && source.groupId) return source.groupId;
  if (source.type === "room" && source.roomId) return source.roomId;
  return undefined;
}

//幫我做一個延遲的
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export default router;
