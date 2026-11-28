import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { agendaDePrueba } from "../../../../test/features/agenda/agenda-de-prueba";
import { escucharCambios } from "@/compartido/disponibilidad/avisos-de-cambios";
import { consultarAgenda } from "../servicios/agenda.api";
import type { FiltrosDeLaAgenda } from "../utilidades/filtros";
import { useAgendaDelDia } from "./use-agenda-del-dia";

vi.mock("../servicios/agenda.api", () => ({ consultarAgenda: vi.fn() }));
vi.mock("@/compartido/disponibilidad/avisos-de-cambios", () => ({ escucharCambios: vi.fn() }));

describe("useAgendaDelDia", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(escucharCambios).mockReturnValue(() => undefined);
    vi.mocked(consultarAgenda).mockImplementation((filtros) => Promise.resolve({ tipo: "consultado", valor: agendaDePrueba({ fecha: filtros.fecha ?? "2026-11-28" }) }));
  });

  it("pide la agenda con los filtros de la dirección", async () => {
    const { result } = renderHook(() => useAgendaDelDia({ fecha: "2026-11-30", estado: "CONFIRMADA" }));

    await waitFor(() => expect(result.current.agenda?.fecha).toBe("2026-11-30"));
    expect(consultarAgenda).toHaveBeenCalledWith({ fecha: "2026-11-30", estado: "CONFIRMADA" }, expect.any(AbortSignal));
  });

  it("al cambiar los filtros vuelve a pedir, conservando la agenda anterior mientras llega", async () => {
    const { result, rerender } = renderHook((filtros: FiltrosDeLaAgenda) => useAgendaDelDia(filtros), { initialProps: {} });
    await waitFor(() => expect(result.current.agenda).toBeDefined());
    vi.mocked(consultarAgenda).mockReturnValueOnce(new Promise(() => undefined));

    rerender({ canchaId: "2" });

    await waitFor(() => expect(consultarAgenda).toHaveBeenLastCalledWith({ canchaId: "2" }, expect.any(AbortSignal)));
    expect(result.current).toMatchObject({ cargando: true, agenda: { fecha: "2026-11-28" } });
  });

  it("los mismos filtros en otro objeto no repiten la consulta", async () => {
    const { result, rerender } = renderHook((filtros: FiltrosDeLaAgenda) => useAgendaDelDia(filtros), { initialProps: { fecha: "2026-11-30" } });
    await waitFor(() => expect(result.current.agenda).toBeDefined());
    vi.mocked(consultarAgenda).mockClear();

    rerender({ fecha: "2026-11-30" });

    expect(consultarAgenda).not.toHaveBeenCalled();
  });

  it("vuelve a pedir cuando el server avisa que algo cambió", async () => {
    const { result } = renderHook(() => useAgendaDelDia({ fecha: "2026-11-30" }));
    await waitFor(() => expect(result.current.agenda).toBeDefined());
    vi.mocked(consultarAgenda).mockClear();

    await act(async () => vi.mocked(escucharCambios).mock.lastCall![0].alCambiar());

    await waitFor(() => expect(consultarAgenda).toHaveBeenCalledWith({ fecha: "2026-11-30" }, expect.any(AbortSignal)));
  });

  it("si la consulta falla, dice por qué", async () => {
    vi.mocked(consultarAgenda).mockResolvedValue({ tipo: "error", mensaje: "Elige una cancha de la lista." });

    const { result } = renderHook(() => useAgendaDelDia({ canchaId: "9" }));

    await waitFor(() => expect(result.current.error).toBe("Elige una cancha de la lista."));
  });
});
