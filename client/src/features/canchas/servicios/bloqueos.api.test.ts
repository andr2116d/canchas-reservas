import { afterEach, describe, expect, it, vi } from "vitest";
import { bloquearCanchas, liberarBloqueo, quitarBloqueo } from "./bloqueos.api";
import type { PedidoDeBloqueo } from "./bloqueos";

function responder(estado: number, cuerpo?: unknown) {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(cuerpo === undefined ? null : JSON.stringify(cuerpo), { status: estado })));
}

const PEDIDO: PedidoDeBloqueo = {
  canchaIds: [1],
  tipo: "PROGRAMADO",
  desdeAhora: false,
  desdeFecha: "2026-11-28",
  desdeHora: "08:00",
  hastaFecha: "2026-11-28",
  hastaHora: "14:00",
  motivo: "Fumigación.",
};
const RESERVA = { cancha: "Cancha 1", inicio: "2026-11-28T15:00:00.000Z", fin: "2026-11-28T16:00:00.000Z", titular: "M. Quispe" };

describe("bloqueos.api", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("devuelve los bloqueos creados y las reservas que quedaron afectadas", async () => {
    responder(201, { bloqueos: [{ id: 1 }], reservasAfectadas: [RESERVA] });

    await expect(bloquearCanchas(PEDIDO)).resolves.toEqual({ tipo: "creados", bloqueos: [{ id: 1 }], reservasAfectadas: [RESERVA] });
    expect(fetch).toHaveBeenCalledWith("/api/bloqueos", expect.objectContaining({ method: "POST" }));
  });

  it("distingue el choque con reservas del choque con otro bloqueo", async () => {
    responder(409, { mensaje: "Choca con reservas.", errores: {}, datos: { reservas: [RESERVA] } });
    await expect(bloquearCanchas(PEDIDO)).resolves.toEqual({ tipo: "choca-con-reservas", mensaje: "Choca con reservas.", reservas: [RESERVA] });

    responder(409, { mensaje: "Ya hay un bloqueo en ese rango.", errores: {}, datos: { bloqueos: [{ id: 4 }] } });
    await expect(bloquearCanchas(PEDIDO)).resolves.toEqual({ tipo: "choca-con-bloqueos", mensaje: "Ya hay un bloqueo en ese rango.", bloqueos: [{ id: 4 }] });
  });

  it("devuelve los errores por campo", async () => {
    responder(400, { mensaje: "Revisa los datos.", errores: { motivo: "Escribe el motivo del bloqueo." } });

    await expect(bloquearCanchas(PEDIDO)).resolves.toEqual({ tipo: "datos-rechazados", errores: { motivo: "Escribe el motivo del bloqueo." } });
  });

  it("libera con POST y quita con DELETE", async () => {
    responder(204);
    await expect(liberarBloqueo(3)).resolves.toEqual({ tipo: "hecho" });
    expect(fetch).toHaveBeenCalledWith("/api/bloqueos/3/liberacion", expect.objectContaining({ method: "POST" }));

    responder(409, { mensaje: "El bloqueo ya terminó.", errores: {} });
    await expect(quitarBloqueo(3)).resolves.toEqual({ tipo: "error", mensaje: "El bloqueo ya terminó." });
  });
});
