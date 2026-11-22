import type { NextConfig } from "next";

const apiUrl = process.env.API_URL ?? "http://localhost:3001";

const nextConfig: NextConfig = {
  // Las pruebas de punta a punta compilan en otra carpeta para no pisar el servidor de desarrollo.
  distDir: process.env.CARPETA_DE_BUILD ?? ".next",
  // Evita que next dev agregue archivos de instrucciones al proyecto.
  agentRules: false,
  cacheComponents: true,
  partialPrefetching: true,
  experimental: {
    instantInsights: { validationLevel: "manual-warning" },
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  async rewrites() {
    return [{ source: "/api/:path*", destination: `${apiUrl}/api/:path*` }];
  },
};

export default nextConfig;
