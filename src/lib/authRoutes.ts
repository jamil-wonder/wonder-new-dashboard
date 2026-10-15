// H1: one address for sign-in and sign-up - /auth - with the tab in the URL.
//   /auth                 -> Sign In
//   /auth?signup=true     -> Create Account
// The old guessable addresses (/login, /auth/login, /signup, /register) are
// redirected there in next.config.ts. The tab shown always follows the URL, so
// links, the back button and the tab buttons all agree.

export type AuthMode = "login" | "signup";

export const AUTH_PATH = "/auth";

export function authModeFromParam(value: string | null | undefined): AuthMode {
  return value === "true" ? "signup" : "login";
}

export function authUrl(mode: AuthMode): string {
  return mode === "signup" ? `${AUTH_PATH}?signup=true` : AUTH_PATH;
}

// source -> destination, used by next.config.ts
export const AUTH_REDIRECTS: { source: string; destination: string }[] = [
  { source: "/login", destination: authUrl("login") },
  { source: "/auth/login", destination: authUrl("login") },
  { source: "/signup", destination: authUrl("signup") },
  { source: "/register", destination: authUrl("signup") },
  { source: "/auth/signup", destination: authUrl("signup") },
  { source: "/auth/register", destination: authUrl("signup") },
];
