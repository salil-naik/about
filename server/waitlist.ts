import type { IncomingMessage, ServerResponse } from "node:http";

export type WaitlistConfig = { url?: string; serviceToken?: string; writeKey?: string };
const errorMessage = "We couldn’t save your signup. Please try again shortly.";

export async function submitInterest(body: unknown, config: WaitlistConfig, fetcher: typeof fetch = fetch) {
  if (!body || typeof body !== "object" || Array.isArray(body)) return { status: 400, body: { error: "Invalid request." } };
  const data = body as Record<string, unknown>;
  if (data.website) return { status: 200, body: { ok: true } };
  const name = typeof data.name === "string" ? data.name.trim() : "";
  const email = typeof data.email === "string" ? data.email.trim().toLowerCase() : "";
  if (!name || name.length > 100 || /[\x00-\x1f]/.test(name) || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
    typeof data.experience !== "string" || !["new", "some", "building"].includes(data.experience) ||
    typeof data.course !== "string" || !["building", "motion", "both"].includes(data.course) || data.consent !== "yes") {
    return { status: 400, body: { error: "Please check your details and try again." } };
  }
  if (!config.url || !config.serviceToken || !config.writeKey) return { status: 503, body: { error: "The waitlist is temporarily unavailable. Please try again shortly." } };
  try {
    const target = new URL(config.url);
    if (target.protocol !== "https:" || !target.hostname.endsWith(".chatgpt.site")) throw new Error("Invalid backend URL");
    const response = await fetcher(new URL("/api/interest", target), {
      method: "POST", redirect: "error", signal: AbortSignal.timeout(15000),
      headers: { "Content-Type": "application/json", "OAI-Sites-Authorization": `Bearer ${config.serviceToken}`, "Authorization": `Bearer ${config.writeKey}` },
      body: JSON.stringify({ name, email, experience: data.experience, course: data.course, consent: "yes" }),
    });
    if (!response.ok || !response.headers.get("content-type")?.includes("application/json")) throw new Error("Backend unavailable");
    const result = await response.json();
    if (result.ok !== true) throw new Error("Signup was not saved");
    return { status: 200, body: { ok: true } };
  } catch { return { status: 503, body: { error: errorMessage } }; }
}

export async function handleInterest(req: IncomingMessage & { body?: unknown }, res: ServerResponse, config: WaitlistConfig) {
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "POST") { res.setHeader("Allow", "POST"); res.statusCode = 405; res.end(JSON.stringify({ error: "Method not allowed." })); return; }
  // Reject cross-site browser submissions; same-origin fetches use JSON.
  const site = req.headers["sec-fetch-site"];
  if (site === "cross-site" || !req.headers["content-type"]?.includes("application/json")) { res.statusCode = 403; res.end(JSON.stringify({ error: "Invalid request." })); return; }
  try {
    let body = req.body;
    if (body === undefined) {
      let raw = "";
      for await (const chunk of req) {
        raw += chunk.toString();
        if (Buffer.byteLength(raw) > 8192) { res.statusCode = 413; res.end(JSON.stringify({ error: "Request too large." })); return; }
      }
      body = JSON.parse(raw);
    } else if (typeof body === "string") {
      if (Buffer.byteLength(body) > 8192) throw new Error("Invalid body");
      body = JSON.parse(body);
    } else if (Buffer.byteLength(JSON.stringify(body)) > 8192) throw new Error("Invalid body");
    const result = await submitInterest(body, config);
    res.statusCode = result.status; res.end(JSON.stringify(result.body));
  } catch { res.statusCode = 400; res.end(JSON.stringify({ error: "Invalid request." })); }
}
