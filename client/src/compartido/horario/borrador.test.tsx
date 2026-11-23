import { render, screen, waitFor } from "@testing-library/react";
import { useEffect } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ProveedorDelBorrador, useBorrador } from "./borrador";
import type { HorarioParaSimular, TarifaParaSimular } from "./simulacion";
import { simularTurnos } from "./simulacion.api";

vi.mock("./simulacion.api", () => ({ simularTurnos: vi.fn() }));

const HORARIO: HorarioParaSimular = { inicioDeLaNoche: "18:00", dias: [{ dia: "LUNES", abierto: true, abre: "08:00", cierra: "22:00" }] };
const FUTBOL_7: TarifaParaSimular = { tipo: "FUTBOL_7", precioDia: "50", precioNoche: "100", duracionDelTurno: "3", ofreceTurnoCorto: false };

function Editor({ horario, tarifa }: { horario?: HorarioParaSimular; tarifa?: TarifaParaSimular }) {
  const { publicarHorario, publicarTarifa, simulacion, aviso } = useBorrador();
  useEffect(() => publicarHorario(horario), [horario, publicarHorario]);
  useEffect(() => publicarTarifa("FUTBOL_7", tarifa), [tarifa, publicarTarifa]);
  return <p>{aviso ?? (simulacion ? "con turnos" : "sin turnos")}</p>;
}

describe("ProveedorDelBorrador", () => {
  beforeEach(() => vi.resetAllMocks());

  it("pide al server los turnos de lo que se está editando, una vez que se deja de escribir", async () => {
    vi.mocked(simularTurnos).mockResolvedValue({ tipo: "simulado", simulacion: { tipos: {} } });
    render(
      <ProveedorDelBorrador>
        <Editor horario={HORARIO} tarifa={FUTBOL_7} />
      </ProveedorDelBorrador>,
    );

    expect(await screen.findByText("con turnos")).toBeInTheDocument();
    expect(simularTurnos).toHaveBeenCalledTimes(1);
    expect(vi.mocked(simularTurnos).mock.calls[0][0]).toEqual({ horario: HORARIO, tarifas: [FUTBOL_7] });
  });

  it("no simula mientras el horario tenga errores y lo dice", async () => {
    render(
      <ProveedorDelBorrador>
        <Editor tarifa={FUTBOL_7} />
      </ProveedorDelBorrador>,
    );

    expect(screen.getByText("Corrige el horario marcado para actualizar los turnos.")).toBeInTheDocument();
    await new Promise((listo) => setTimeout(listo, 450));
    expect(simularTurnos).not.toHaveBeenCalled();
  });

  it("muestra por qué no se pudo calcular", async () => {
    vi.mocked(simularTurnos).mockResolvedValue({ tipo: "error", mensaje: "No pudimos conectar con La Previa." });
    render(
      <ProveedorDelBorrador>
        <Editor horario={HORARIO} />
      </ProveedorDelBorrador>,
    );

    await waitFor(() => expect(screen.getByText("No pudimos conectar con La Previa.")).toBeInTheDocument());
  });
});
