import { replyText } from "../services/line_reply_service.js";
import {
  handleHelpCommand,
  handleFindCommand,
  handleMatchCommand,
} from "#handlers";

const commandMap = new Map([
  ["/help", handleHelpCommand],
  ["/find", handleFindCommand],
  ["/match", handleMatchCommand],
]);

export async function dispatchCommand(event, userText, sourceData) {
  try {
    const [command, arg] = userText.split(" ");

    if (!commandMap.has(command)) {
      return await replyText(event.replyToken, `未有該指令: ${command}`);
    }

    const handler = commandMap.get(command);
    await handler(event, arg, sourceData);
  } catch (error) {
    console.error(`dispatchCommand error: ${error}`);
  }
}
