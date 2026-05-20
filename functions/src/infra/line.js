import { messagingApi } from "@line/bot-sdk";

import { Config } from "../config.js";

export const lineBlobClient = new messagingApi.MessagingApiBlobClient(
  Config.line,
);

export const lineClient = new messagingApi.MessagingApiClient(Config.line);
