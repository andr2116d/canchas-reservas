import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import Cargando from "./loading";

describe("Carga de cualquier sección", () => {
  it("muestra la espera de la cancha a pantalla completa", () => {
    const { container } = render(<Cargando />);

    expect(screen.getByRole("status")).toBeInTheDocument();
    expect(container.querySelector(".espera-de-cancha__balon")).not.toBeNull();
  });
});
