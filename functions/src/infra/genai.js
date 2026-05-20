import { GoogleGenAI } from "@google/genai";

import { config } from "../config.js";

export const GenAI = new GoogleGenAI(config.genAi);
