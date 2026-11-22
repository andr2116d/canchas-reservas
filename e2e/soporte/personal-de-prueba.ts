import { execFileSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import { resolve } from "node:path";

export const DOMINIO_DE_PRUEBA = "empresa.test";
export const CONTRASENA_TEMPORAL = "temporal2026";

export function crearAdministradorDePrueba() {
  const correo = "admin." + randomUUID() + "@" + DOMINIO_DE_PRUEBA;
  const base = new URL(process.env.DATABASE_URL ?? "");
  const nombre = base.pathname.replace(/_pruebas$/, "");
  base.pathname = nombre + "_pruebas";
  execFileSync("npm", [
    "run", "personal:crear-administrador", "-w", "server", "--",
    correo, "Valeria", "León Paredes",
  ], {
    cwd: resolve(__dirname, "../.."),
    env: {
      ...process.env,
      DATABASE_URL: base.toString(),
      DOMINIO_CORPORATIVO: DOMINIO_DE_PRUEBA,
      CONTRASENA_TEMPORAL_ADMINISTRADOR: CONTRASENA_TEMPORAL,
    },
    stdio: "pipe",
  });
  return { correo, contrasena: CONTRASENA_TEMPORAL };
}
