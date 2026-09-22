import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  serverExternalPackages: ["pg"],
  outputFileTracingIncludes: {
    "*": ["./scripts/**/*", "./src/db/migrations/**/*"],
  },
};

export default nextConfig;
