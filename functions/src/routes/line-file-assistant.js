import express from "express";
import { middleware } from "@line/bot-sdk";

import { Config } from "../config.js";
import { handleWebhook } from "../controllers/line.js";

const lineFileAssistantRouter = express.Router();

lineFileAssistantRouter.get("/", (req, res) =>
  res.send("line file assistant test"),
);

lineFileAssistantRouter.post("/", middleware(Config.line), async (req, res) => {
  await handleWebhook(req, res);
});

export { lineFileAssistantRouter };
