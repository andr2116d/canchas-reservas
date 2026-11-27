import { describe, expect, it } from "vitest";
import { conElTurno, destinoConTurno, leerTurnoElegido } from "./turno-elegido";

const TURNO = { canchaId: 3, fecha: "2026-11-28", desde: "19:00" };

describe("Turno elegido en la dirección", () => {
  it("lee la cancha, la fecha y la hora", () => {
    const parametros = new URLSearchParams("cancha=3&fecha=2026-11-28&desde=19%3A00");

    expect(leerTurnoElegido(parametros)).toEqual(TURNO);
  });

  it.each([
    ["sin cancha", "fecha=2026-11-28&desde=19:00"],
    ["cancha con letras", "cancha=3a&fecha=2026-11-28&desde=19:00"],
    ["cancha cero", "cancha=0&fecha=2026-11-28&desde=19:00"],
    ["cancha enorme", "cancha=99999999999&fecha=2026-11-28&desde=19:00"],
    ["fecha con otro formato", "cancha=3&fecha=28/11/2026&desde=19:00"],
    ["hora con otro formato", "cancha=3&fecha=2026-11-28&desde=7pm"],
  ])("ignora un turno %s", (_, texto) => {
    expect(leerTurnoElegido(new URLSearchParams(texto))).toBeUndefined();
  });

  it("agrega el turno a una ruta para no perderlo al ingresar o crear la cuenta", () => {
    expect(conElTurno("/iniciar-sesion", TURNO)).toBe("/iniciar-sesion?cancha=3&fecha=2026-11-28&desde=19%3A00");
    expect(conElTurno("/iniciar-sesion")).toBe("/iniciar-sesion");
  });

  it("tras ingresar, el jugador con un turno elegido vuelve a confirmarlo; el personal va a su panel", () => {
    expect(destinoConTurno("/inicio", TURNO)).toBe("/inicio/reservar/confirmar?cancha=3&fecha=2026-11-28&desde=19%3A00");
    expect(destinoConTurno("/inicio")).toBe("/inicio");
    expect(destinoConTurno("/administracion", TURNO)).toBe("/administracion");
    expect(destinoConTurno("/cambiar-contrasena", TURNO)).toBe("/cambiar-contrasena");
  });
});
