import { describe, expect, it } from "vitest";
import { describirTiempoRestante } from "./tiempo-restante";

const AHORA = new Date("2026-11-22T15:00:00.000Z");
const dentroDe = (horas: number) => new Date(AHORA.getTime() + horas * 60 * 60 * 1000).toISOString();

describe("describirTiempoRestante", () => {
  it.each([
    [7 * 24, "7 días"],
    [7 * 24 - 0.01, "7 días"],
    [24 + 5, "1 día"],
    [5.5, "5 horas"],
    [1.2, "1 hora"],
    [0.5, "menos de una hora"],
  ])("a %s horas del vencimiento dice «%s»", (horas, texto) => {
    expect(describirTiempoRestante(dentroDe(horas), AHORA)).toBe(texto);
  });
});
