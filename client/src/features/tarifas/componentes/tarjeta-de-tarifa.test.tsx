import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
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
  guardadaEn: "2026-11-23T01:30:00.000Z",
  guardadaPor: "Valeria León",
};

function unaTarifa(cambios: Partial<TarifaDelTipo> = {}): TarifaDelTipo {
  return {
    tipo: "FUTBOL_7",
    vigente: VIGENTE,
    historial: [VIGENTE],
    ...cambios,
  };
}

describe("TarjetaDeTarifa", () => {
  beforeEach(() => vi.resetAllMocks());

  it("muestra la tarifa vigente, quién la guardó y desde cuándo", () => {
    render(<TarjetaDeTarifa tarifa={unaTarifa()} inicioDeLaNoche="18:00" />);

    expect(
      screen.getByRole("heading", { name: "Fútbol 7" }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/^Precio de día/)).toHaveValue("50.00");
    expect(screen.getByLabelText(/^Precio de noche/)).toHaveValue("100.00");
    expect(screen.getByLabelText(/^Duración del turno/)).toHaveValue("3");
    expect(screen.getByText(/Vigente desde/)).toHaveTextContent(
      "Vigente desde 22 nov 2026, 20:30 · por Valeria León",
    );
  });

  it("indica desde qué hora rige cada precio", () => {
    render(<TarjetaDeTarifa tarifa={unaTarifa()} inicioDeLaNoche="18:00" />);

    expect(screen.getByLabelText(/^Precio de día/)).toHaveAccessibleDescription(
      /Antes de las 18:00/,
    );
    expect(
      screen.getByLabelText(/^Precio de noche/),
    ).toHaveAccessibleDescription(/Desde las 18:00/);
  });

  it("avisa cuando el tipo todavía no tiene tarifa", () => {
    render(
      <TarjetaDeTarifa
        tarifa={unaTarifa({
          tipo: "FUTBOL_5",
          vigente: undefined,
          historial: [],
        })}
        inicioDeLaNoche="18:00"
      />,
    );

    expect(screen.getByText(/Todavía no tiene tarifa/)).toBeInTheDocument();
    expect(screen.getByLabelText(/^Precio de día/)).toHaveValue("");
  });

  it("no deja guardar un monto en cero y explica por qué", async () => {
    const usuario = userEvent.setup();
    render(<TarjetaDeTarifa tarifa={unaTarifa()} inicioDeLaNoche="18:00" />);

    await usuario.clear(screen.getByLabelText(/^Precio de día/));
    await usuario.type(screen.getByLabelText(/^Precio de día/), "0");
    await usuario.click(
      screen.getByRole("button", { name: "Guardar tarifa de fútbol 7" }),
    );

    expect(
      await screen.findByText("El monto debe ser mayor que cero."),
    ).toBeInTheDocument();
    expect(guardarTarifa).not.toHaveBeenCalled();
  });

  it("guarda la tarifa y avisa que rige para las reservas nuevas", async () => {
    vi.mocked(guardarTarifa).mockResolvedValue({
      tipo: "guardada",
      cambio: true,
    });
    const usuario = userEvent.setup();
    render(<TarjetaDeTarifa tarifa={unaTarifa()} inicioDeLaNoche="18:00" />);

    await usuario.clear(screen.getByLabelText(/^Precio de noche/));
    await usuario.type(screen.getByLabelText(/^Precio de noche/), "120");
    await usuario.click(
      screen.getByRole("button", { name: "Guardar tarifa de fútbol 7" }),
    );

    expect(guardarTarifa).toHaveBeenCalledWith("FUTBOL_7", {
      precioDia: "50.00",
      precioNoche: "120",
      duracionDelTurno: "3",
    });
    expect(await screen.findByRole("status")).toHaveTextContent(
      "Rige para las reservas nuevas",
    );
    await waitFor(() => expect(navegar.refresh).toHaveBeenCalled());
  });

  it("avisa cuando no había nada que cambiar", async () => {
    vi.mocked(guardarTarifa).mockResolvedValue({
      tipo: "guardada",
      cambio: false,
    });
    render(<TarjetaDeTarifa tarifa={unaTarifa()} inicioDeLaNoche="18:00" />);

    await userEvent.click(
      screen.getByRole("button", { name: "Guardar tarifa de fútbol 7" }),
    );

    expect(await screen.findByRole("status")).toHaveTextContent(
      "No había cambios",
    );
  });
});
