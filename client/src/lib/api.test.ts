import { afterEach, describe, expect, it, vi } from "vitest";
import { api, ErrorApi } from "./api";

function responder(status: number, cuerpo?: unknown) {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue(new Response(cuerpo === undefined ? null : JSON.stringify(cuerpo), { status })),
  );
}

afterEach(() => vi.unstubAllGlobals());

describe("api", () => {
  it("llama a /api con la cookie y devuelve el json", async () => {
    responder(200, { estado: "ok" });
    await expect(api("/salud")).resolves.toEqual({ estado: "ok" });
    expect(fetch).toHaveBeenCalledWith("/api/salud", expect.objectContaining({ credentials: "include" }));
  });

  it("envía el body como json", async () => {
    responder(201, { id: 1 });
    await api("/canchas", { method: "POST", body: { nombre: "Cancha 1" } });
    const [, opciones] = vi.mocked(fetch).mock.calls[0];
    expect(opciones?.body).toBe('{"nombre":"Cancha 1"}');
    expect(opciones?.headers).toEqual({ "Content-Type": "application/json" });
  });

  it("acepta respuestas sin cuerpo", async () => {
    responder(204);
    await expect(api("/sesion", { method: "DELETE" })).resolves.toBeUndefined();
  });

  it("lanza ErrorApi con los errores por campo", async () => {
    responder(400, { statusCode: 400, message: "El nombre es obligatorio", errores: { nombre: "El nombre es obligatorio" } });
    const error = await api("/canchas").catch((e) => e);
    expect(error).toBeInstanceOf(ErrorApi);
    expect(error).toMatchObject({ status: 400, message: "El nombre es obligatorio", errores: { nombre: "El nombre es obligatorio" } });
  });

  it("lanza ErrorApi con status 0 si no hay conexión", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("Failed to fetch")));
    await expect(api("/salud")).rejects.toMatchObject({ status: 0 });
  });
});
