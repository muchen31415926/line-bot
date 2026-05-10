import "dotenv/config";

import { onRequest } from "firebase-functions/v2/https";
import express from "express";
import { lineFileAssistantRouter } from "#routes";

const app = express();

app.use("/line_file_assistant", lineFileAssistantRouter);

export const api = onRequest(
  {
    region: "asia-east1",
    cors: false,
    minInstances: 0,
  },
  app,
);
