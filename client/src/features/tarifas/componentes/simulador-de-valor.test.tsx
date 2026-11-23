import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { calcularValorDelTurno } from "../servicios/tarifas.api";
import { SimuladorDeValor } from "./simulador-de-valor";

vi.mock("../servicios/tarifas.api", () => ({ calcularValorDelTurno: vi.fn() }));

describe("SimuladorDeValor", () => {
  beforeEach(() => vi.resetAllMocks());

  it("calcula el valor del turno con su desglose por franja", async () => {
    vi.mocked(calcularValorDelTurno).mockResolvedValue({
      tipo: "calculado",
      valor: {
        total: "83.33",
        duracionDelTurnoHoras: 3,
        tramos: [
          { franja: "DIA", desde: "17:00", hasta: "18:00", monto: "16.67" },
          { franja: "NOCHE", desde: "18:00", hasta: "20:00", monto: "66.66" },
        ],
      },
    });
    const usuario = userEvent.setup();
    render(<SimuladorDeValor inicioDeLaNoche="18:00" />);

    await usuario.click(screen.getByRole("radio", { name: "Fútbol 7" }));
    await usuario.clear(screen.getByLabelText(/^Hora de inicio/));
    await usuario.type(screen.getByLabelText(/^Hora de inicio/), "17:00");
    await usuario.click(screen.getByRole("button", { name: "Calcular" }));

    expect(calcularValorDelTurno).toHaveBeenCalledWith("FUTBOL_7", "17:00");
    expect(await screen.findByText("S/ 83.33")).toBeInTheDocument();
    expect(screen.getByText("Día · 17:00 a 18:00")).toBeInTheDocument();
    expect(screen.getByText("Noche · 18:00 a 20:00")).toBeInTheDocument();
  });

  it("explica por qué no pudo calcular", async () => {
    vi.mocked(calcularValorDelTurno).mockResolvedValue({
      tipo: "error",
      mensaje: "Todavía no hay tarifa para fútbol 5.",
    });
    render(<SimuladorDeValor inicioDeLaNoche="18:00" />);

    await userEvent.click(screen.getByRole("button", { name: "Calcular" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Todavía no hay tarifa para fútbol 5.",
    );
  });
});
