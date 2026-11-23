import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { editarRecepcionista } from "../servicios/recepcionistas.api";
import { FormularioDeEdicion } from "./formulario-de-edicion";

const navegar = vi.hoisted(() => ({ refresh: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => navegar }));
vi.mock("../servicios/recepcionistas.api", () => ({ editarRecepcionista: vi.fn(), sugerirCorreo: vi.fn() }));

const DATOS = {
  nombres: "Rosa",
  apellidos: "Quispe Lozano",
  fechaNacimiento: "1995-02-01",
  tipoDocumento: "DNI" as const,
  numeroDocumento: "41234567",
  celular: "912345678",
  usuarioDeCorreo: "rosa.quispe",
};

describe("FormularioDeEdicion", () => {
  beforeEach(() => vi.resetAllMocks());
  afterEach(cleanup);

  it("muestra los datos actuales y guarda los cambios", async () => {
    vi.mocked(editarRecepcionista).mockResolvedValue({ tipo: "hecho" });
    const usuario = userEvent.setup();
    render(<FormularioDeEdicion id={7} dominio="laprevia.pe" datos={DATOS} />);
    expect(screen.getByLabelText(/^Nombres/)).toHaveValue("Rosa");

    await usuario.clear(screen.getByLabelText(/^Celular/));
    await usuario.type(screen.getByLabelText(/^Celular/), "987000111");
    await usuario.click(screen.getByRole("button", { name: "Guardar cambios" }));

    expect(editarRecepcionista).toHaveBeenCalledWith(7, { ...DATOS, celular: "987000111" });
    expect(await screen.findByRole("status")).toHaveTextContent("Cambios guardados.");
    await waitFor(() => expect(navegar.refresh).toHaveBeenCalled());
  });

  it("marca el dato que ya pertenece a otra cuenta", async () => {
    vi.mocked(editarRecepcionista).mockResolvedValue({
      tipo: "datos-rechazados",
      errores: { numeroDocumento: "Este documento ya pertenece a otra cuenta de recepción." },
    });
    const usuario = userEvent.setup();
    render(<FormularioDeEdicion id={7} dominio="laprevia.pe" datos={DATOS} />);

    await usuario.click(screen.getByRole("button", { name: "Guardar cambios" }));

    expect(await screen.findByText("Este documento ya pertenece a otra cuenta de recepción.")).toBeInTheDocument();
  });
});
