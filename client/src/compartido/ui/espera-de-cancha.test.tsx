import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { EsperaDeCancha } from "./espera-de-cancha";

describe("EsperaDeCancha", () => {
  it("cubre la pantalla con la cancha y dice qué pasa con texto legible", () => {
    render(<EsperaDeCancha />);

    const estado = screen.getByRole("status");
    expect(estado).toHaveClass("cancha-completa", "espera-de-cancha");
    expect(estado).toHaveTextContent("Cargando La Previa…");
  });

  it("acepta otro texto según dónde se use", () => {
    render(<EsperaDeCancha texto="Revisando tu sesión…" />);

    expect(screen.getByRole("status")).toHaveTextContent("Revisando tu sesión…");
  });

  it("la pelota que rebota es solo decoración", () => {
    const { container } = render(<EsperaDeCancha />);

    expect(container.querySelector(".pelota-que-rebota")).toHaveAttribute("aria-hidden", "true");
    expect(container.querySelector(".espera-de-cancha__jugada")).toBeNull();
  });
});
