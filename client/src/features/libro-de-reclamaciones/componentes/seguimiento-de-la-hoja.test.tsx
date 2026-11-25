import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { unSeguimiento } from "../../../../test/features/libro-de-reclamaciones/constancia-de-prueba";
import { seguirHoja } from "../servicios/libro.api";
import { SeguimientoDeLaHoja } from "./seguimiento-de-la-hoja";

vi.mock("../servicios/libro.api", () => ({ seguirHoja: vi.fn() }));
const seguirSimulado = vi.mocked(seguirHoja);

async function buscar(numero: string, codigo: string) {
  const persona = userEvent.setup();
  render(<SeguimientoDeLaHoja />);
  await persona.type(screen.getByLabelText(/^Número de hoja/), numero);
  await persona.type(screen.getByLabelText(/^Código de seguimiento/), codigo);
  await persona.click(screen.getByRole("button", { name: "Ver mi hoja" }));
}

describe("SeguimientoDeLaHoja", () => {
  beforeEach(() => seguirSimulado.mockReset());

  it("con número y código muestra el estado, el plazo y el avance", async () => {
    seguirSimulado.mockResolvedValue({ tipo: "aceptado", cuerpo: unSeguimiento() });

    await buscar("000014-2026", "k7qp 4zmd");

    expect(seguirSimulado).toHaveBeenCalledWith("000014-2026", "K7QP4ZMD");
    expect(await screen.findByRole("heading", { name: "Hoja 000014-2026" })).toBeInTheDocument();
    expect(screen.getByText(/quedan 10 días hábiles/)).toBeInTheDocument();
    expect(screen.getByRole("listitem", { current: "step" })).toHaveTextContent("Respondida");
  });

  it("una hoja respondida muestra la respuesta", async () => {
    seguirSimulado.mockResolvedValue({
      tipo: "aceptado",
      cuerpo: unSeguimiento({ estado: "RESPONDIDA", diasHabilesRestantes: null, respuesta: { texto: "Devolvimos el adelanto.", respondidaEn: "2026-12-01T21:20:00.000Z", cartaEnviadaEl: null } }),
    });

    await buscar("000014-2026", "K7QP-4ZMD");

    expect(await screen.findByText("Devolvimos el adelanto.")).toBeInTheDocument();
    expect(screen.getByText(/Respondida el 01\/12\/2026, 16:20/)).toBeInTheDocument();
  });

  it("si no coincide, dice que revise los dos datos", async () => {
    seguirSimulado.mockResolvedValue({
      tipo: "rechazado",
      estado: 404,
      mensaje: "No encontramos una hoja con ese número y código. Revisa los dos datos de la constancia.",
      errores: {},
    });

    await buscar("000014-2026", "AAAA-AAAA");

    expect(await screen.findByRole("alert")).toHaveTextContent("No encontramos una hoja con ese número y código.");
  });

  it("revisa el formato antes de buscar", async () => {
    await buscar("14", "ABC");

    expect(seguirSimulado).not.toHaveBeenCalled();
    expect(screen.getByLabelText(/^Número de hoja/)).toHaveAccessibleDescription(/por ejemplo 000014-2026/);
    expect(screen.getByLabelText(/^Código de seguimiento/)).toHaveAccessibleDescription(/8 letras y números/);
  });
});
