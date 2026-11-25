import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { guardarAdelanto } from "../servicios/adelanto.api";
import type { AdelantoConsultado } from "../servicios/adelanto";
import { TarjetaDelAdelanto } from "./tarjeta-del-adelanto";

const navegar = vi.hoisted(() => ({ refresh: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => navegar }));
vi.mock("../servicios/adelanto.api", () => ({ guardarAdelanto: vi.fn() }));

const VIGENTE = { porcentaje: 50, guardadaEn: "2026-11-24T15:10:00.000Z", guardadaPor: "Valeria León" };
const ANTERIOR = { porcentaje: 40, guardadaEn: "2026-11-23T15:10:00.000Z", guardadaPor: "Valeria León" };

function mostrar(consultado: Partial<AdelantoConsultado> = {}) {
  render(<TarjetaDelAdelanto consultado={{ vigente: VIGENTE, historial: [VIGENTE, ANTERIOR], propuesta: 50, ...consultado }} />);
}

const campo = () => screen.getByLabelText(/^Porcentaje del precio del turno/);
const guardar = () => screen.getByRole("button", { name: "Guardar adelanto" });

describe("TarjetaDelAdelanto", () => {
  beforeEach(() => vi.resetAllMocks());

  it("muestra el adelanto vigente, quién lo guardó y desde cuándo", () => {
    mostrar();

    expect(screen.getByRole("heading", { name: "Adelanto mínimo" })).toBeInTheDocument();
    expect(campo()).toHaveValue("50");
    expect(screen.getByText(/Vigente desde/)).toHaveTextContent("por Valeria León");
    expect(screen.getByText("Por cada S/ 100 del turno se pagan S/ 50 para separarlo.")).toBeInTheDocument();
  });

  it("sin adelanto guardado propone el valor del server y avisa que falta guardarlo", () => {
    mostrar({ vigente: undefined, historial: [], propuesta: 50 });

    expect(campo()).toHaveValue("50");
    expect(screen.getByText("Todavía no hay adelanto guardado: guárdalo para que los turnos muestren cuánto se paga al separar.")).toBeInTheDocument();
  });

  it("solo deja escribir números y actualiza el ejemplo", async () => {
    const usuario = userEvent.setup();
    mostrar();

    await usuario.clear(campo());
    await usuario.type(campo(), "3a5%9");

    expect(campo()).toHaveValue("359");
    await usuario.clear(campo());
    await usuario.type(campo(), "30");
    expect(screen.getByText("Por cada S/ 100 del turno se pagan S/ 30 para separarlo.")).toBeInTheDocument();
  });

  it("no guarda un porcentaje fuera de 1 a 100 y dice por qué", async () => {
    const usuario = userEvent.setup();
    mostrar();

    await usuario.clear(campo());
    await usuario.type(campo(), "0");
    await usuario.click(guardar());

    expect(await screen.findByText("Usa un número entero de 1 a 100.")).toBeInTheDocument();
    expect(guardarAdelanto).not.toHaveBeenCalled();
  });

  it("guarda, avisa que rige para las reservas nuevas y refresca", async () => {
    const usuario = userEvent.setup();
    vi.mocked(guardarAdelanto).mockResolvedValue({ tipo: "guardado", cambio: true });
    mostrar();

    await usuario.clear(campo());
    await usuario.type(campo(), "40");
    await usuario.click(guardar());

    expect(guardarAdelanto).toHaveBeenCalledWith({ porcentaje: "40" });
    expect(await screen.findByRole("status")).toHaveTextContent("Adelanto guardado. Rige para las reservas nuevas; las reservas ya hechas no cambian.");
    expect(navegar.refresh).toHaveBeenCalled();
  });

  it("guardar el mismo valor avisa que no había cambios", async () => {
    const usuario = userEvent.setup();
    vi.mocked(guardarAdelanto).mockResolvedValue({ tipo: "guardado", cambio: false });
    mostrar();

    await usuario.click(guardar());

    expect(await screen.findByRole("status")).toHaveTextContent("No había cambios: el adelanto sigue igual.");
  });

  it("muestra junto al campo el error que devuelve el server", async () => {
    const usuario = userEvent.setup();
    vi.mocked(guardarAdelanto).mockResolvedValue({ tipo: "datos-rechazados", errores: { porcentaje: "Usa un número entero de 1 a 100." } });
    mostrar();

    await usuario.click(guardar());

    expect(await screen.findByText("Usa un número entero de 1 a 100.")).toBeInTheDocument();
  });

  it("pliega las versiones anteriores con su porcentaje", async () => {
    const usuario = userEvent.setup();
    mostrar();

    await usuario.click(screen.getByText("Adelantos anteriores (1)"));

    expect(screen.getByText("40 %")).toBeVisible();
  });
});
