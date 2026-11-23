import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useEffect } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ProveedorDelBorrador, useBorrador } from "@/compartido/horario/borrador";
import type { HorarioParaSimular, TarifaParaSimular } from "@/compartido/horario/simulacion";
import { simularTurnos } from "@/compartido/horario/simulacion.api";
import { LUNES_DE_PRUEBA, simulacionDePrueba } from "@/compartido/horario/simulacion-de-prueba";
import { TurnosDelDia } from "./turnos-del-dia";

vi.mock("@/compartido/horario/simulacion.api", () => ({ simularTurnos: vi.fn() }));

const HORARIO: HorarioParaSimular = { inicioDeLaNoche: "18:00", dias: [{ dia: "LUNES", abierto: true, abre: "08:00", cierra: "22:00" }] };
const FUTBOL_7: TarifaParaSimular = { tipo: "FUTBOL_7", precioDia: "50", precioNoche: "100", duracionDelTurno: "3", ofreceTurnoCorto: false };
const SABADO = { ...LUNES_DE_PRUEBA, inicioDeLaNoche: "17:00" };

function Editor() {
  const { publicarHorario, publicarTarifa } = useBorrador();
  useEffect(() => {
    publicarHorario(HORARIO);
    publicarTarifa("FUTBOL_7", FUTBOL_7);
  }, [publicarHorario, publicarTarifa]);
  return null;
}

function mostrar() {
  render(
    <ProveedorDelBorrador>
      <Editor />
      <TurnosDelDia />
    </ProveedorDelBorrador>,
  );
}

describe("TurnosDelDia", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(simularTurnos).mockResolvedValue({ tipo: "simulado", simulacion: simulacionDePrueba("FUTBOL_7", { LUNES: LUNES_DE_PRUEBA, SABADO }) });
  });

  it("muestra los turnos que calculó el server con su precio y su desglose", async () => {
    mostrar();

    await userEvent.click(screen.getByRole("button", { name: "Fútbol 7" }));

    const turnos = await screen.findAllByRole("listitem");
    expect(turnos).toHaveLength(4);
    expect(turnos[3]).toHaveTextContent("17:00 a 20:00");
    expect(turnos[3]).toHaveTextContent("Día S/ 16.67 + noche S/ 66.66");
    expect(turnos[3]).toHaveTextContent("S/ 83.33");
    expect(screen.getByText("De 20:00 a 22:00 no se ofrece turno: no alcanza para uno completo.")).toBeInTheDocument();
  });

  it("usa la hora de noche del día elegido", async () => {
    mostrar();
    await userEvent.click(screen.getByRole("button", { name: "Fútbol 7" }));
    await userEvent.click(screen.getByRole("button", { name: "Sábado" }));

    expect(await screen.findByText(/precio de noche desde las 17:00/)).toBeInTheDocument();
  });

  it("avisa si el día está cerrado o si el tipo no tiene tarifa", async () => {
    mostrar();
    await userEvent.click(screen.getByRole("button", { name: "Fútbol 7" }));
    await userEvent.click(screen.getByRole("button", { name: "Domingo" }));
    expect(await screen.findByText("El domingo el local no abre.")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Fútbol 5" }));
    expect(screen.getByText("Fútbol 5 todavía no tiene tarifa.")).toBeInTheDocument();
  });
});
