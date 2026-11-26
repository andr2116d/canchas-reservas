import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { unaFila } from "../../../../test/features/reclamos/hoja-de-prueba";
import { ListaDeReclamos } from "./lista-de-reclamos";

describe("ListaDeReclamos", () => {
  it("cada hoja lleva a atenderla y dice cuánto queda del plazo", () => {
    render(<ListaDeReclamos hojas={[unaFila()]} />);

    const hoja = screen.getByRole("link", { name: /000014-2026/ });
    expect(hoja).toHaveAttribute("href", "/administracion/reclamos/000014-2026");
    expect(hoja).toHaveTextContent("Valeria León Paredes");
    expect(hoja).toHaveTextContent("Sin clasificar");
    expect(hoja).toHaveTextContent("Quedan 10 días hábiles");
  });

  it.each([
    [{ diasHabilesRestantes: 0 }, "Vence hoy"],
    [{ diasHabilesRestantes: -2, vencida: true }, "Vencida hace 2 días hábiles"],
    [{ estado: "RESPONDIDA" as const, diasHabilesRestantes: null, respondidaEn: "2026-12-17T20:00:00.000Z", fueraDePlazo: true }, "Respondida el 17/12/2026 · fuera de plazo"],
  ])("el plazo se lee en cada caso (%o)", (cambios, texto) => {
    render(<ListaDeReclamos hojas={[unaFila(cambios)]} />);

    expect(screen.getByRole("link")).toHaveTextContent(texto);
  });

  it("una por responder con el plazo vencido se marca como vencida", () => {
    render(<ListaDeReclamos hojas={[unaFila({ vencida: true, diasHabilesRestantes: -1 })]} />);

    expect(screen.getByText("Vencida", { exact: true })).toBeInTheDocument();
  });
});
