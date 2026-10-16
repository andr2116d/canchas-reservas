import { afterEach, describe, expect, it, vi } from "vitest";

const io = vi.fn(() => ({ id: Symbol("socket") }));
vi.mock("socket.io-client", () => ({ io }));

afterEach(() => {
  delete (globalThis as { __socketLaPrevia?: unknown }).__socketLaPrevia;
  io.mockClear();
  vi.resetModules();
});

describe("obtenerSocket", () => {
  it("devuelve siempre la misma instancia", async () => {
    const { obtenerSocket } = await import("./socket");

    const primero = obtenerSocket();
    const segundo = obtenerSocket();

    expect(segundo).toBe(primero);
    expect(io).toHaveBeenCalledTimes(1);
  });

  it("reutiliza la conexion aunque el modulo se vuelva a cargar", async () => {
    const primero = (await import("./socket")).obtenerSocket();
    vi.resetModules();
    const segundo = (await import("./socket")).obtenerSocket();

    expect(segundo).toBe(primero);
    expect(io).toHaveBeenCalledTimes(1);
  });

  it("se conecta con credenciales", async () => {
    const { obtenerSocket } = await import("./socket");

    obtenerSocket();

    expect(io).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ withCredentials: true }),
    );
  });
});
