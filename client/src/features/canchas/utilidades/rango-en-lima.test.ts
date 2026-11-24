import { describe, expect, it } from "vitest";
import { describirRango, partesEnLima } from "./rango-en-lima";

describe("rango en Lima", () => {
  it("separa la fecha y la hora de Lima de un instante", () => {
    expect(partesEnLima(new Date("2026-11-29T03:05:00.000Z"))).toEqual({ fecha: "2026-11-28", hora: "22:05" });
  });

  it("describe un rango del mismo día y uno que cruza días", () => {
    expect(describirRango("2026-11-28T13:00:00.000Z", "2026-11-28T19:00:00.000Z")).toBe("sáb 28 nov, 08:00 – 14:00");
    expect(describirRango("2026-11-28T13:00:00.000Z", "2026-11-30T05:00:00.000Z")).toBe("sáb 28 nov, 08:00 → lun 30 nov, 00:00");
  });
});
