import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { completarMisDatos } from "../servicios/cuenta.api";
import { FormularioDeDatosPropios } from "./formulario-de-datos-propios";
import { unaCuenta } from "../../../../test/compartido/cuenta/una-cuenta";

const navegar = vi.hoisted(() => ({ replace: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => navegar }));
vi.mock("../servicios/cuenta.api", () => ({ completarMisDatos: vi.fn() }));

const ADMIN_SIN_DATOS = unaCuenta({
  rol: "ADMINISTRADOR",
  nombres: "Vale",
  apellidos: "León",
  tipoDocumento: undefined,
  numeroDocumento: undefined,
  fechaNacimiento: undefined,
  celular: undefined,
});
const RECEPCIONISTA = unaCuenta({ rol: "RECEPCIONISTA", nombres: "Rossa", numeroDocumento: "41234567" });

describe("FormularioDeDatosPropios", () => {
  beforeEach(() => vi.resetAllMocks());
  afterEach(cleanup);

  it("el administrador completa todo, con su documento, y sigue al cambio de contraseña", async () => {
    vi.mocked(completarMisDatos).mockResolvedValue({ tipo: "hecho" });
    const usuario = userEvent.setup();
    render(<FormularioDeDatosPropios cuenta={ADMIN_SIN_DATOS} siguiente="/cambiar-contrasena" />);

    await usuario.clear(screen.getByLabelText(/^Nombres/));
    await usuario.type(screen.getByLabelText(/^Nombres/), "Valeria");
    await usuario.type(screen.getByLabelText(/^Fecha de nacimiento/), "1990-03-02");
    await usuario.type(screen.getByLabelText(/^Celular/), "987654321");
    await usuario.type(screen.getByLabelText(/^Número de documento/), "45678912");
    await usuario.click(screen.getByRole("button", { name: "Guardar mis datos" }));

    expect(completarMisDatos).toHaveBeenCalledWith({
      nombres: "Valeria",
      apellidos: "León",
      fechaNacimiento: "1990-03-02",
      celular: "987654321",
      tipoDocumento: "DNI",
      numeroDocumento: "45678912",
    });
    expect(navegar.replace).toHaveBeenCalledWith("/cambiar-contrasena");
  });

  it("la recepcionista ve su documento con candado, corrige su nombre y confirma", async () => {
    vi.mocked(completarMisDatos).mockResolvedValue({ tipo: "hecho" });
    const usuario = userEvent.setup();
    render(<FormularioDeDatosPropios cuenta={RECEPCIONISTA} siguiente="/cambiar-contrasena" />);

    expect(screen.getByText("DNI 41234567")).toBeInTheDocument();
    expect(screen.queryByLabelText(/^Número de documento/)).not.toBeInTheDocument();
    await usuario.clear(screen.getByLabelText(/^Nombres/));
    await usuario.type(screen.getByLabelText(/^Nombres/), "Rosa");
    await usuario.click(screen.getByRole("button", { name: "Mis datos son correctos" }));

    expect(completarMisDatos).toHaveBeenCalledWith(expect.not.objectContaining({ numeroDocumento: expect.anything() }));
    expect(completarMisDatos).toHaveBeenCalledWith(expect.objectContaining({ nombres: "Rosa" }));
  });

  it("muestra el aviso de privacidad del personal y los errores de cada campo", async () => {
    const usuario = userEvent.setup();
    render(<FormularioDeDatosPropios cuenta={ADMIN_SIN_DATOS} siguiente="/cambiar-contrasena" />);

    await usuario.click(screen.getByRole("button", { name: "Guardar mis datos" }));

    expect(screen.getByRole("link", { name: "aviso de privacidad del personal" })).toBeInTheDocument();
    expect(completarMisDatos).not.toHaveBeenCalled();
    expect(screen.getByLabelText(/^Celular/)).toHaveAttribute("aria-invalid", "true");
  });
});
