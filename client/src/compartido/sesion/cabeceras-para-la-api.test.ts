import { describe, expect, it } from "vitest";
import { cabecerasParaLaApi } from "./cabeceras-para-la-api";

describe("cabecerasParaLaApi", () => {
  it("envía la cookie de la sesión", () => {
    expect(cabecerasParaLaApi("sesion=abc")).toEqual({ cookie: "sesion=abc" });
  });

  it("reenvía la IP de quien visita la página para que la API cuente sus límites por persona", () => {
    expect(cabecerasParaLaApi("sesion=abc", "190.42.10.5")).toEqual({
      cookie: "sesion=abc",
      "x-forwarded-for": "190.42.10.5",
    });
  });
});
