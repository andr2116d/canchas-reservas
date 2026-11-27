import { afterEach, describe, expect, it, vi } from "vitest";
import { consultarResumen, separarTurno } from "./reservas.api";

const responder = (estado: number, cuerpo: unknown) =>
  vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(JSON.stringify(cuerpo), { status: estado }));
const TURNO = { canchaId: 3, fecha: "2026-11-28", desde: "19:00" };
const PEDIDO = { ...TURNO, precio: "80.00", adelanto: "40.00", adicionales: [] };

describe("consultarResumen", () => {
  afterEach(() => vi.restoreAllMocks());

  it("pide el resumen del turno elegido", async () => {
    const fetch = responder(200, { precio: "80.00" });

    const resultado = await consultarResumen(TURNO);

    expect(fetch.mock.calls[0][0]).toBe("/api/reservas/resumen?canchaId=3&fecha=2026-11-28&desde=19%3A00");
    expect(resultado).toEqual({ tipo: "consultado", resumen: { precio: "80.00" } });
  });

  it("dice por qué el turno no se puede reservar", async () => {
    responder(409, { mensaje: "Este turno ya no está libre. Elige otro.", errores: {} });

    await expect(consultarResumen(TURNO)).resolves.toEqual({ tipo: "no-disponible", mensaje: "Este turno ya no está libre. Elige otro." });
  });

  it("una fecha fuera de rango también se explica", async () => {
    responder(400, { mensaje: "Revisa los datos.", errores: { fecha: "Solo se pueden consultar los próximos 30 días." } });

    await expect(consultarResumen(TURNO)).resolves.toEqual({ tipo: "no-disponible", mensaje: "Solo se pueden consultar los próximos 30 días." });
  });

  it("sin sesión pide ingresar otra vez", async () => {
    responder(401, { mensaje: "Inicia sesión." });

    await expect(consultarResumen(TURNO)).resolves.toEqual({ tipo: "sin-sesion" });
  });
});

describe("separarTurno", () => {
  afterEach(() => vi.restoreAllMocks());

  it("envía el turno y los montos vistos y devuelve el código", async () => {
    const fetch = responder(201, { codigo: "7K3Q9X", estado: "PENDIENTE_DE_PAGO" });

    const resultado = await separarTurno(PEDIDO);

    expect(JSON.parse(String(fetch.mock.calls[0][1]?.body))).toEqual(PEDIDO);
    expect(resultado).toEqual({ tipo: "separada", codigo: "7K3Q9X" });
  });

  it("si el precio cambió trae los montos nuevos", async () => {
    responder(409, { mensaje: "El precio de este turno cambió.", errores: {}, datos: { precio: "90.00", adelanto: "45.00" } });

    await expect(separarTurno(PEDIDO)).resolves.toEqual({
      tipo: "montos-cambiaron",
      mensaje: "El precio de este turno cambió.",
      precio: "90.00",
      adelanto: "45.00",
    });
  });

  it("cualquier otro rechazo trae su mensaje", async () => {
    responder(409, { mensaje: "Este turno ya no está libre. Elige otro.", errores: {} });

    await expect(separarTurno(PEDIDO)).resolves.toEqual({ tipo: "rechazada", mensaje: "Este turno ya no está libre. Elige otro." });
  });

  it("sin conexión lo dice", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new TypeError("Failed to fetch"));

    await expect(separarTurno(PEDIDO)).resolves.toMatchObject({ tipo: "rechazada", mensaje: expect.stringContaining("conexión") });
  });
});
