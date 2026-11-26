import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { actualizarMiCuenta } from "../servicios/cuenta.api";
import { FormularioDeMisDatos } from "./formulario-de-mis-datos";
import { unaCuenta } from "../../../../test/compartido/cuenta/una-cuenta";

const navegar = vi.hoisted(() => ({ refresh: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => navegar }));
vi.mock("../servicios/cuenta.api", () => ({ actualizarMiCuenta: vi.fn() }));

const RECEPCIONISTA = unaCuenta({
  rol: "RECEPCIONISTA",
  correo: "rosa.quispe@laprevia.pe",
  editables: ["nombres", "apellidos", "fechaNacimiento", "celular"],
});
const ADMINISTRADOR = unaCuenta({
  rol: "ADMINISTRADOR",
  correo: "valeria@laprevia.pe",
  editables: ["nombres", "apellidos", "fechaNacimiento", "correo", "celular"],
});

describe("FormularioDeMisDatos", () => {
  beforeEach(() => vi.resetAllMocks());
  afterEach(cleanup);

  it("la recepcionista corrige sus nombres y su fecha; su correo lo asigna administración", () => {
    render(<FormularioDeMisDatos cuenta={RECEPCIONISTA} />);

    expect(screen.getByLabelText(/^Nombres/)).toHaveValue("Valeria");
    expect(screen.getByLabelText(/^Fecha de nacimiento/)).toHaveValue("1998-05-14");
    expect(screen.queryByLabelText(/^Correo/)).not.toBeInTheDocument();
    expect(screen.getByText("rosa.quispe@laprevia.pe")).toBeInTheDocument();
    expect(screen.getByText(/lo asigna administración/)).toBeInTheDocument();
    expect(screen.queryByLabelText(/^Dorsal/)).not.toBeInTheDocument();
  });

  it("el administrador escribe solo lo que va antes de @laprevia.pe y se envía completo", async () => {
    vi.mocked(actualizarMiCuenta).mockResolvedValue({ tipo: "hecho" });
    const usuario = userEvent.setup();
    render(<FormularioDeMisDatos cuenta={ADMINISTRADOR} />);
    const correo = screen.getByLabelText(/^Correo de La Previa/);

    expect(correo).toHaveValue("valeria");
    expect(screen.getByText(/usuario del sistema como administración/)).toBeInTheDocument();
    await usuario.clear(correo);
    await usuario.type(correo, "direccion");
    await usuario.click(screen.getByRole("button", { name: "Guardar cambios" }));

    expect(actualizarMiCuenta).toHaveBeenCalledWith(expect.objectContaining({ correo: "direccion@laprevia.pe" }));
    expect(await screen.findByRole("status")).toHaveTextContent("Cambios guardados.");
  });

  it("el error del correo del administrador se marca en su campo", async () => {
    vi.mocked(actualizarMiCuenta).mockResolvedValue({ tipo: "datos-rechazados", errores: { correo: "Este correo ya fue registrado." } });
    const usuario = userEvent.setup();
    render(<FormularioDeMisDatos cuenta={ADMINISTRADOR} />);

    await usuario.click(screen.getByRole("button", { name: "Guardar cambios" }));

    expect(await screen.findByText("Este correo ya fue registrado.")).toBeInTheDocument();
  });

  it("el jugador cambia su correo, su celular y su dorsal", async () => {
    vi.mocked(actualizarMiCuenta).mockResolvedValue({ tipo: "hecho" });
    const usuario = userEvent.setup();
    render(<FormularioDeMisDatos cuenta={unaCuenta()} />);

    await usuario.clear(screen.getByLabelText(/^Celular/));
    await usuario.type(screen.getByLabelText(/^Celular/), "912000111");
    await usuario.click(screen.getByRole("button", { name: "Guardar cambios" }));

    expect(actualizarMiCuenta).toHaveBeenCalledWith({ correo: "valeria@gmail.com", celular: "912000111", dorsal: "10" });
    await waitFor(() => expect(navegar.refresh).toHaveBeenCalled());
  });

  it("muestra el motivo si se superó el límite de cambios", async () => {
    vi.mocked(actualizarMiCuenta).mockResolvedValue({ tipo: "error", mensaje: "Los datos ya se cambiaron 10 veces en la última hora." });
    const usuario = userEvent.setup();
    render(<FormularioDeMisDatos cuenta={unaCuenta()} />);

    await usuario.click(screen.getByRole("button", { name: "Guardar cambios" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("10 veces en la última hora");
  });
});
