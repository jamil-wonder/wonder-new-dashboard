import type { NextConfig } from "next";
import path from "path";
import { AUTH_REDIRECTS } from "./src/lib/authRoutes";

const nextConfig: NextConfig = {
  turbopack: {
    root: path.resolve(__dirname),
  },
  // H1: the usual guesses for the sign-in / sign-up address all land on /auth
  async redirects() {
    return AUTH_REDIRECTS.map((r) => ({ ...r, permanent: true }));
  },
};

export default nextConfig;
