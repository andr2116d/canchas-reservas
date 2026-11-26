import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { CambiosDeAdicionales } from "./cambios-de-adicionales";

describe("CambiosDeAdicionales", () => {
  afterEach(cleanup);

  it("dice quién hizo cada cambio, cuándo y qué cambió", () => {
    render(
      <CambiosDeAdicionales
        cambios={[
          {
            accion: "EDICION",
            nombreDelAdicional: "Pelota",
            ejecutadoPor: "Valeria León",
            ocurridoEn: "2026-11-24T15:30:00.000Z",
            detalle: { nombre: { antes: "Balón", despues: "Pelota" }, precio: { antes: "45.00", despues: "50.00" } },
          },
          {
            accion: "ALTA",
            nombreDelAdicional: "Balón",
            ejecutadoPor: "Valeria León",
            ocurridoEn: "2026-11-23T15:30:00.000Z",
            detalle: { nombre: "Balón", descripcion: null, precio: "45.00" },
          },
        ]}
      />,
    );

    const [edicion, alta] = screen.getAllByRole("listitem");
    expect(edicion).toHaveTextContent("Valeria León editó Pelota: nombre Balón → Pelota · precio S/ 45.00 → S/ 50.00");
    expect(alta).toHaveTextContent("Valeria León creó Balón a S/ 45.00");
  });

  it("sin cambios no muestra nada", () => {
    const { container } = render(<CambiosDeAdicionales cambios={[]} />);

    expect(container).toBeEmptyDOMElement();
  });
});
