import { describe, expect, it } from "vitest";
import { filtrarCarneExtranjeria, filtrarCelular, filtrarDni } from "./filtros-de-entrada";

describe("filtrarDni", () => {
  it.each([
    ["45678912", "45678912"],
    ["4567891A", "4567891"],
    ["4567-8912", "45678912"],
    ["456789123456", "45678912"],
    ["ABC", ""],
  ])('"%s" queda como "%s": solo números y máximo 8', (entrada, salida) => {
    expect(filtrarDni(entrada)).toBe(salida);
  });
});

describe("filtrarCarneExtranjeria", () => {
  it.each([
    ["AB1234567", "AB1234567"],
    ["ab1234567", "AB1234567"],
    ["AB-123 456", "AB123456"],
    ["ÑB1234567", "B1234567"],
    ["1234567890123456", "123456789012"],
  ])('"%s" queda como "%s": letras y números en mayúscula, máximo 12', (entrada, salida) => {
    expect(filtrarCarneExtranjeria(entrada)).toBe(salida);
  });
});

describe("filtrarCelular", () => {
  it.each([
    ["987654321", "987654321"],
    ["+51 987-654-321", "519876543"],
    ["9876543210", "987654321"],
  ])('"%s" queda como "%s": solo números y máximo 9', (entrada, salida) => {
    expect(filtrarCelular(entrada)).toBe(salida);
  });
});
