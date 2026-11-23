import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useEffect } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ProveedorDelBorrador, useBorrador } from "@/compartido/horario/borrador";
import { simularTurnos } from "@/compartido/horario/simulacion.api";
import { LUNES_DE_PRUEBA, simulacionDePrueba } from "@/compartido/horario/simulacion-de-prueba";
import { guardarTarifa } from "../servicios/tarifas.api";
import type { TarifaDelTipo } from "../servicios/tarifas";
import { TarjetaDeTarifa } from "./tarjeta-de-tarifa";

const navegar = vi.hoisted(() => ({ refresh: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => navegar }));
vi.mock("../servicios/tarifas.api", () => ({ guardarTarifa: vi.fn() }));
vi.mock("@/compartido/horario/simulacion.api", () => ({ simularTurnos: vi.fn() }));

const VIGENTE = {
  precioDia: "50.00",
  precioNoche: "100.00",
  duracionDelTurnoHoras: 3,
  ofreceTurnoCorto: false,
  guardadaEn: "2026-11-23T01:30:00.000Z",
  guardadaPor: "Valeria León",
};

const MARTES = { ...LUNES_DE_PRUEBA, sinTurno: undefined };

/** El horario en edición que comparte la pantalla con la tarjeta. */
function ConHorario() {
  const { publicarHorario } = useBorrador();
  useEffect(() => publicarHorario({ inicioDeLaNoche: "18:00", dias: [{ dia: "LUNES", abierto: true, abre: "08:00", cierra: "22:00" }] }), [publicarHorario]);
  return null;
}

function mostrar(cambios: Partial<TarifaDelTipo> = {}) {
  const tarifa: TarifaDelTipo = { tipo: "FUTBOL_7", vigente: VIGENTE, historial: [VIGENTE], ...cambios };
  render(
    <ProveedorDelBorrador>
      <ConHorario />
      <TarjetaDeTarifa tarifa={tarifa} />
    </ProveedorDelBorrador>,
  );
}

const duracion = () => screen.getByRole("group", { name: "Cada turno dura" });

describe("TarjetaDeTarifa", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(simularTurnos).mockResolvedValue({ tipo: "simulado", simulacion: simulacionDePrueba("FUTBOL_7", { LUNES: LUNES_DE_PRUEBA, MARTES }) });
  });

  it("muestra la tarifa vigente, quién la guardó y desde cuándo", () => {
    mostrar();

    expect(screen.getByRole("heading", { name: "Fútbol 7" })).toBeInTheDocument();
    expect(screen.getByLabelText(/^Precio de día/)).toHaveValue("50.00");
    expect(screen.getByLabelText(/^Precio de noche/)).toHaveValue("100.00");
    expect(duracion()).toHaveTextContent("3 horas");
    expect(screen.getByRole("radio", { name: "No se ofrece" })).toBeChecked();
    expect(screen.getByText(/Vigente desde/)).toHaveTextContent("Vigente desde 22 nov 2026, 20:30 · por Valeria León");
  });

  it("avisa cuando el tipo todavía no tiene tarifa", () => {
    mostrar({ tipo: "FUTBOL_5", vigente: undefined, historial: [] });

    expect(screen.getByText(/Todavía no tiene tarifa/)).toBeInTheDocument();
    expect(screen.getByLabelText(/^Precio de día/)).toHaveValue("");
  });

  it("cuenta los turnos de cada día según el server y marca el día con rato sin turno", async () => {
    mostrar();

    const lunes = await screen.findByRole("listitem", { name: "Lunes: 4 turnos; de 20:00 a 22:00 sin turno" });
    expect(lunes).toHaveTextContent("Lun4");
    expect(screen.getByRole("listitem", { name: "Martes: 4 turnos" })).toBeInTheDocument();
    expect(screen.getByRole("listitem", { name: "Miércoles: cerrado" })).toBeInTheDocument();
  });

  it("la duración se cambia con los botones y se pide de nuevo la cuenta al server", async () => {
    mostrar();
    await screen.findByRole("list", { name: "Turnos por día" });

    await userEvent.click(within(duracion()).getByRole("button", { name: "Una hora menos" }));

    expect(duracion()).toHaveTextContent("2 horas");
    await waitFor(() => expect(vi.mocked(simularTurnos).mock.lastCall?.[0].tarifas[0]).toMatchObject({ duracionDelTurno: "2" }));
  });

  it("un tipo sin tarifa válida pide completarla para contar los turnos", () => {
    mostrar({ tipo: "FUTBOL_5", vigente: undefined, historial: [] });

    expect(screen.getByText("Completa la tarifa para contar los turnos de cada día.")).toBeInTheDocument();
  });

  it("no deja guardar un monto en cero y explica por qué", async () => {
    const usuario = userEvent.setup();
    mostrar();

    await usuario.clear(screen.getByLabelText(/^Precio de día/));
    await usuario.type(screen.getByLabelText(/^Precio de día/), "0");
    await usuario.click(screen.getByRole("button", { name: "Guardar tarifa de fútbol 7" }));

    expect(await screen.findByText("El monto debe ser mayor que cero.")).toBeInTheDocument();
    expect(guardarTarifa).not.toHaveBeenCalled();
  });

  it("guarda con la opción del turno corto y avisa que las reservas ya hechas no cambian", async () => {
    vi.mocked(guardarTarifa).mockResolvedValue({ tipo: "guardada", cambio: true });
    const usuario = userEvent.setup();
    mostrar();

    await usuario.clear(screen.getByLabelText(/^Precio de noche/));
    await usuario.type(screen.getByLabelText(/^Precio de noche/), "120");
    await usuario.click(screen.getByRole("radio", { name: /Se ofrece como turno corto/ }));
    await usuario.click(screen.getByRole("button", { name: "Guardar tarifa de fútbol 7" }));

    expect(guardarTarifa).toHaveBeenCalledWith("FUTBOL_7", {
      precioDia: "50.00",
      precioNoche: "120",
      duracionDelTurno: "3",
      ofreceTurnoCorto: true,
    });
    expect(await screen.findByRole("status")).toHaveTextContent("las reservas ya hechas mantienen su precio");
    await waitFor(() => expect(navegar.refresh).toHaveBeenCalled());
  });

  it("avisa cuando no había nada que cambiar", async () => {
    vi.mocked(guardarTarifa).mockResolvedValue({ tipo: "guardada", cambio: false });
    mostrar();

    await userEvent.click(screen.getByRole("button", { name: "Guardar tarifa de fútbol 7" }));

    expect(await screen.findByRole("status")).toHaveTextContent("No había cambios");
  });
});
