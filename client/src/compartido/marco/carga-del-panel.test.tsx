import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { CargaDelPanel } from "./carga-del-panel";

describe("CargaDelPanel", () => {
  afterEach(cleanup);

  it("espera dentro de la franja de cancha del panel, sin tapar toda la pantalla", () => {
    const { container } = render(<CargaDelPanel />);

    expect(screen.getByRole("status")).toHaveTextContent("Cargando");
    expect(container.querySelector(".encabezado-de-seccion .espera-de-cancha__balon")).not.toBeNull();
    expect(container.querySelector(".cancha-completa")).toBeNull();
  });
});
