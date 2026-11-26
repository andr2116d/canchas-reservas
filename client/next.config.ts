import type { NextConfig } from "next";

const apiUrl = process.env.API_URL ?? "http://localhost:3001";
const enDesarrollo = process.env.NODE_ENV !== "production";

// Todo se sirve desde el mismo origen (fuentes locales, API por /api). Next inyecta scripts en
// línea para hidratar: un nonce obligaría a renderizar cada página en el server, así que se
// permite 'unsafe-inline'. En desarrollo, la recarga en caliente necesita eval y websockets.
const POLITICA_DE_CONTENIDO = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${enDesarrollo ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self'",
  `connect-src 'self'${enDesarrollo ? " ws:" : ""}`,
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join("; ");

const CABECERAS_DE_SEGURIDAD = [
  { key: "Content-Security-Policy", value: POLITICA_DE_CONTENIDO },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  ...(enDesarrollo ? [] : [{ key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" }]),
];

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
  async headers() {
    return [{ source: "/:path*", headers: CABECERAS_DE_SEGURIDAD }];
  },
  async rewrites() {
    return [{ source: "/api/:path*", destination: `${apiUrl}/api/:path*` }];
  },
};

export default nextConfig;
