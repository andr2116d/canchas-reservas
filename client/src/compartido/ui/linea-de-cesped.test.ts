import { describe, expect, it } from "vitest";
import { HOJAS } from "./linea-de-cesped";

describe("LineaDeCesped", () => {
  it("dibuja las hojas con dos decimales como máximo, para que el server y el navegador coincidan", () => {
    expect(HOJAS).not.toMatch(/\d\.\d{3,}/);
    expect(HOJAS.match(/M/g)).toHaveLength(44);
  });
});
