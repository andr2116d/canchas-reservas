import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { HistorialDeCuenta } from "./historial-de-cuenta";

describe("HistorialDeCuenta", () => {
  afterEach(cleanup);

  it("muestra cada acción con su fecha y hora en Lima y quién la hizo", () => {
    render(
      <HistorialDeCuenta
        historial={[
          { accion: "DESACTIVACION", ocurridoEn: "2026-11-23T01:30:00.000Z", ejecutadoPor: "Valeria León" },
          { accion: "ALTA", ocurridoEn: "2026-11-22T15:05:00.000Z", ejecutadoPor: "Valeria León" },
        ]}
      />,
    );

    const acciones = screen.getAllByRole("listitem");
    expect(acciones[0]).toHaveTextContent("Desactivación");
    expect(acciones[0]).toHaveTextContent("22 nov 2026, 20:30");
    expect(acciones[0]).toHaveTextContent("Valeria León");
    expect(acciones[1]).toHaveTextContent("Alta de la cuenta");
  });
});
