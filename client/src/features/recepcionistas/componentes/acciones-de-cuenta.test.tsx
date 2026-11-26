import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  desactivarRecepcionista,
  reactivarRecepcionista,
  restablecerContrasena,
} from "../servicios/recepcionistas.api";
import { AccionesDeCuenta } from "./acciones-de-cuenta";

const navegar = vi.hoisted(() => ({ refresh: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => navegar }));
vi.mock("../servicios/recepcionistas.api", () => ({
  desactivarRecepcionista: vi.fn(),
  reactivarRecepcionista: vi.fn(),
  restablecerContrasena: vi.fn(),
}));

describe("AccionesDeCuenta", () => {
  beforeEach(() => vi.resetAllMocks());
  afterEach(cleanup);

  it("pide confirmar antes de desactivar la cuenta", async () => {
    vi.mocked(desactivarRecepcionista).mockResolvedValue({ tipo: "hecho" });
    const usuario = userEvent.setup();
    render(<AccionesDeCuenta id={7} nombres="Rosa" correo="rosa@laprevia.pe" activa />);

    await usuario.click(screen.getByRole("button", { name: "Desactivar cuenta" }));
    expect(desactivarRecepcionista).not.toHaveBeenCalled();
    expect(screen.getByText(/Rosa no podrá iniciar sesión/)).toBeInTheDocument();
    await usuario.click(screen.getByRole("button", { name: "Sí, desactivar" }));

    expect(desactivarRecepcionista).toHaveBeenCalledWith(7);
    await waitFor(() => expect(navegar.refresh).toHaveBeenCalled());
  });

  it("restablece la contraseña con una temporal generada y la muestra para entregarla", async () => {
    vi.mocked(restablecerContrasena).mockResolvedValue({ tipo: "hecho" });
    const usuario = userEvent.setup();
    render(<AccionesDeCuenta id={7} nombres="Rosa" correo="rosa@laprevia.pe" activa />);

    await usuario.click(screen.getByRole("button", { name: "Generar contraseña" }));
    const temporal = (screen.getByLabelText(/^Contraseña temporal/) as HTMLInputElement).value;
    await usuario.click(screen.getByRole("button", { name: "Restablecer contraseña" }));

    expect(restablecerContrasena).toHaveBeenCalledWith(7, temporal);
    expect(await screen.findByText(temporal)).toBeInTheDocument();
    expect(screen.getByText(/Entrégale la nueva contraseña temporal/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Copiar datos" })).toBeInTheDocument();
  });

  it("a una cuenta desactivada solo le ofrece reactivarla con una temporal nueva", async () => {
    vi.mocked(reactivarRecepcionista).mockResolvedValue({ tipo: "hecho" });
    const usuario = userEvent.setup();
    render(<AccionesDeCuenta id={7} nombres="Rosa" correo="rosa@laprevia.pe" activa={false} />);
    expect(screen.queryByRole("button", { name: "Desactivar cuenta" })).not.toBeInTheDocument();

    await usuario.type(screen.getByLabelText(/^Contraseña temporal/), "nueva2026");
    await usuario.click(screen.getByRole("button", { name: "Reactivar cuenta" }));

    expect(reactivarRecepcionista).toHaveBeenCalledWith(7, "nueva2026");
    await waitFor(() => expect(navegar.refresh).toHaveBeenCalled());
  });

  it("muestra el error si la acción no se pudo hacer", async () => {
    vi.mocked(desactivarRecepcionista).mockResolvedValue({ tipo: "error", mensaje: "Esta cuenta ya está desactivada." });
    const usuario = userEvent.setup();
    render(<AccionesDeCuenta id={7} nombres="Rosa" correo="rosa@laprevia.pe" activa />);

    await usuario.click(screen.getByRole("button", { name: "Desactivar cuenta" }));
    await usuario.click(screen.getByRole("button", { name: "Sí, desactivar" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Esta cuenta ya está desactivada.");
  });
});
