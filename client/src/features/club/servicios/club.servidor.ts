import type { ClubPublico } from "./club";

/** Lo que se muestra del club, pedido desde el server de Next. No necesita sesión. */
export async function consultarElClub(): Promise<ClubPublico> {
  const url = process.env.API_URL ?? "http://localhost:3001";
  const respuesta = await fetch(`${url}/api/club`, { cache: "no-store" });
  if (!respuesta.ok) throw new Error("No pudimos cargar la información del club.");
  return (await respuesta.json()) as ClubPublico;
}
