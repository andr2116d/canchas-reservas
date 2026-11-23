import { afterEach, describe, expect, it, vi } from "vitest";
import { obtenerCuenta } from "./cuenta.servidor";

// Fuera de una petición de Next no hay cabeceras entrantes: la consulta no reenvía ninguna IP.
vi.mock("next/headers", () => ({ headers: async () => new Headers(), cookies: async () => new Headers() }));

describe("obtenerCuenta", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it("consulta la API con las cookies de la persona y devuelve su cuenta", async () => {
    vi.stubEnv("API_URL", "http://api.interna:3001");
    const consulta = vi
      .fn()
      .mockResolvedValue(new Response(JSON.stringify({ nombres: "Valeria" }), { status: 200 }));
    vi.stubGlobal("fetch", consulta);

    const cuenta = await obtenerCuenta("sesion=token-1");

    expect(cuenta).toEqual({ nombres: "Valeria" });
    expect(consulta).toHaveBeenCalledWith("http://api.interna:3001/api/cuenta", {
      headers: { cookie: "sesion=token-1" },
      cache: "no-store",
    });
  });

  it("no devuelve nada si no hay cookies", async () => {
    const consulta = vi.fn();
    vi.stubGlobal("fetch", consulta);

    await expect(obtenerCuenta("")).resolves.toBeUndefined();
    expect(consulta).not.toHaveBeenCalled();
  });

  it("no devuelve nada si la sesión no es válida", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("{}", { status: 401 })));

    await expect(obtenerCuenta("sesion=vencida")).resolves.toBeUndefined();
  });
});
