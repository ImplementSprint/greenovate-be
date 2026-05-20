import dotenv from "dotenv";
import fs from "fs";
import path from "path";

dotenv.config();

const loadFallbackEnv = () => {
  const candidates = [
    path.resolve(process.cwd(), ".env"),
    path.resolve(process.cwd(), "..", ".env"),
    path.resolve(process.cwd(), "..", "..", ".env"),
    path.resolve(process.cwd(), "..", "..", "..", ".env"),
    path.resolve(process.cwd(), "..", "..", "..", "..", ".env"),
  ];

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      dotenv.config({ path: candidate, override: false });
    }
  }
};

loadFallbackEnv();

const parseBoolean = (value, fallback) => {
  if (value === undefined || value === "") {
    return fallback;
  }

  return value.toLowerCase() === "true";
};

export const env = {
  nodeEnv: process.env.NODE_ENV || "development",
  port: Number(process.env.PORT || 4007),
  databaseUrl:
    process.env.SUPABASE_QUALITY_DATABASE_URL ||
    process.env.DOMAIN4_DATABASE_URL ||
    "",
  dbSsl: parseBoolean(process.env.DB_SSL, true),
  // Fulfillment Project (Consolidated)
  supabaseUrl: (
    process.env.SUPABASE_FULFILLMENT_URL ||
    process.env.DOMAIN3_SUPABASE_URL ||
    process.env.DOMAIN4_SUPABASE_URL ||
    ""
  ).trim(),
  supabaseAnonKey: (
    process.env.SUPABASE_FULFILLMENT_ANON_KEY ||
    process.env.DOMAIN3_SUPABASE_ANON_KEY ||
    process.env.DOMAIN4_SUPABASE_ANON_KEY ||
    ""
  ).trim(),

  // Supply‑Chain Project (Operational data)
  scmSupabaseUrl: (
    process.env.NEXT_PUBLIC_SUPABASE_SUPPLY_CHAIN_URL ||
    "https://wbktqkjdsqrvqxxtitsg.supabase.co"
  ).trim(),
  scmSupabaseAnonKey: (
    process.env.NEXT_PUBLIC_SUPABASE_SUPPLY_CHAIN_ANON_KEY ||
    ""
  ).trim(),
};
