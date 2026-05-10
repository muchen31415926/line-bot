import "dotenv/config";

import { onRequest } from "firebase-functions/v2/https";
import express from "express";
import lineFileAssistant from "./routes/line_file_assistant_router.js";

const app = express();

app.use("/line_file_assistant", lineFileAssistant);

export const api = onRequest(
  {
    region: "asia-east1",
    cors: false,
    minInstances: 0,
  },
  app,
);
