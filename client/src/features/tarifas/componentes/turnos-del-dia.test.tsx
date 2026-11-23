import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { consultarTurnosDelDia } from "../servicios/tarifas.api";
import { TurnosDelDia } from "./turnos-del-dia";

vi.mock("../servicios/tarifas.api", () => ({ consultarTurnosDelDia: vi.fn() }));

const ABIERTO = {
  tipo: "consultado" as const,
  turnos: {
    estado: "ABIERTO" as const,
    duracionDelTurnoHoras: 3,
    inicioDeLaNoche: "18:00",
    turnos: [
      { desde: "14:00", hasta: "17:00", corto: false, total: "50.00", tramos: [{ franja: "DIA" as const, desde: "14:00", hasta: "17:00", monto: "50.00" }] },
      {
        desde: "17:00",
        hasta: "20:00",
        corto: false,
        total: "83.33",
        tramos: [
          { franja: "DIA" as const, desde: "17:00", hasta: "18:00", monto: "16.67" },
          { franja: "NOCHE" as const, desde: "18:00", hasta: "20:00", monto: "66.66" },
        ],
      },
      { desde: "20:00", hasta: "22:00", corto: true, total: "66.67", tramos: [{ franja: "NOCHE" as const, desde: "20:00", hasta: "22:00", monto: "66.67" }] },
    ],
  },
};

describe("TurnosDelDia", () => {
  beforeEach(() => vi.resetAllMocks());

  it("muestra los turnos del tipo y el día elegidos con su precio y su desglose", async () => {
    vi.mocked(consultarTurnosDelDia).mockResolvedValue(ABIERTO);
    const usuario = userEvent.setup();
    render(<TurnosDelDia />);

    await usuario.click(screen.getByRole("radio", { name: "Fútbol 7" }));
    await usuario.click(screen.getByRole("radio", { name: "Sáb" }));

    expect(consultarTurnosDelDia).toHaveBeenLastCalledWith("FUTBOL_7", "SABADO");
    const turnos = await screen.findAllByRole("listitem");
    expect(turnos).toHaveLength(3);
    expect(turnos[1]).toHaveTextContent("17:00 a 20:00");
    expect(turnos[1]).toHaveTextContent("S/ 83.33");
    expect(turnos[1]).toHaveTextContent("Día S/ 16.67 + noche S/ 66.66");
    expect(within(turnos[2]).getByText("Turno corto")).toBeInTheDocument();
  });

  it("avisa si el día está cerrado o si falta el horario", async () => {
    vi.mocked(consultarTurnosDelDia).mockResolvedValueOnce({ tipo: "consultado", turnos: { estado: "CERRADO" } });
    render(<TurnosDelDia />);

    expect(await screen.findByText("Ese día el local no abre.")).toBeInTheDocument();
  });

  it("explica por qué no pudo consultar", async () => {
    vi.mocked(consultarTurnosDelDia).mockResolvedValue({ tipo: "error", mensaje: "Todavía no hay tarifa para fútbol 5." });
    render(<TurnosDelDia />);

    expect(await screen.findByRole("alert")).toHaveTextContent("Todavía no hay tarifa para fútbol 5.");
  });
});
