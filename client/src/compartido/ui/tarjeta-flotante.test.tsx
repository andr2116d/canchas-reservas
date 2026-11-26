import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { TarjetaFlotante } from "./tarjeta-flotante";

describe("TarjetaFlotante", () => {
  it("se abre con su título y se cierra con el botón Cerrar", async () => {
    const alCerrar = vi.fn();
    render(
      <TarjetaFlotante titulo="Restablecer contraseña" abierta alCerrar={alCerrar}>
        <p>Contenido</p>
      </TarjetaFlotante>,
    );

    expect(screen.getByRole("dialog", { name: "Restablecer contraseña" })).toBeVisible();
    await userEvent.click(screen.getByRole("button", { name: "Cerrar" }));

    expect(alCerrar).toHaveBeenCalled();
  });
});
