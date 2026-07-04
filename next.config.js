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
  experimental: {
    // Next's client-side router cache otherwise keeps a page's server-
    // rendered payload around for ~30s and reuses it on navigation, even
    // if the underlying data (or the logged-in user) has changed since.
    // That's what caused stale dashboard numbers after adding an expense,
    // and the more serious cross-account data leak on shared browsers.
    // Financial data always needs to be fetched fresh — this is not a
    // page worth trading correctness for a snappier back/forward nav.
    staleTimes: {
      dynamic: 0,
      static: 0,
    },
  },
};

module.exports = nextConfig;
