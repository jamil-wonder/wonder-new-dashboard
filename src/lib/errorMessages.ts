// H2: what a failed request says to a person. Never raw JSON, never a status
// code, never "API Error (...)", never "Failed to fetch".
//
//   401  sign-in: "That email or password isn't right."  verify: "That code isn't right..."  else: "Your session has expired..."
//   403  "You don't have permission to do that."
//   404  "We couldn't find that."
//   409  sign-up: "An account with this email already exists."  else the server's sentence, or "That already exists."
//   422  the server's sentence when it is plain English; a list of field errors -> "Some details aren't valid..."
//   429  the server's sentence when plain English, else "You're doing that too often..."
//   5xx  "Something went wrong on our side..."
//   network / timeout  "We can't reach the server..."
//   anything else  the caller's fallback

export type ErrorContext = "login" | "signup" | "verify" | "generic";

const DEFAULT_FALLBACK = "Something went wrong. Please try again.";

export function statusOf(err: unknown): number | null {
  const direct = (err as { status?: unknown } | null)?.status;
  if (typeof direct === "number" && direct >= 100 && direct < 600) return direct;
  const raw = err instanceof Error ? err.message : typeof err === "string" ? err : "";
  const m = raw.match(/API Error \((\d{3})\)/);
  return m ? Number(m[1]) : null;
}

function bodyOf(err: unknown): string {
  const raw = err instanceof Error ? err.message : typeof err === "string" ? err : "";
  const m = raw.match(/API Error \(\d+\):\s*([\s\S]*)/);
  return m ? m[1] : raw;
}

/** The server's `detail`: { text } when it is one string, { list: true } when it is a list of field errors. */
function detailOf(err: unknown): { text?: string; list?: boolean } {
  const body = bodyOf(err).trim();
  if (!body.startsWith("{")) return {};
  try {
    const parsed = JSON.parse(body);
    if (typeof parsed?.detail === "string") return { text: parsed.detail.trim() };
    if (Array.isArray(parsed?.detail)) return { list: true };
  } catch {
    /* not JSON */
  }
  return {};
}

/** Is this safe and sensible to show as it is? Plain words, no code, no status. */
export function looksHuman(text: string | undefined | null): text is string {
  if (!text) return false;
  const t = text.trim();
  if (t.length < 4 || t.length > 220) return false;
  if (/[{}[\]<>]|https?:|traceback|exception|undefined|null\b|api error|status code|\bHTTP\b|\b[45]\d\d\b/i.test(t)) return false;
  if (/^\w+(Error|Exception):/.test(t)) return false;
  if (/[a-z_]+\.[a-z_]+\(/i.test(t)) return false;                 // looks like code: foo.bar(
  // a sentence (three or more words), not a one-word label like "Forbidden"
  return /[A-Za-z]{3}/.test(t) && /^[A-Z“"']/.test(t) && t.split(/\s+/).length >= 3;
}

const NETWORK = /failed to fetch|networkerror|load failed|network request failed|fetch failed|err_connection|econnrefused/i;

export function humanizeError(err: unknown, fallback: string = DEFAULT_FALLBACK, context: ErrorContext = "generic"): string {
  const status = statusOf(err);
  const detail = detailOf(err);
  const serverSentence = looksHuman(detail.text) ? detail.text : null;
  const raw = err instanceof Error ? err.message : typeof err === "string" ? err : "";
  const name = err instanceof Error ? err.name : "";

  if (status === null) {
    if (name === "AbortError") return "That took too long, so we stopped. Please try again.";
    if (name === "TypeError" || NETWORK.test(raw)) return "We can't reach the server. Check your internet connection and try again.";
    // an error our own code threw with a plain sentence
    return looksHuman(raw) ? raw : fallback;
  }

  if (status === 401) {
    if (context === "login") return "That email or password isn't right. Please try again.";
    if (context === "verify") return "That code isn't right or has expired. Please try again or ask for a new one.";
    if (context === "signup") return "We couldn't sign you in. Please try again.";
    return "Your session has expired. Please sign in again.";
  }
  if (status === 403) return serverSentence || "You don't have permission to do that.";
  if (status === 404) return context === "verify" ? "We couldn't find that code. Ask for a new one." : "We couldn't find that. It may have been removed.";
  if (status === 409) {
    if (context === "signup") return "An account with this email already exists. Try signing in instead.";
    return serverSentence || "That already exists.";
  }
  if (status === 400 || status === 422) {
    if (serverSentence) return serverSentence;
    if (detail.list || status === 422) return "Some of the details aren't valid. Please check what you entered and try again.";
    return fallback;
  }
  if (status === 429) return serverSentence || "You're doing that too often. Please wait a little and try again.";
  if (status === 503) return "The service is busy right now. Please try again in a moment.";
  if (status >= 500) return "Something went wrong on our side. Please try again in a moment.";
  return serverSentence || fallback;
}
