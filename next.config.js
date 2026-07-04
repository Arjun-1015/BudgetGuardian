/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // "standalone" output is only for the Docker build path (see Dockerfile,
  // which sets BUILD_STANDALONE=true) — it produces a self-contained
  // server bundle at .next/standalone/server.js. That mode is incompatible
  // with plain `next start`, which is how you'd run a local production
  // build to test performance, so it's opt-in via env var rather than
  // always-on.
  ...(process.env.BUILD_STANDALONE === "true" ? { output: "standalone" } : {}),
};

module.exports = nextConfig;
