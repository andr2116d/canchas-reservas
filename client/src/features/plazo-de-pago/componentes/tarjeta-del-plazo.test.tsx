import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { guardarPlazo } from "../servicios/plazo-de-pago.api";
import type { PlazoConsultado } from "../servicios/plazo-de-pago";
import { TarjetaDelPlazo } from "./tarjeta-del-plazo";

const navegar = vi.hoisted(() => ({ refresh: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => navegar }));
vi.mock("../servicios/plazo-de-pago.api", () => ({ guardarPlazo: vi.fn() }));

const VIGENTE = { minutos: 30, guardadaEn: "2026-11-28T15:10:00.000Z", guardadaPor: "Valeria León" };
const ANTERIOR = { minutos: 20, guardadaEn: "2026-11-27T15:10:00.000Z", guardadaPor: "Valeria León" };

function mostrar(consultado: Partial<PlazoConsultado> = {}) {
  render(<TarjetaDelPlazo consultado={{ vigente: VIGENTE, historial: [VIGENTE, ANTERIOR], porDefecto: 15, ...consultado }} />);
}

const campo = () => screen.getByLabelText(/^Minutos para pagar/);
const guardar = () => screen.getByRole("button", { name: "Guardar plazo" });

describe("TarjetaDelPlazo", () => {
  beforeEach(() => vi.resetAllMocks());

  it("muestra el plazo vigente, quién lo guardó y cuánto queda guardado un turno", () => {
    mostrar();

    expect(screen.getByRole("heading", { name: "Plazo para pagar el adelanto" })).toBeInTheDocument();
    expect(campo()).toHaveValue("30");
    expect(screen.getByText(/Vigente desde/)).toHaveTextContent("por Valeria León");
    expect(screen.getByText("Un turno separado queda guardado 30 minutos, o hasta que empiece si es antes.")).toBeInTheDocument();
  });

  it("sin plazo guardado dice que rigen 15 minutos por defecto", () => {
    mostrar({ vigente: undefined, historial: [] });

    expect(campo()).toHaveValue("15");
    expect(screen.getByText("Rige el plazo por defecto: 15 minutos.")).toBeInTheDocument();
  });

  it("solo deja escribir números y escribe las horas para leerlas sin calcular", async () => {
    const usuario = userEvent.setup();
    mostrar();

    await usuario.clear(campo());
    await usuario.type(campo(), "9a0m");

    expect(campo()).toHaveValue("90");
    expect(screen.getByText("Un turno separado queda guardado 1 h 30 min, o hasta que empiece si es antes.")).toBeInTheDocument();
    await usuario.clear(campo());
    await usuario.type(campo(), "1440");
    expect(screen.getByText("Un turno separado queda guardado 24 h, o hasta que empiece si es antes.")).toBeInTheDocument();
  });

  it("no guarda minutos fuera de 1 a 1440 y dice por qué", async () => {
    const usuario = userEvent.setup();
    mostrar();

    await usuario.clear(campo());
    await usuario.type(campo(), "1441");
    await usuario.click(guardar());

    expect(await screen.findByText("Usa un número entero de minutos, de 1 a 1440.")).toBeInTheDocument();
    expect(guardarPlazo).not.toHaveBeenCalled();
  });

  it("guarda, avisa que rige para las reservas nuevas y refresca", async () => {
    const usuario = userEvent.setup();
    vi.mocked(guardarPlazo).mockResolvedValue({ tipo: "guardado", cambio: true });
    mostrar();

    await usuario.clear(campo());
    await usuario.type(campo(), "45");
    await usuario.click(guardar());

    expect(guardarPlazo).toHaveBeenCalledWith({ minutos: "45" });
    expect(await screen.findByRole("status")).toHaveTextContent("Plazo guardado. Rige para las reservas nuevas; las ya separadas vencen a su hora.");
    expect(navegar.refresh).toHaveBeenCalled();
  });

  it("guardar el mismo valor avisa que no había cambios", async () => {
    const usuario = userEvent.setup();
    vi.mocked(guardarPlazo).mockResolvedValue({ tipo: "guardado", cambio: false });
    mostrar();

    await usuario.click(guardar());

    expect(await screen.findByRole("status")).toHaveTextContent("No había cambios: el plazo sigue igual.");
  });

  it("muestra junto al campo el error que devuelve el server", async () => {
    const usuario = userEvent.setup();
    vi.mocked(guardarPlazo).mockResolvedValue({ tipo: "datos-rechazados", errores: { minutos: "Usa un número entero de minutos, de 1 a 1440." } });
    mostrar();

    await usuario.click(guardar());

    expect(await screen.findByText("Usa un número entero de minutos, de 1 a 1440.")).toBeInTheDocument();
  });

  it("pliega los plazos anteriores con sus minutos", async () => {
    const usuario = userEvent.setup();
    mostrar();

    await usuario.click(screen.getByText("Plazos anteriores (1)"));

    expect(screen.getByText("20 min")).toBeVisible();
  });
});
