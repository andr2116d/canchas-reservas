import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { DatosDeIdentidad } from "./datos-de-identidad";
import { unaCuenta } from "./pruebas-de-cuenta";

describe("DatosDeIdentidad", () => {
  afterEach(cleanup);

  it("muestra los datos que identifican a la persona, sin dejarlos editar", () => {
    render(<DatosDeIdentidad cuenta={unaCuenta()} />);

    expect(screen.getByText("Valeria León Paredes")).toBeInTheDocument();
    expect(screen.getByText("DNI 45678912")).toBeInTheDocument();
    expect(screen.getByText("14/05/1998")).toBeInTheDocument();
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
  });

  it.each([
    ["JUGADOR", "pide a recepción que los corrija"],
    ["RECEPCIONISTA", "pide a administración que los corrija"],
  ] as const)("explica a %s a quién pedir una corrección", (rol, texto) => {
    render(<DatosDeIdentidad cuenta={unaCuenta({ rol })} />);

    expect(screen.getByText(new RegExp(texto))).toBeInTheDocument();
  });
});
