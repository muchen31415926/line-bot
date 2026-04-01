import { onRequest } from "firebase-functions/v2/https"; // 第二代 HTTPS function
import express from "express";
import indexRouter from "./api/index.js";
import linebotDemoRouter from "./api/linebot_demo.js";
import lineMbti from "./api/line_mbti.js";
import geminiRouter from "./api/gemini.js";
import testRouter from "./api/ai_test.js";

const app = express();
//https://songless-kingston-unsympathetically.ngrok-free.dev/lineai-a74a2/asia-east1/api/gemini
app.use("/", indexRouter);
app.use("/line_demo", linebotDemoRouter);
app.use("/line_mbti", lineMbti);
app.use("/gemini", geminiRouter);
app.use("/test", testRouter);

export const api = onRequest(
  {
    region: "asia-east1", //設定地理位置為台灣
    cors: false, //true 讓前端瀏覽器可以呼叫請寫
    minInstances: 0,
  },
  app,
);
