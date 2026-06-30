import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Cross-origin isolation → enables SharedArrayBuffer → wllama multi-threading.
  // credentialless lets the model download from HuggingFace without CORP headers.
  // NOTE: headers() is ignored by `output: "export"`; for static prod we set these
  // on the host (e.g. vercel.json) instead. This covers `next dev`.
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
          { key: "Cross-Origin-Embedder-Policy", value: "credentialless" },
        ],
      },
    ];
  },
};

export default nextConfig;
