import { describe, expect, it } from "vitest";
import { soloDigitos } from "./solo-digitos";

describe("soloDigitos", () => {
  it.each([
    ["45678912", "45678912"],
    ["4567891A", "4567891"],
    ["+51 987-654-321", "51987654321"],
    ["ABC", ""],
    ["", ""],
  ])('"%s" queda como "%s"', (entrada, salida) => {
    expect(soloDigitos(entrada)).toBe(salida);
  });
});
