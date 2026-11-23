import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import type { FichaDeRecepcionista } from "../servicios/ficha-de-recepcionista";
import { ListadoDeRecepcionistas } from "./listado-de-recepcionistas";

function unaFicha(cambios: Partial<FichaDeRecepcionista> = {}): FichaDeRecepcionista {
  return {
    id: 7,
    nombres: "Rosa",
    apellidos: "Quispe Lozano",
    correo: "rosa.quispe@laprevia.pe",
    tipoDocumento: "DNI",
    numeroDocumento: "41234567",
    fechaNacimiento: "1995-02-01",
    celular: "912345678",
    estado: "ACTIVO",
    requiereCambiarContrasena: false,
    creadaEn: "2026-11-22T15:00:00.000Z",
    ...cambios,
  };
}

describe("ListadoDeRecepcionistas", () => {
  afterEach(cleanup);

  it("muestra cada recepcionista con sus datos y un enlace a su ficha", () => {
    render(<ListadoDeRecepcionistas estado="activas" fichas={[unaFicha()]} />);

    const fila = screen.getByRole("listitem");
    expect(within(fila).getByRole("link", { name: "Rosa Quispe Lozano" })).toHaveAttribute(
      "href",
      "/administracion/recepcionistas/7",
    );
    expect(fila).toHaveTextContent("rosa.quispe@laprevia.pe");
    expect(fila).toHaveTextContent("DNI 41234567");
    expect(fila).toHaveTextContent("912345678");
  });

  it("señala a quien aún no cambió su contraseña temporal", () => {
    render(<ListadoDeRecepcionistas estado="activas" fichas={[unaFicha({ requiereCambiarContrasena: true })]} />);

    expect(screen.getByText("Contraseña temporal")).toBeInTheDocument();
  });

  it("marca la pestaña del estado que se está viendo", () => {
    render(<ListadoDeRecepcionistas estado="desactivadas" fichas={[]} />);

    const pestanas = screen.getByRole("navigation", { name: "Estado de las cuentas" });
    expect(within(pestanas).getByRole("link", { name: "Desactivadas" })).toHaveAttribute("aria-current", "page");
    expect(within(pestanas).getByRole("link", { name: "Activas" })).toHaveAttribute(
      "href",
      "/administracion/recepcionistas",
    );
  });

  it.each([
    ["activas", "Todavía no hay recepcionistas activas."],
    ["desactivadas", "No hay cuentas desactivadas."],
  ] as const)("explica el listado vacío de %s", (estado, mensaje) => {
    render(<ListadoDeRecepcionistas estado={estado} fichas={[]} />);

    expect(screen.getByText(mensaje)).toBeInTheDocument();
  });
});
