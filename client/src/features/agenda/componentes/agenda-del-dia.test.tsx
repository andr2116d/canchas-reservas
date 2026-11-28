import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { agendaDePrueba, turnoDePrueba } from "../../../../test/features/agenda/agenda-de-prueba";
import { escucharCambios } from "@/compartido/disponibilidad/avisos-de-cambios";
import type { AgendaDelDia as Agenda } from "../servicios/agenda";
import { consultarAgenda } from "../servicios/agenda.api";
import { AgendaDelDia } from "./agenda-del-dia";

const navegar = { replace: vi.fn() };
let direccion = new URLSearchParams();
vi.mock("next/navigation", () => ({ useRouter: () => navegar, useSearchParams: () => direccion }));
vi.mock("../servicios/agenda.api", () => ({ consultarAgenda: vi.fn() }));
vi.mock("@/compartido/disponibilidad/avisos-de-cambios", () => ({ escucharCambios: vi.fn() }));

function mostrar(agenda: Agenda = agendaDePrueba()) {
  vi.mocked(consultarAgenda).mockResolvedValue({ tipo: "consultado", valor: agenda });
  render(<AgendaDelDia ruta="/recepcion" />);
}

const turnos = async () => within(await screen.findByRole("list", { name: "Turnos del día" })).getAllByRole("listitem");

describe("AgendaDelDia", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    direccion = new URLSearchParams();
    vi.mocked(escucharCambios).mockReturnValue(() => undefined);
  });

  it("sin fecha en la dirección muestra la agenda de hoy", async () => {
    mostrar();

    expect(await screen.findByRole("heading", { name: /sábado, 28 de noviembre/i })).toBeInTheDocument();
    expect(screen.getByText("Hoy")).toBeInTheDocument();
    expect(consultarAgenda).toHaveBeenCalledWith({}, expect.any(AbortSignal));
  });

  it("muestra los turnos en el orden de la hora de inicio", async () => {
    mostrar(agendaDePrueba({ turnos: [turnoDePrueba({ codigo: "AAA111", desde: "16:00", hasta: "17:00" }), turnoDePrueba({ codigo: "BBB222" })] }));

    const filas = await turnos();

    expect(filas.map((fila) => within(fila).getByText(/–/).textContent)).toEqual(["16:00–17:00", "19:00–20:00"]);
  });

  it("cada turno muestra horario, cancha, cliente, celular, estado, lo pagado y el saldo", async () => {
    mostrar(agendaDePrueba({ turnos: [turnoDePrueba({ pagado: "40.00", saldo: "40.00" })] }));

    const [fila] = await turnos();

    expect(within(fila).getByText("19:00–20:00")).toBeInTheDocument();
    expect(within(fila).getByText("Cancha 1")).toBeInTheDocument();
    expect(within(fila).getByText("Lucía Ramos Vega")).toBeInTheDocument();
    expect(within(fila).getByRole("link", { name: "987 654 321" })).toHaveAttribute("href", "tel:+51987654321");
    expect(within(fila).getByText("Confirmada")).toBeInTheDocument();
    expect(within(fila).getByText("Pagado")).toBeInTheDocument();
    expect(within(fila).getAllByText("S/ 40.00")).toHaveLength(2);
    expect(within(fila).getByText("Saldo")).toBeInTheDocument();
  });

  it("distingue la confirmada con saldo por cobrar de la totalmente pagada", async () => {
    mostrar(
      agendaDePrueba({
        turnos: [
          turnoDePrueba({ codigo: "AAA111" }),
          turnoDePrueba({ codigo: "BBB222", cancha: { id: 2, nombre: "Cancha 2", tipo: "FUTBOL_7" }, pagado: "80.00", saldo: "0.00", pagada: true }),
        ],
      }),
    );

    const [conSaldo, pagada] = await turnos();

    expect(within(conSaldo).getByText("Falta cobrar S/ 80.00")).toBeInTheDocument();
    expect(within(pagada).getByText("Pagada")).toBeInTheDocument();
    expect(within(pagada).queryByText(/Falta cobrar/)).not.toBeInTheDocument();
  });

  it("una reserva por pagar dice hasta qué hora retiene el turno", async () => {
    mostrar(agendaDePrueba({ turnos: [turnoDePrueba({ estado: "PENDIENTE_DE_PAGO", venceEn: "2026-11-28T20:15:00.000Z", acciones: ["CANCELAR", "REUBICAR"] })] }));

    const [fila] = await turnos();

    expect(within(fila).getByText("Por pagar")).toBeInTheDocument();
    expect(within(fila).getByText("Retiene el turno hasta las 15:15")).toBeInTheDocument();
  });

  it("no muestra botones de procesos que todavía no existen, ni en una expirada", async () => {
    mostrar(agendaDePrueba({ turnos: [turnoDePrueba(), turnoDePrueba({ codigo: "EXP000", estado: "EXPIRADA", acciones: [] })] }));

    const filas = await turnos();

    for (const fila of filas) expect(within(fila).queryByRole("link", { name: /check-in|ausente|cancelar|reubicar|finalizar/i })).not.toBeInTheDocument();
  });

  it("al elegir el día siguiente cambia la fecha en la dirección", async () => {
    mostrar();

    await userEvent.click(await screen.findByRole("button", { name: "Día siguiente" }));

    expect(navegar.replace).toHaveBeenCalledWith("/recepcion?fecha=2026-11-29", { scroll: false });
  });

  it("en otro día ofrece volver a hoy", async () => {
    direccion = new URLSearchParams("fecha=2026-11-30&estado=CONFIRMADA");
    mostrar(agendaDePrueba({ fecha: "2026-11-30" }));

    await userEvent.click(await screen.findByRole("button", { name: "Ir a hoy" }));

    expect(navegar.replace).toHaveBeenCalledWith("/recepcion?estado=CONFIRMADA", { scroll: false });
  });

  it("elige una fecha del calendario y no deja pasar de la última que se puede reservar", async () => {
    mostrar();
    const calendario = await screen.findByLabelText("Elegir fecha");

    expect(calendario).toHaveAttribute("max", "2026-12-28");
    fireEvent.change(calendario, { target: { value: "2026-12-05" } });

    expect(navegar.replace).toHaveBeenCalledWith("/recepcion?fecha=2026-12-05", { scroll: false });
  });

  it("en la última fecha no deja avanzar otro día", async () => {
    mostrar(agendaDePrueba({ fecha: "2026-12-28" }));

    expect(await screen.findByRole("button", { name: "Día siguiente" })).toBeDisabled();
  });

  it("filtra por estado con el conteo de cada uno", async () => {
    mostrar(agendaDePrueba({ conteos: { PENDIENTE_DE_PAGO: 2, PENDIENTE_DE_VALIDACION: 0, CONFIRMADA: 1, EN_JUEGO: 0, EXPIRADA: 0 } }));

    const porPagar = await screen.findByRole("link", { name: "Por pagar 2" });

    expect(screen.getByRole("link", { name: "Todos 3" })).toHaveAttribute("aria-current", "page");
    expect(porPagar).toHaveAttribute("href", "/recepcion?estado=PENDIENTE_DE_PAGO");
  });

  it("filtra por cancha", async () => {
    mostrar();

    await userEvent.selectOptions(await screen.findByLabelText("Cancha"), "Cancha 2");

    expect(navegar.replace).toHaveBeenCalledWith("/recepcion?cancha=2", { scroll: false });
  });

  it("sin turnos lo dice y, con filtros, ofrece quitarlos", async () => {
    direccion = new URLSearchParams("estado=EN_JUEGO");
    mostrar(agendaDePrueba({ turnos: [] }));

    expect(await screen.findByText("No hay turnos con estos filtros.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Ver todos los turnos del día" })).toHaveAttribute("href", "/recepcion");
  });

  it("si la consulta falla, dice por qué", async () => {
    vi.mocked(consultarAgenda).mockResolvedValue({ tipo: "error", mensaje: "Elige una cancha de la lista." });

    render(<AgendaDelDia ruta="/recepcion" />);

    expect(await screen.findByRole("alert")).toHaveTextContent("Elige una cancha de la lista.");
  });
});
