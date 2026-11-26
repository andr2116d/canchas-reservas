import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { TarjetaDeAcceso } from "./tarjeta-de-acceso";

describe("TarjetaDeAcceso", () => {
  afterEach(cleanup);

  it("muestra el título y el contenido dentro de la tarjeta", () => {
    render(
      <TarjetaDeAcceso titulo="Inicia sesión">
        <p>Formulario</p>
      </TarjetaDeAcceso>,
    );

    expect(screen.getByRole("heading", { level: 1, name: "Inicia sesión" })).toBeInTheDocument();
    expect(screen.getByText("Formulario")).toBeInTheDocument();
  });

  it("enlaza la marca y un acceso visible para volver a la portada", () => {
    render(
      <TarjetaDeAcceso titulo="Inicia sesión" sobreCancha>
        <p>Formulario</p>
      </TarjetaDeAcceso>,
    );

    expect(screen.getByRole("link", { name: "La Previa, ir a la portada" })).toHaveAttribute("href", "/");
    expect(screen.getByRole("link", { name: "Volver a la portada" })).toHaveAttribute("href", "/");
  });
});
