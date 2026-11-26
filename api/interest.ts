import type { IncomingMessage, ServerResponse } from "node:http";
import { handleInterest } from "../server/waitlist.js";
export default function handler(req: IncomingMessage & { body?: unknown }, res: ServerResponse) {
  return handleInterest(req, res, { url: process.env.WAITLIST_SITE_URL, serviceToken: process.env.WAITLIST_SITES_TOKEN, writeKey: process.env.WAITLIST_WRITE_KEY });
}
