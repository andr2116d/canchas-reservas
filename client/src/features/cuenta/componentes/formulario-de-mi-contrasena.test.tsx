import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cambiarMiContrasena } from "../servicios/cuenta.api";
import { FormularioDeMiContrasena } from "./formulario-de-mi-contrasena";

vi.mock("../servicios/cuenta.api", () => ({ cambiarMiContrasena: vi.fn() }));

async function llenar(actual: string, nueva: string, confirmacion = nueva) {
  const usuario = userEvent.setup();
  await usuario.type(screen.getByLabelText(/^Contraseña actual/), actual);
  await usuario.type(screen.getByLabelText(/^Contraseña nueva/), nueva);
  await usuario.type(screen.getByLabelText(/^Confirma la contraseña nueva/), confirmacion);
  await usuario.click(screen.getByRole("button", { name: "Cambiar contraseña" }));
}

describe("FormularioDeMiContrasena", () => {
  beforeEach(() => vi.resetAllMocks());
  afterEach(cleanup);

  it("cambia la contraseña y avisa que cerró las demás sesiones", async () => {
    vi.mocked(cambiarMiContrasena).mockResolvedValue({ tipo: "hecho" });
    render(<FormularioDeMiContrasena />);

    await llenar("actual2026", "nueva2026");

    expect(cambiarMiContrasena).toHaveBeenCalledWith("actual2026", "nueva2026");
    expect(await screen.findByRole("status")).toHaveTextContent("Contraseña cambiada");
  });

  it("pide que la confirmación coincida antes de enviar", async () => {
    render(<FormularioDeMiContrasena />);

    await llenar("actual2026", "nueva2026", "otra2026");

    expect(await screen.findByText("Las contraseñas deben coincidir.")).toBeInTheDocument();
    expect(cambiarMiContrasena).not.toHaveBeenCalled();
  });

  it("marca la contraseña actual si no es correcta", async () => {
    vi.mocked(cambiarMiContrasena).mockResolvedValue({
      tipo: "datos-rechazados",
      errores: { actual: "La contraseña actual no es correcta." },
    });
    render(<FormularioDeMiContrasena />);

    await llenar("incorrecta1", "nueva2026");

    expect(await screen.findByText("La contraseña actual no es correcta.")).toBeInTheDocument();
  });
});
