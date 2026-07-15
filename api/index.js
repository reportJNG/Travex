import { handle } from "hono/vercel";
import app from "../dist/boot.js";

export const fetch = handle(app);
