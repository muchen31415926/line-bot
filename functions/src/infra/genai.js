import { GoogleGenAI } from "@google/genai";

import { Config } from "../config.js";

export const GenAI = new GoogleGenAI(Config.genAi);
