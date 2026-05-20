import { initializeApp } from "firebase-admin/app";
import { getStorage } from "firebase-admin/storage";

import { Config } from "../config.js";

// Initialize firebase admin sdk (app of name: default)
initializeApp(Config.firebase);

export const bucket = getStorage().bucket();
