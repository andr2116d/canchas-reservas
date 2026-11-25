import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { mapaDePrueba } from "../../../../test/features/disponibilidad/mapa-de-prueba";
import { escucharCambios } from "../servicios/avisos-de-cambios";
import { consultarMapa } from "../servicios/disponibilidad.api";
import { useMapaDelDia } from "./use-mapa-del-dia";

vi.mock("../servicios/disponibilidad.api", () => ({ consultarMapa: vi.fn() }));
vi.mock("../servicios/avisos-de-cambios", () => ({ escucharCambios: vi.fn() }));

/** Lo que el hook pasó a la escucha, para simular avisos del server. */
function escucha() {
  return vi.mocked(escucharCambios).mock.lastCall![0];
}

describe("useMapaDelDia", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(escucharCambios).mockReturnValue(() => undefined);
    vi.mocked(consultarMapa).mockImplementation((fecha) => Promise.resolve({ tipo: "consultado", mapa: mapaDePrueba({ fecha: fecha ?? "2026-11-24" }) }));
  });
  afterEach(() => vi.useRealTimers());

  it("sin fecha elegida muestra el mapa de hoy que dice el server", async () => {
    const { result } = renderHook(() => useMapaDelDia());

    await waitFor(() => expect(result.current.mapa?.fecha).toBe("2026-11-24"));
    expect(consultarMapa).toHaveBeenCalledWith(undefined, expect.any(AbortSignal));
  });

  it("al elegir otra fecha conserva el mapa anterior mientras llega el nuevo", async () => {
    const { result } = renderHook(() => useMapaDelDia());
    await waitFor(() => expect(result.current.mapa).toBeDefined());
    let responder: (valor: Awaited<ReturnType<typeof consultarMapa>>) => void = () => undefined;
    vi.mocked(consultarMapa).mockReturnValueOnce(new Promise((r) => (responder = r)));

    act(() => result.current.elegirFecha("2026-11-26"));

    expect(result.current).toMatchObject({ cargando: true, mapa: { fecha: "2026-11-24" } });
    await act(async () => responder({ tipo: "consultado", mapa: mapaDePrueba({ fecha: "2026-11-26" }) }));
    expect(result.current).toMatchObject({ cargando: false, mapa: { fecha: "2026-11-26" } });
  });

  it("vuelve a pedir la fecha que se mira cuando el server avisa un cambio", async () => {
    const { result } = renderHook(() => useMapaDelDia());
    await waitFor(() => expect(result.current.mapa).toBeDefined());
    act(() => result.current.elegirFecha("2026-11-26"));
    await waitFor(() => expect(result.current.mapa?.fecha).toBe("2026-11-26"));
    vi.mocked(consultarMapa).mockClear();

    await act(async () => escucha().alCambiar());

    await waitFor(() => expect(consultarMapa).toHaveBeenCalledWith("2026-11-26", expect.any(AbortSignal)));
  });

  it("muchos avisos seguidos producen una consulta por segundo como máximo", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const { result } = renderHook(() => useMapaDelDia());
    await waitFor(() => expect(result.current.mapa).toBeDefined());
    vi.mocked(consultarMapa).mockClear();

    await act(async () => {
      for (let i = 0; i < 5; i++) escucha().alCambiar();
      await vi.advanceTimersByTimeAsync(1100);
    });

    expect(vi.mocked(consultarMapa).mock.calls.length).toBeLessThanOrEqual(2);
  });

  it("vuelve a pedir el mapa cuando algo cambia solo por la hora, medido con el reloj del server", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    vi.mocked(consultarMapa).mockResolvedValueOnce({
      tipo: "consultado",
      mapa: mapaDePrueba({ ahora: "2026-11-24T20:59:50.000Z", proximoCambio: "2026-11-24T21:00:00.000Z" }),
    });
    renderHook(() => useMapaDelDia());
    await waitFor(() => expect(consultarMapa).toHaveBeenCalledTimes(1));

    await act(() => vi.advanceTimersByTimeAsync(9_000));
    expect(consultarMapa).toHaveBeenCalledTimes(1);
    await act(() => vi.advanceTimersByTimeAsync(2_000));
    expect(consultarMapa).toHaveBeenCalledTimes(2);
  });

  it("si la consulta falla, conserva el último mapa y dice qué pasó", async () => {
    const { result } = renderHook(() => useMapaDelDia());
    await waitFor(() => expect(result.current.mapa).toBeDefined());
    vi.mocked(consultarMapa).mockResolvedValueOnce({ tipo: "error", mensaje: "Elige una fecha desde hoy." });

    act(() => result.current.elegirFecha("2026-11-20"));

    await waitFor(() => expect(result.current.error).toBe("Elige una fecha desde hoy."));
    expect(result.current.mapa?.fecha).toBe("2026-11-24");
  });

  it("informa si se perdió la conexión en vivo y deja de escuchar al salir", async () => {
    const dejarDeEscuchar = vi.fn();
    vi.mocked(escucharCambios).mockReturnValue(dejarDeEscuchar);
    const { result, unmount } = renderHook(() => useMapaDelDia());
    await waitFor(() => expect(result.current.mapa).toBeDefined());

    act(() => escucha().alCambiarConexion("reconectando"));
    expect(result.current.conexion).toBe("reconectando");
    unmount();
    expect(dejarDeEscuchar).toHaveBeenCalled();
  });
});
