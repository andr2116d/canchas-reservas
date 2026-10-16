import { afterEach, describe, expect, it, vi } from "vitest";
import { ErrorApi } from "@/lib/api";
import { crearReserva, obtenerMisReservas, obtenerResumenReserva } from "./api";

function responder(status: number, cuerpo?: unknown) {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue(new Response(cuerpo === undefined ? null : JSON.stringify(cuerpo), { status })),
  );
}

const TURNO = { canchaId: 2, fecha: "2026-10-20", horaInicio: "18:00" };

afterEach(() => vi.unstubAllGlobals());

describe("api de reservas", () => {
  it("el resumen arma la query con canchaId, fecha y horaInicio", async () => {
    responder(200, { valorTurno: 60 });
    await expect(obtenerResumenReserva(TURNO)).resolves.toEqual({ valorTurno: 60 });

    const [url, opciones] = vi.mocked(fetch).mock.calls[0];
    const [ruta, query] = String(url).split("?");
    expect(ruta).toBe("/api/reservas/resumen");
    expect(Object.fromEntries(new URLSearchParams(query))).toEqual({
      canchaId: "2",
      fecha: "2026-10-20",
      horaInicio: "18:00",
    });
    expect(opciones?.method).toBeUndefined();
  });

  it.each([true, false])("crear manda el turno y usarCredito=%s por POST", async (usarCredito) => {
    const creada = { id: 1, codigo: "LP7K2M9Q", estado: "PENDIENTE_PAGO", venceEn: null };
    responder(201, creada);
    await expect(crearReserva({ ...TURNO, usarCredito })).resolves.toEqual(creada);

    const [url, opciones] = vi.mocked(fetch).mock.calls[0];
    expect(url).toBe("/api/reservas");
    expect(opciones?.method).toBe("POST");
    expect(JSON.parse(String(opciones?.body))).toEqual({ ...TURNO, usarCredito });
  });

  it("mis reservas usa su ruta", async () => {
    responder(200, []);
    await expect(obtenerMisReservas()).resolves.toEqual([]);
    expect(fetch).toHaveBeenCalledWith("/api/reservas/mias", expect.objectContaining({ credentials: "include" }));
  });
});
