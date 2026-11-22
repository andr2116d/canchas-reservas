import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { EsperaDeCancha } from "./espera-de-cancha";

describe("EsperaDeCancha", () => {
  it("no muestra ningún texto en pantalla", () => {
    const { container } = render(<EsperaDeCancha />);

    const visible = [...container.querySelectorAll("*")]
      .filter((elemento) => !elemento.closest(".sr-only") && elemento.children.length === 0)
      .map((elemento) => elemento.textContent?.trim())
      .filter(Boolean);
    expect(visible).toEqual([]);
  });

  it("anuncia la carga solo a lectores de pantalla", () => {
    render(<EsperaDeCancha />);

    expect(screen.getByRole("status")).toHaveTextContent("Cargando");
    expect(screen.queryByText(/cuenta/i)).not.toBeInTheDocument();
  });

  it("cubre toda la pantalla con la cancha", () => {
    render(<EsperaDeCancha />);

    expect(screen.getByRole("status")).toHaveClass("espera-de-cancha");
  });

  it("dibuja los botines y el balón como decoración oculta", () => {
    const { container } = render(<EsperaDeCancha />);

    const jugada = container.querySelector(".espera-de-cancha__jugada");
    expect(jugada).toHaveAttribute("aria-hidden", "true");
    for (const parte of ["pierna--atras", "pierna--adelante", "tobillo", "balon"]) {
      expect(jugada?.querySelector(`.espera-de-cancha__${parte}`)).not.toBeNull();
    }
  });
});
