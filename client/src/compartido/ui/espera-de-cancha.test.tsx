import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { EsperaDeCancha } from "./espera-de-cancha";

describe("EsperaDeCancha", () => {
  it("anuncia la espera a lectores de pantalla con su mensaje", () => {
    render(<EsperaDeCancha />);

    expect(screen.getByRole("status")).toHaveTextContent("Cargando tu cuenta…");
  });

  it("permite cambiar el mensaje", () => {
    render(<EsperaDeCancha mensaje="Revisando tu acceso…" />);

    expect(screen.getByRole("status")).toHaveTextContent("Revisando tu acceso…");
  });

  it("dibuja el balón y los botines como decoración oculta", () => {
    const { container } = render(<EsperaDeCancha />);

    const campo = container.querySelector(".espera-de-cancha__campo");
    expect(campo).toHaveAttribute("aria-hidden", "true");
    expect(campo?.querySelector(".espera-de-cancha__balon")).not.toBeNull();
  });
});
