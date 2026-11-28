import { describe, expect, it } from "vitest";
import { fechaEnLima, horaEnLima, sumarDias } from "./fecha-en-lima";

describe("fechaEnLima", () => {
  it("escribe la fecha y la hora del local", () => {
    expect(fechaEnLima("2026-11-23T01:30:00.000Z")).toBe("22 nov 2026, 20:30");
  });
});

describe("horaEnLima", () => {
  it("da la hora del local, sin importar el huso de quien mira", () => {
    expect(horaEnLima("2026-11-28T20:15:00.000Z")).toBe("15:15");
    expect(horaEnLima(new Date("2026-11-29T04:59:00.000Z"))).toBe("23:59");
  });
});

describe("sumarDias", () => {
  it("avanza y retrocede días, también entre meses y años", () => {
    expect(sumarDias("2026-11-28", 1)).toBe("2026-11-29");
    expect(sumarDias("2026-11-30", 1)).toBe("2026-12-01");
    expect(sumarDias("2027-01-01", -1)).toBe("2026-12-31");
    expect(sumarDias("2026-11-28", -29)).toBe("2026-10-30");
  });
});
