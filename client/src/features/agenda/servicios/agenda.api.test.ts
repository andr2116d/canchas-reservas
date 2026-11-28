import { afterEach, describe, expect, it, vi } from "vitest";
import { consultarAgenda } from "./agenda.api";

const responder = (estado: number, cuerpo: unknown) =>
  vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(JSON.stringify(cuerpo), { status: estado }));

describe("consultarAgenda", () => {
  afterEach(() => vi.restoreAllMocks());

  it("pide la agenda con los filtros elegidos o, sin filtros, la de hoy", async () => {
    const fetch = responder(200, { fecha: "2026-11-28" });

    await consultarAgenda({ fecha: "2026-11-28", canchaId: "2", estado: "CONFIRMADA" });
    await consultarAgenda({});

    expect(fetch.mock.calls.map(([ruta]) => ruta)).toEqual(["/api/agenda?fecha=2026-11-28&canchaId=2&estado=CONFIRMADA", "/api/agenda"]);
  });

  it("devuelve la agenda consultada", async () => {
    responder(200, { fecha: "2026-11-28" });

    await expect(consultarAgenda({})).resolves.toEqual({ tipo: "consultado", valor: { fecha: "2026-11-28" } });
  });

  it("explica qué filtro no sirve", async () => {
    responder(400, { mensaje: "Revisa los datos marcados.", errores: { canchaId: "Elige una cancha de la lista." } });

    await expect(consultarAgenda({ canchaId: "9" })).resolves.toEqual({ tipo: "error", mensaje: "Elige una cancha de la lista." });
  });

  it("con la sesión vencida dice lo que responde el server", async () => {
    responder(401, { mensaje: "Inicia sesión para continuar." });

    await expect(consultarAgenda({})).resolves.toEqual({ tipo: "error", mensaje: "Inicia sesión para continuar." });
  });

  it("avisa si no hay conexión", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new TypeError("Failed to fetch"));

    const resultado = await consultarAgenda({});

    expect(resultado).toMatchObject({ tipo: "error", mensaje: expect.stringContaining("Revisa tu conexión") });
  });
});
