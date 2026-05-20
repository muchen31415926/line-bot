import { initializeApp } from "firebase-admin/app";
import { getStorage } from "firebase-admin/storage";

import { config } from "../config.js";

// Initialize firebase admin sdk (app of name: default)
initializeApp(config.firebase);

export const bucket = getStorage().bucket();
