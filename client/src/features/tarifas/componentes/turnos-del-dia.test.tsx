import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useEffect } from "react";
import { describe, expect, it } from "vitest";
import { ProveedorDelBorrador, type SemanaEnBorrador, useBorrador } from "@/compartido/horario/borrador";
import type { TarifaEnBorrador } from "@/compartido/horario/turnos";
import { TurnosDelDia } from "./turnos-del-dia";

const SEMANA: SemanaEnBorrador = {
  LUNES: { abre: "08:00", cierra: "22:00", inicioDeLaNoche: "18:00" },
  SABADO: { abre: "08:00", cierra: "22:00", inicioDeLaNoche: "17:00" },
};
const FUTBOL_7: TarifaEnBorrador = { precioDia: "50", precioNoche: "100", horas: 3, ofreceTurnoCorto: false };

function ConTarifa({ tarifa }: { tarifa?: TarifaEnBorrador }) {
  const { publicarTarifa } = useBorrador();
  useEffect(() => publicarTarifa("FUTBOL_7", tarifa), [publicarTarifa, tarifa]);
  return null;
}

function mostrar(tarifa: TarifaEnBorrador | undefined = FUTBOL_7, semana: SemanaEnBorrador | undefined = SEMANA) {
  render(
    <ProveedorDelBorrador semanaInicial={semana}>
      <ConTarifa tarifa={tarifa} />
      <TurnosDelDia />
    </ProveedorDelBorrador>,
  );
}

describe("TurnosDelDia", () => {
  it("muestra los turnos del tipo y el día elegidos con su precio y su desglose", async () => {
    mostrar();

    await userEvent.click(screen.getByRole("button", { name: "Fútbol 7" }));

    const turnos = screen.getAllByRole("listitem");
    expect(turnos).toHaveLength(4);
    expect(turnos[3]).toHaveTextContent("17:00 a 20:00");
    expect(turnos[3]).toHaveTextContent("Día S/ 16.67 + noche S/ 66.66");
    expect(turnos[3]).toHaveTextContent("S/ 83.33");
    expect(screen.getByText("De 20:00 a 22:00 no se ofrece turno: no alcanza para uno completo.")).toBeInTheDocument();
  });

  it("usa la hora de noche propia del día", async () => {
    mostrar();

    await userEvent.click(screen.getByRole("button", { name: "Fútbol 7" }));
    await userEvent.click(screen.getByRole("button", { name: "Sábado" }));

    expect(screen.getByText(/precio de noche desde las 17:00/)).toBeInTheDocument();
    expect(within(screen.getAllByRole("listitem")[3]).getByText("S/ 100.00")).toBeInTheDocument();
  });

  it("avisa si el día está cerrado, si falta el horario o si el tipo no tiene tarifa", async () => {
    mostrar();
    await userEvent.click(screen.getByRole("button", { name: "Fútbol 7" }));
    await userEvent.click(screen.getByRole("button", { name: "Domingo" }));
    expect(screen.getByText("El domingo el local no abre.")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Fútbol 5" }));
    await userEvent.click(screen.getByRole("button", { name: "Lunes" }));
    expect(screen.getByText("Fútbol 5 todavía no tiene tarifa.")).toBeInTheDocument();
  });
});
