import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { actualizarMiCuenta } from "../servicios/cuenta.api";
import { FormularioDeContacto } from "./formulario-de-contacto";
import { unaCuenta } from "./pruebas-de-cuenta";

const navegar = vi.hoisted(() => ({ refresh: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => navegar }));
vi.mock("../servicios/cuenta.api", () => ({ actualizarMiCuenta: vi.fn() }));

describe("FormularioDeContacto", () => {
  beforeEach(() => vi.resetAllMocks());
  afterEach(cleanup);

  it("el personal solo ve su celular para editar", () => {
    render(<FormularioDeContacto cuenta={unaCuenta({ rol: "RECEPCIONISTA", editables: ["celular"] })} />);

    expect(screen.getByLabelText(/^Celular/)).toHaveValue("987654321");
    expect(screen.queryByLabelText(/^Correo/)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/^Dorsal/)).not.toBeInTheDocument();
  });

  it("guarda los datos editables y avisa que se guardaron", async () => {
    vi.mocked(actualizarMiCuenta).mockResolvedValue({ tipo: "hecho" });
    const usuario = userEvent.setup();
    render(<FormularioDeContacto cuenta={unaCuenta()} />);

    await usuario.clear(screen.getByLabelText(/^Celular/));
    await usuario.type(screen.getByLabelText(/^Celular/), "912000111");
    await usuario.click(screen.getByRole("button", { name: "Guardar cambios" }));

    expect(actualizarMiCuenta).toHaveBeenCalledWith({ correo: "valeria@gmail.com", celular: "912000111", dorsal: "10" });
    expect(await screen.findByRole("status")).toHaveTextContent("Cambios guardados.");
    await waitFor(() => expect(navegar.refresh).toHaveBeenCalled());
  });

  it("marca el correo que ya usa otra cuenta", async () => {
    vi.mocked(actualizarMiCuenta).mockResolvedValue({
      tipo: "datos-rechazados",
      errores: { correo: "Ya existe una cuenta con este correo." },
    });
    const usuario = userEvent.setup();
    render(<FormularioDeContacto cuenta={unaCuenta()} />);

    await usuario.click(screen.getByRole("button", { name: "Guardar cambios" }));

    expect(await screen.findByText("Ya existe una cuenta con este correo.")).toBeInTheDocument();
  });
});
