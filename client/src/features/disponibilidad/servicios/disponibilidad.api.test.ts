import { afterEach, describe, expect, it, vi } from "vitest";
import { consultarMapa } from "./disponibilidad.api";

const responder = (estado: number, cuerpo: unknown) =>
  vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(JSON.stringify(cuerpo), { status: estado }));

describe("consultarMapa", () => {
  afterEach(() => vi.restoreAllMocks());

  it("pide la fecha elegida o, sin fecha, la de hoy", async () => {
    const fetch = responder(200, { fecha: "2026-11-25" });

    await consultarMapa("2026-11-25");
    await consultarMapa();

    expect(fetch.mock.calls.map(([ruta]) => ruta)).toEqual(["/api/disponibilidad?fecha=2026-11-25", "/api/disponibilidad"]);
  });

  it("devuelve el mapa consultado", async () => {
    responder(200, { fecha: "2026-11-25" });

    await expect(consultarMapa("2026-11-25")).resolves.toEqual({ tipo: "consultado", mapa: { fecha: "2026-11-25" } });
  });

  it("explica por qué no se puede consultar una fecha", async () => {
    responder(400, { mensaje: "Revisa los datos.", errores: { fecha: "Solo se pueden consultar los próximos 30 días." } });

    await expect(consultarMapa("2027-01-30")).resolves.toEqual({ tipo: "error", mensaje: "Solo se pueden consultar los próximos 30 días." });
  });

  it("avisa si no hay conexión", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new TypeError("Failed to fetch"));

    const resultado = await consultarMapa();

    expect(resultado).toMatchObject({ tipo: "error", mensaje: expect.stringContaining("Revisa tu conexión") });
  });
});
