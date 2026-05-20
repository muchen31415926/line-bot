import { createClient } from "@supabase/supabase-js";

import { Config } from "../config.js";

export const supabase = createClient(
  Config.supabase.url,
  Config.supabase.secret,
);
