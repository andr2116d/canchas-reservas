import { describe, expect, it } from "vitest";
import { leerHora, escribirHora, subir, bajar } from "./pasos-del-marcador";

describe("pasos del marcador", () => {
  it("lee y escribe la hora como HH:MM", () => {
    expect(leerHora("07:45")).toEqual({ horas: 7, minutos: 45 });
    expect(escribirHora(9, 5)).toBe("09:05");
  });

  it("las horas suben y bajan de una en una y dan la vuelta", () => {
    expect(subir(22, 1, 23)).toBe(23);
    expect(subir(23, 1, 23)).toBe(0);
    expect(bajar(0, 1, 23)).toBe(23);
  });

  it("los minutos van de cinco en cinco hasta el siguiente múltiplo", () => {
    expect(subir(0, 5, 59)).toBe(5);
    expect(subir(7, 5, 59)).toBe(10);
    expect(bajar(7, 5, 59)).toBe(5);
    expect(subir(55, 5, 59)).toBe(0);
    expect(bajar(0, 5, 59)).toBe(55);
  });
});
