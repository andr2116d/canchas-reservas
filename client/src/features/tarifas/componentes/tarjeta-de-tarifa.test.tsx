import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { VistaDeHorario } from "@/compartido/horario/horario";
import { guardarTarifa } from "../servicios/tarifas.api";
import type { TarifaDelTipo } from "../servicios/tarifas";
import { TarjetaDeTarifa } from "./tarjeta-de-tarifa";

const navegar = vi.hoisted(() => ({ refresh: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => navegar }));
vi.mock("../servicios/tarifas.api", () => ({ guardarTarifa: vi.fn() }));

const VIGENTE = {
  precioDia: "50.00",
  precioNoche: "100.00",
  duracionDelTurnoHoras: 3,
  ofreceTurnoCorto: false,
  guardadaEn: "2026-11-23T01:30:00.000Z",
  guardadaPor: "Valeria León",
};

const HORARIO: VistaDeHorario = {
  inicioDeLaNoche: "18:00",
  dias: [
    { dia: "LUNES", abierto: true, abre: "08:00", cierra: "22:00" },
    { dia: "MARTES", abierto: true, abre: "08:00", cierra: "20:00" },
    { dia: "DOMINGO", abierto: false },
  ],
  guardadoEn: "2026-11-23T01:30:00.000Z",
  guardadoPor: "Valeria León",
};

function unaTarifa(cambios: Partial<TarifaDelTipo> = {}): TarifaDelTipo {
  return { tipo: "FUTBOL_7", vigente: VIGENTE, historial: [VIGENTE], ...cambios };
}

const resumen = () => screen.getByRole("list", { name: "Turnos de cada día" });

describe("TarjetaDeTarifa", () => {
  beforeEach(() => vi.resetAllMocks());

  it("muestra la tarifa vigente, quién la guardó y desde cuándo", () => {
    render(<TarjetaDeTarifa tarifa={unaTarifa()} horario={HORARIO} />);

    expect(screen.getByRole("heading", { name: "Fútbol 7" })).toBeInTheDocument();
    expect(screen.getByLabelText(/^Precio de día/)).toHaveValue("50.00");
    expect(screen.getByLabelText(/^Precio de noche/)).toHaveValue("100.00");
    expect(screen.getByLabelText(/^Duración del turno/)).toHaveValue("3");
    expect(screen.getByRole("radio", { name: /No ofrecer ese rato/ })).toBeChecked();
    expect(screen.getByText(/Vigente desde/)).toHaveTextContent("Vigente desde 22 nov 2026, 20:30 · por Valeria León");
  });

  it("avisa cuando el tipo todavía no tiene tarifa", () => {
    render(<TarjetaDeTarifa tarifa={unaTarifa({ tipo: "FUTBOL_5", vigente: undefined, historial: [] })} horario={HORARIO} />);

    expect(screen.getByText(/Todavía no tiene tarifa/)).toBeInTheDocument();
    expect(screen.getByLabelText(/^Precio de día/)).toHaveValue("");
  });

  it("resume los turnos de cada día y el rato que queda sin turno", () => {
    render(<TarjetaDeTarifa tarifa={unaTarifa()} horario={HORARIO} />);

    const dias = within(resumen()).getAllByRole("listitem").map((dia) => dia.textContent);
    expect(dias).toEqual(["Lunes4 turnos · sin turno de 20:00 a 22:00", "Martes4 turnos", "DomingoCerrado"]);
  });

  it("el resumen cambia al elegir ofrecer el rato final como turno corto", async () => {
    render(<TarjetaDeTarifa tarifa={unaTarifa()} horario={HORARIO} />);

    await userEvent.click(screen.getByRole("radio", { name: /Ofrecerlo como turno corto/ }));

    expect(within(resumen()).getAllByRole("listitem")[0]).toHaveTextContent("4 turnos + 1 corto de 20:00 a 22:00");
  });

  it("sin horario guardado pide guardarlo para ver los turnos", () => {
    render(<TarjetaDeTarifa tarifa={unaTarifa()} />);

    expect(screen.getByText("Guarda el horario de atención para ver los turnos de cada día.")).toBeInTheDocument();
  });

  it("no deja guardar un monto en cero y explica por qué", async () => {
    const usuario = userEvent.setup();
    render(<TarjetaDeTarifa tarifa={unaTarifa()} horario={HORARIO} />);

    await usuario.clear(screen.getByLabelText(/^Precio de día/));
    await usuario.type(screen.getByLabelText(/^Precio de día/), "0");
    await usuario.click(screen.getByRole("button", { name: "Guardar tarifa de fútbol 7" }));

    expect(await screen.findByText("El monto debe ser mayor que cero.")).toBeInTheDocument();
    expect(guardarTarifa).not.toHaveBeenCalled();
  });

  it("guarda la tarifa con la opción del turno corto y avisa que rige para las reservas nuevas", async () => {
    vi.mocked(guardarTarifa).mockResolvedValue({ tipo: "guardada", cambio: true });
    const usuario = userEvent.setup();
    render(<TarjetaDeTarifa tarifa={unaTarifa()} horario={HORARIO} />);

    await usuario.clear(screen.getByLabelText(/^Precio de noche/));
    await usuario.type(screen.getByLabelText(/^Precio de noche/), "120");
    await usuario.click(screen.getByRole("radio", { name: /Ofrecerlo como turno corto/ }));
    await usuario.click(screen.getByRole("button", { name: "Guardar tarifa de fútbol 7" }));

    expect(guardarTarifa).toHaveBeenCalledWith("FUTBOL_7", {
      precioDia: "50.00",
      precioNoche: "120",
      duracionDelTurno: "3",
      ofreceTurnoCorto: true,
    });
    expect(await screen.findByRole("status")).toHaveTextContent("Rige para las reservas nuevas");
    await waitFor(() => expect(navegar.refresh).toHaveBeenCalled());
  });

  it("avisa cuando no había nada que cambiar", async () => {
    vi.mocked(guardarTarifa).mockResolvedValue({ tipo: "guardada", cambio: false });
    render(<TarjetaDeTarifa tarifa={unaTarifa()} horario={HORARIO} />);

    await userEvent.click(screen.getByRole("button", { name: "Guardar tarifa de fútbol 7" }));

    expect(await screen.findByRole("status")).toHaveTextContent("No había cambios");
  });
});
