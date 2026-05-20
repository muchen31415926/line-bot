import { messagingApi } from "@line/bot-sdk";

import { config } from "../config.js";

export const lineBlobClient = new messagingApi.MessagingApiBlobClient(
  config.line,
);

export const lineClient = new messagingApi.MessagingApiClient(config.line);
