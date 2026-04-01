import express from 'express';
import dotenv from "dotenv";
import * as line from "@line/bot-sdk";

const result = dotenv.config();


const config = {
    channelSecret: process.env.LINE_SECRET_ROB_V1,
    channelAccessToken: process.env.LINE_ACCESS_TOKEN_ROB_V1
}
console.log(config, "config");


const client = new line.messagingApi.MessagingApiClient(config);
// console.log(client,"client");

const router = express.Router();

router.get('/', (req, res) => {
    
    res.send("我是 line_bot 機器人_測試");
});

export default router;
