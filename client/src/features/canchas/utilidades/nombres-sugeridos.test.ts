import { describe, expect, it } from "vitest";
import { nombresSugeridos } from "./nombres-sugeridos";

describe("nombresSugeridos", () => {
  it("empieza en Cancha 1 si no hay canchas", () => {
    expect(nombresSugeridos([], 3)).toEqual(["Cancha 1", "Cancha 2", "Cancha 3"]);
  });

  it("salta los números que ya se usan, sin importar mayúsculas ni tildes", () => {
    expect(nombresSugeridos(["Cancha 1", "CANCHA 3", "La Grande"], 2)).toEqual(["Cancha 2", "Cancha 4"]);
  });
});
