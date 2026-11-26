import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { CargaDeContenido } from "./carga-de-contenido";

describe("CargaDeContenido", () => {
  it("la pelota rebota sobre una línea de césped, sin caja ni pantalla completa, y dice qué se carga", () => {
    const { container } = render(<CargaDeContenido texto="Cargando recepcionistas…" />);

    expect(container.querySelector(".carga-de-contenido")).toHaveTextContent("Cargando recepcionistas…");
    expect(container.querySelector(".carga-de-contenido__jugada .pelota-que-rebota + .linea-de-cesped")).not.toBeNull();
    expect(container.querySelector(".linea-de-cesped")).toHaveAttribute("aria-hidden", "true");
  });

  it("trae también la cancha completa, que el CSS muestra solo al entrar o recargar", () => {
    const { container } = render(<CargaDeContenido texto="Cargando recepcionistas…" />);

    expect(container.querySelector(".carga-de-contenido__pantalla .cancha-completa")).toHaveTextContent("Cargando La Previa…");
  });
});
