import express from "express";
import { middleware } from "@line/bot-sdk";

import { Config } from "#config";
import { handleWebhook } from "../controllers/line_cotroller.js";

const router = express.Router();

router.get("/", (req, res) => res.send("line file assistant test"));

router.post("/", middleware(Config.line), async (req, res) => {
  await handleWebhook(req, res);
});

export default router;
