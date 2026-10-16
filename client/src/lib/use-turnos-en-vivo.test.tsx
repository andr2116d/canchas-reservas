import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useTurnosEnVivo } from "./use-turnos-en-vivo";


const socket = vi.hoisted(() => {
  const listeners = new Map<string, Set<(payload?: unknown) => void>>();
  return {
    listeners,
    on: vi.fn((evento: string, cb: (payload?: unknown) => void) => {
      if (!listeners.has(evento)) listeners.set(evento, new Set());
      listeners.get(evento)!.add(cb);
    }),
    off: vi.fn((evento: string, cb: (payload?: unknown) => void) => {
      listeners.get(evento)?.delete(cb);
    }),
    emitir(evento: string, payload?: unknown) {
      listeners.get(evento)?.forEach((cb) => cb(payload));
    },
    cantidad(evento: string) {
      return listeners.get(evento)?.size ?? 0;
    },
  };
});

vi.mock("./socket", () => ({ obtenerSocket: () => socket }));

const FECHA = "2026-10-20";

function montar(fechaInicial = FECHA) {
  const cliente = new QueryClient();
  const invalidar = vi.spyOn(cliente, "invalidateQueries").mockResolvedValue();
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={cliente}>{children}</QueryClientProvider>
  );
  const hook = renderHook(
    ({ fecha }: { fecha: string }) =>
      useTurnosEnVivo(fecha, [["disponibilidad", fecha], ["agenda", fecha]]),
    { wrapper, initialProps: { fecha: fechaInicial } },
  );
  return { ...hook, invalidar };
}

beforeEach(() => {
  socket.listeners.clear();
  socket.on.mockClear();
  socket.off.mockClear();
});

describe("useTurnosEnVivo", () => {
  it("invalida todas las claves cuando el evento es de la misma fecha", () => {
    const { invalidar } = montar();

    socket.emitir("turnos:actualizados", { fecha: FECHA, canchaId: 2 });

    expect(invalidar).toHaveBeenCalledTimes(2);
    expect(invalidar).toHaveBeenCalledWith({ queryKey: ["disponibilidad", FECHA] });
    expect(invalidar).toHaveBeenCalledWith({ queryKey: ["agenda", FECHA] });
  });

  it("invalida cuando la fecha del evento es null", () => {
    const { invalidar } = montar();

    socket.emitir("turnos:actualizados", { fecha: null, canchaId: null });

    expect(invalidar).toHaveBeenCalledTimes(2);
  });

  it("no invalida cuando el evento es de otra fecha", () => {
    const { invalidar } = montar();

    socket.emitir("turnos:actualizados", { fecha: "2026-10-21", canchaId: 2 });

    expect(invalidar).not.toHaveBeenCalled();
  });

  it.each<[string, unknown]>([
    ["sin payload", undefined],
    ["un texto", FECHA],
    ["un objeto vacio", {}],
    ["sin canchaId", { fecha: FECHA }],
    ["una fecha numerica", { fecha: 20261020, canchaId: 2 }],
    ["un canchaId de texto", { fecha: FECHA, canchaId: "2" }],
  ])("no invalida con un payload invalido: %s", (_, payload) => {
    const { invalidar } = montar();

    socket.emitir("turnos:actualizados", payload);

    expect(invalidar).not.toHaveBeenCalled();
  });

  it("invalida al reconectar despues de una desconexion", () => {
    const { invalidar } = montar();

    socket.emitir("disconnect");
    expect(invalidar).not.toHaveBeenCalled();
    socket.emitir("connect");

    expect(invalidar).toHaveBeenCalledTimes(2);
    expect(invalidar).toHaveBeenCalledWith({ queryKey: ["disponibilidad", FECHA] });
  });

  it("no invalida en la primera conexion", () => {
    const { invalidar } = montar();

    socket.emitir("connect");

    expect(invalidar).not.toHaveBeenCalled();
  });

  it("quita los listeners al desmontar", () => {
    const { unmount } = montar();
    for (const evento of ["turnos:actualizados", "connect", "disconnect"]) {
      expect(socket.cantidad(evento)).toBe(1);
    }

    unmount();

    for (const evento of ["turnos:actualizados", "connect", "disconnect"]) {
      expect(socket.cantidad(evento)).toBe(0);
    }
  });

  it("al cambiar de fecha deja un solo listener y escucha la fecha nueva", () => {
    const { rerender, invalidar } = montar();

    rerender({ fecha: "2026-10-21" });

    for (const evento of ["turnos:actualizados", "connect", "disconnect"]) {
      expect(socket.cantidad(evento)).toBe(1);
    }
    socket.emitir("turnos:actualizados", { fecha: FECHA, canchaId: 2 });
    expect(invalidar).not.toHaveBeenCalled();
    socket.emitir("turnos:actualizados", { fecha: "2026-10-21", canchaId: 2 });
    expect(invalidar).toHaveBeenCalledWith({ queryKey: ["disponibilidad", "2026-10-21"] });
  });

  it("no vuelve a suscribirse en cada render aunque las claves sean un arreglo nuevo", () => {
    const { rerender } = montar();
    const suscripciones = socket.on.mock.calls.length;

    rerender({ fecha: FECHA });

    expect(socket.on.mock.calls.length).toBe(suscripciones);
  });

  describe("con varias fechas", () => {
    function montarVarias(fechas: string[]) {
      const cliente = new QueryClient();
      const invalidar = vi.spyOn(cliente, "invalidateQueries").mockResolvedValue();
      const wrapper = ({ children }: { children: ReactNode }) => (
        <QueryClientProvider client={cliente}>{children}</QueryClientProvider>
      );
      const hook = renderHook(({ lista }: { lista: string[] }) => useTurnosEnVivo(lista, [["mis-reservas"]]), {
        wrapper,
        initialProps: { lista: fechas },
      });
      return { ...hook, invalidar };
    }

    it("invalida cuando el evento es de cualquiera de las fechas", () => {
      const { invalidar } = montarVarias([FECHA, "2026-10-25", FECHA]);

      socket.emitir("turnos:actualizados", { fecha: "2026-10-25", canchaId: 1 });
      socket.emitir("turnos:actualizados", { fecha: "2026-10-22", canchaId: 1 });

      expect(invalidar).toHaveBeenCalledTimes(1);
      expect(invalidar).toHaveBeenCalledWith({ queryKey: ["mis-reservas"] });
    });

    it("sin fechas no se suscribe", () => {
      montarVarias([]);

      expect(socket.cantidad("turnos:actualizados")).toBe(0);
    });

    it("no vuelve a suscribirse si llegan las mismas fechas en otro orden", () => {
      const { rerender } = montarVarias([FECHA, "2026-10-25"]);
      const suscripciones = socket.on.mock.calls.length;

      rerender({ lista: ["2026-10-25", FECHA] });

      expect(socket.on.mock.calls.length).toBe(suscripciones);
    });
  });
});

