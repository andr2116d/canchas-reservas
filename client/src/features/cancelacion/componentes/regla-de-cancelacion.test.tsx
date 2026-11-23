import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { guardarRegla, simularCancelacion } from "../servicios/cancelacion.api";
import type { ReglaConsultada } from "../servicios/cancelacion";
import { FormularioDeRegla } from "./formulario-de-regla";
import { ProveedorDeLaRegla } from "./proveedor-de-la-regla";
import { SimuladorDeCancelacion } from "./simulador-de-cancelacion";

const navegar = vi.hoisted(() => ({ refresh: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => navegar }));
vi.mock("../servicios/cancelacion.api", () => ({ guardarRegla: vi.fn(), simularCancelacion: vi.fn() }));

const VIGENTE = {
  rangos: [
    { desdeHoras: 2, porcentaje: 100, ofreceCredito: true },
    { desdeHoras: 1, porcentaje: 50, ofreceCredito: false },
    { desdeHoras: 0, porcentaje: 0, ofreceCredito: false },
  ],
  guardadaEn: "2026-11-23T14:10:00.000Z",
  guardadaPor: "Valeria León",
};
const CONSULTADA: ReglaConsultada = { vigente: VIGENTE, historial: [VIGENTE], propuesta: VIGENTE.rangos };

function mostrar(consultada = CONSULTADA) {
  render(
    <ProveedorDeLaRegla>
      <FormularioDeRegla consultada={consultada} />
      <SimuladorDeCancelacion />
    </ProveedorDeLaRegla>,
  );
}

const rango = (numero: number) => screen.getByRole("group", { name: `Rango ${numero}` });
const horasDe = (numero: number) => within(rango(numero)).getByRole("textbox", { name: "Horas antes" });
const porcentajeDe = (numero: number) => within(rango(numero)).getByRole("textbox", { name: "Porcentaje que se devuelve" });

describe("Regla de cancelación", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(simularCancelacion).mockResolvedValue({
      tipo: "simulada",
      compensacion: { desdeHoras: 1, porcentaje: 50, formas: ["DINERO"], devolucionDelAnticipo: "25.00", retenido: "25.00", excedente: "50.00", totalADevolver: "75.00" },
    });
  });

  it("muestra cada rango de la regla vigente; el de 0 horas siempre está y no se quita", () => {
    mostrar();

    expect(horasDe(1)).toHaveValue("2");
    expect(porcentajeDe(2)).toHaveValue("50");
    expect(within(rango(1)).getByRole("checkbox", { name: "También como crédito" })).toBeChecked();
    expect(horasDe(3)).toHaveAttribute("readonly");
    expect(within(rango(3)).queryByRole("button", { name: "Quitar" })).not.toBeInTheDocument();
    expect(within(rango(3)).getByText("Se retiene el anticipo")).toBeInTheDocument();
    expect(screen.getByText(/Vigente desde/)).toHaveTextContent("Vigente desde 23 nov 2026, 09:10 · por Valeria León");
  });

  it("muestra plegadas las reglas anteriores con sus valores, quién y cuándo", () => {
    const anterior = { ...VIGENTE, rangos: [{ desdeHoras: 0, porcentaje: 100, ofreceCredito: false }], guardadaEn: "2026-11-22T14:10:00.000Z" };
    mostrar({ ...CONSULTADA, historial: [VIGENTE, anterior] });

    expect(screen.getByText("Reglas anteriores (1)")).toBeInTheDocument();
    expect(screen.getByText("0 h: 100 %")).toBeInTheDocument();
  });

  it("agrega y quita rangos", async () => {
    const usuario = userEvent.setup();
    mostrar();

    await usuario.click(screen.getByRole("button", { name: "Agregar rango" }));
    expect(screen.getAllByRole("group", { name: /^Rango / })).toHaveLength(4);
    await usuario.click(within(rango(1)).getByRole("button", { name: "Quitar" }));
    expect(screen.getAllByRole("group", { name: /^Rango / })).toHaveLength(3);
  });

  it("no deja guardar horas o porcentajes vacíos o negativos", async () => {
    const usuario = userEvent.setup();
    mostrar();

    await usuario.clear(porcentajeDe(2));
    await usuario.type(horasDe(1), "{backspace}-");
    await usuario.click(screen.getByRole("button", { name: "Guardar regla" }));

    expect(await screen.findByText("Ingresa el porcentaje que se devuelve.")).toBeInTheDocument();
    expect(screen.getByText("Ingresa desde cuántas horas antes rige.")).toBeInTheDocument();
    expect(guardarRegla).not.toHaveBeenCalled();
  });

  it("guarda la regla y avisa que las reservas ya hechas conservan la suya", async () => {
    vi.mocked(guardarRegla).mockResolvedValue({ tipo: "guardada", cambio: true });
    const usuario = userEvent.setup();
    mostrar();

    await usuario.clear(porcentajeDe(2));
    await usuario.type(porcentajeDe(2), "40");
    await usuario.click(screen.getByRole("button", { name: "Guardar regla" }));

    expect(vi.mocked(guardarRegla).mock.calls[0][0].rangos[1]).toEqual({ desdeHoras: "1", porcentaje: "40", ofreceCredito: false });
    expect(await screen.findByText(/las reservas ya hechas conservan la suya/)).toBeInTheDocument();
    expect(navegar.refresh).toHaveBeenCalled();
  });

  it("marca en su rango lo que el server rechaza al guardar", async () => {
    vi.mocked(guardarRegla).mockResolvedValue({ tipo: "datos-rechazados", errores: { "rangos.0.porcentaje": "Debe devolver algo." } });
    mostrar();

    await userEvent.click(screen.getByRole("button", { name: "Guardar regla" }));

    expect(await within(rango(1)).findByText("Debe devolver algo.")).toBeInTheDocument();
  });

  it("el simulador muestra lo que recibiría el jugador según el server", async () => {
    mostrar();

    const simulador = screen.getByRole("region", { name: "Si alguien cancela…" });
    expect(await within(simulador).findByText("S/ 75.00")).toBeInTheDocument();
    expect(within(simulador).getByText("Dinero")).toBeInTheDocument();
    expect(vi.mocked(simularCancelacion).mock.lastCall?.[0]).toMatchObject({ anticipo: "50.00", pagado: "50.00", minutosDeAnticipacion: 90 });
  });

  it("mientras editas, la tarjeta dice qué regla de fondo no se cumple", async () => {
    vi.mocked(simularCancelacion).mockResolvedValue({
      tipo: "rechazada",
      errores: { "rangos.0.porcentaje": "Debe devolver algo: no se permite negar la devolución en todos los casos." },
    });
    mostrar();

    expect(await screen.findByRole("alert")).toHaveTextContent("Debe devolver algo: no se permite negar la devolución en todos los casos.");
  });
});
