import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { AvisoDeContrasenaTemporal } from "./aviso-de-contrasena-temporal";

describe("AvisoDeContrasenaTemporal", () => {
  afterEach(cleanup);

  it("recuerda cambiar la contraseña temporal y lleva a cambiarla", () => {
    render(<AvisoDeContrasenaTemporal tiempoRestante="6 días" />);

    expect(screen.getByRole("status")).toHaveTextContent("Sigues con una contraseña temporal.");
    expect(screen.getByRole("status")).toHaveTextContent("Vence en 6 días.");
    expect(screen.getByRole("link", { name: "Cambiarla ahora" })).toHaveAttribute("href", "/cambiar-contrasena");
  });
});
