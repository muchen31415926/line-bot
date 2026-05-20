import { buildHelpMenu } from "#templates";
import { replyFlex } from "../services/line-reply.js";

export async function handleHelpCommand(event, arg, sourceData) {
  const flexMessage = buildHelpMenu();
  await replyFlex(event.replyToken, flexMessage);
}
