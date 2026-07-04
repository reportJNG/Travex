import { config } from "dotenv";

config({ path: ".env", override: false });

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function requiredAny(name: string, fallbackName: string): string {
  const value = process.env[name] || process.env[fallbackName];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name} or ${fallbackName}`);
  }
  return value;
}

export const env = {
  isProduction: process.env.NODE_ENV === "production",
  supabaseUrl: requiredAny("SUPABASE_URL", "VITE_SUPABASE_URL"),
  supabaseAnonKey: requiredAny("SUPABASE_ANON_KEY", "VITE_SUPABASE_ANON_KEY"),
  supabaseServiceRoleKey: required("SUPABASE_SERVICE_ROLE_KEY"),
  databaseUrl: process.env.DATABASE_URL ?? "",
  cronSecret: process.env.CRON_SECRET ?? "",
};
