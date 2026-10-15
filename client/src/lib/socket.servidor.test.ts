// @vitest-environment node
import { describe, expect, it, vi } from "vitest";

const io = vi.fn();
vi.mock("socket.io-client", () => ({ io }));

describe("obtenerSocket en el servidor", () => {
  it("no crea la conexion", async () => {
    const { obtenerSocket } = await import("./socket");

    expect(() => obtenerSocket()).toThrow("El socket solo se crea en el navegador");
    expect(io).not.toHaveBeenCalled();
  });
});
