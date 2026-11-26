import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { EncabezadoDeSeccion } from "./encabezado-de-seccion";

describe("EncabezadoDeSeccion", () => {
  it("muestra el título como encabezado principal sobre la cancha", () => {
    render(<EncabezadoDeSeccion titulo="Recepcionistas" descripcion="Quién opera la caja." />);

    expect(screen.getByRole("heading", { level: 1, name: "Recepcionistas" })).toBeInTheDocument();
    expect(screen.getByRole("banner")).toHaveClass("encabezado-de-seccion");
  });

  it("puede llevar una tarjeta al lado del título, alineada arriba", () => {
    render(
      <EncabezadoDeSeccion titulo="Cambia tu contraseña" tarjeta={<section aria-label="Contraseña nueva" />} />,
    );

    expect(screen.getByRole("banner")).toHaveClass("encabezado-de-seccion--con-tarjeta");
    expect(screen.getByRole("region", { name: "Contraseña nueva" })).toBeInTheDocument();
  });
});
