import { render } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { MarcaDeCargaInicial } from "./marca-de-carga-inicial";

describe("MarcaDeCargaInicial", () => {
  afterEach(() => delete document.documentElement.dataset.cargaInicial);

  it("marca la página como lista cuando ya terminó de cargar", () => {
    render(<MarcaDeCargaInicial />);

    expect(document.documentElement.dataset.cargaInicial).toBe("lista");
  });
});
