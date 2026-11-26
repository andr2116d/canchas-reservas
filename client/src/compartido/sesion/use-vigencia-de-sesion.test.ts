import { cleanup, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useVigenciaDeSesion } from "./use-vigencia-de-sesion";

const AHORA_EN_EL_SERVER = new Date("2026-11-24T15:00:00.000Z");
const reemplazar = vi.fn();

function respuestaDeSesion(venceEn: Date, ahoraEnElServer = AHORA_EN_EL_SERVER) {
  return new Response(JSON.stringify({ rol: "ADMINISTRADOR", requiereCambiarContrasena: false, venceEn: venceEn.toISOString() }), {
    status: 200,
    headers: { date: ahoraEnElServer.toUTCString() },
  });
}

describe("useVigenciaDeSesion", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(AHORA_EN_EL_SERVER);
    Object.defineProperty(window, "location", { configurable: true, value: { replace: reemplazar } });
    reemplazar.mockReset();
  });
  afterEach(() => {
    cleanup();
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("cuando vence sin actividad, lleva al acceso explicando el motivo", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("{}", { status: 401 })));
    renderHook(() => useVigenciaDeSesion("2026-11-24T15:15:00.000Z"));

    await vi.advanceTimersByTimeAsync(15 * 60 * 1000);

    expect(reemplazar).toHaveBeenCalledWith("/iniciar-sesion?motivo=inactividad");
  });

  it("con el reloj del dispositivo adelantado no consulta sin parar", async () => {
    vi.setSystemTime(new Date(AHORA_EN_EL_SERVER.getTime() + 60 * 60 * 1000));
    const pedir = vi.fn().mockImplementation(() =>
      Promise.resolve(respuestaDeSesion(new Date(AHORA_EN_EL_SERVER.getTime() + 10 * 60 * 1000))),
    );
    vi.stubGlobal("fetch", pedir);
    renderHook(() => useVigenciaDeSesion("2026-11-24T15:10:00.000Z"));

    await vi.advanceTimersByTimeAsync(30_000);

    expect(pedir.mock.calls.length).toBeLessThanOrEqual(1);
    expect(reemplazar).not.toHaveBeenCalled();
  });

  it("si la sesión sigue vigente vuelve a revisar cuando venza según el reloj del server", async () => {
    const pedir = vi
      .fn()
      .mockResolvedValueOnce(respuestaDeSesion(new Date(AHORA_EN_EL_SERVER.getTime() + 20 * 60 * 1000)))
      .mockResolvedValue(new Response("{}", { status: 401 }));
    vi.stubGlobal("fetch", pedir);
    renderHook(() => useVigenciaDeSesion("2026-11-24T15:00:00.000Z"));

    await vi.advanceTimersByTimeAsync(10);
    expect(pedir).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(19 * 60 * 1000);
    expect(pedir).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(2 * 60 * 1000);

    expect(pedir).toHaveBeenCalledTimes(2);
    expect(reemplazar).toHaveBeenCalledWith("/iniciar-sesion?motivo=inactividad");
  });

  it("sin conexión reintenta más tarde en vez de cerrar la sesión", async () => {
    const pedir = vi.fn().mockRejectedValue(new TypeError("Failed to fetch"));
    vi.stubGlobal("fetch", pedir);
    renderHook(() => useVigenciaDeSesion("2026-11-24T15:00:00.000Z"));

    await vi.advanceTimersByTimeAsync(10_500);

    expect(pedir).toHaveBeenCalledTimes(2);
    expect(reemplazar).not.toHaveBeenCalled();
  });

  it("si se cerró la sesión en otra pestaña, esta también sale", () => {
    vi.stubGlobal("fetch", vi.fn());
    renderHook(() => useVigenciaDeSesion("2026-11-24T15:15:00.000Z"));

    window.dispatchEvent(new StorageEvent("storage", { key: "la-previa:salida", newValue: "1" }));

    expect(reemplazar).toHaveBeenCalledWith("/iniciar-sesion");
  });
});
