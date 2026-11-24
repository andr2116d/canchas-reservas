import { afterEach, describe, expect, it, vi } from "vitest";
import { desactivarCancha, editarCancha, eliminarCancha, registrarCanchas } from "./canchas.api";
import type { DatosDeCancha } from "./canchas";

function responder(estado: number, cuerpo?: unknown) {
  const respuesta = new Response(cuerpo === undefined ? null : JSON.stringify(cuerpo), { status: estado });
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(respuesta));
}

const CANCHA: DatosDeCancha = { nombre: "Cancha 1", tipo: "FUTBOL_5", tieneIluminacion: true, caracteristicas: [] };
const RESERVA = { inicio: "2026-11-28T00:00:00.000Z", fin: "2026-11-28T01:00:00.000Z", titular: "R. Castillo" };

describe("canchas.api", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("registra varias canchas en una sola llamada y devuelve las creadas", async () => {
    responder(201, [{ id: 1, ...CANCHA }]);

    const resultado = await registrarCanchas([CANCHA]);

    expect(resultado).toEqual({ tipo: "creadas", canchas: [{ id: 1, ...CANCHA }] });
    expect(fetch).toHaveBeenCalledWith(
      "/api/canchas",
      expect.objectContaining({ method: "POST", body: JSON.stringify({ canchas: [CANCHA] }) }),
    );
  });

  it("devuelve los errores por campo con la posición de cada cancha", async () => {
    responder(409, { mensaje: "Hay nombres repetidos.", errores: { "canchas.0.nombre": "Ya existe." } });

    await expect(registrarCanchas([CANCHA])).resolves.toEqual({
      tipo: "datos-rechazados",
      errores: { "canchas.0.nombre": "Ya existe." },
    });
  });

  it("al desactivar con reservas por jugar devuelve el motivo y las reservas", async () => {
    responder(409, { mensaje: "No se puede desactivar.", errores: {}, datos: { reservas: [RESERVA] } });

    await expect(desactivarCancha(3)).resolves.toEqual({
      tipo: "bloqueada",
      mensaje: "No se puede desactivar.",
      reservas: [RESERVA],
    });
  });

  it("al editar devuelve la cancha guardada", async () => {
    responder(200, { id: 3, ...CANCHA });

    await expect(editarCancha(3, CANCHA)).resolves.toEqual({ tipo: "guardada", cancha: { id: 3, ...CANCHA } });
    expect(fetch).toHaveBeenCalledWith("/api/canchas/3", expect.objectContaining({ method: "PUT" }));
  });

  it("elimina con el método DELETE", async () => {
    responder(204);

    await expect(eliminarCancha(3)).resolves.toEqual({ tipo: "hecho" });
    expect(fetch).toHaveBeenCalledWith("/api/canchas/3", expect.objectContaining({ method: "DELETE" }));
  });
});
