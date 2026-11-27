import { act, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { mapaDePrueba } from "../../../../test/features/disponibilidad/mapa-de-prueba";
import { escucharCambios } from "../servicios/avisos-de-cambios";
import type { MapaDelDia } from "../servicios/disponibilidad";
import { consultarMapa } from "../servicios/disponibilidad.api";
import { MapaDeTurnos } from "./mapa-de-turnos";
import type { ContextoDelMapa } from "./tu-turno";

vi.mock("../servicios/disponibilidad.api", () => ({ consultarMapa: vi.fn() }));
vi.mock("../servicios/avisos-de-cambios", () => ({ escucharCambios: vi.fn() }));

function mostrar(mapa: MapaDelDia = mapaDePrueba(), contexto: ContextoDelMapa = "publico") {
  vi.mocked(consultarMapa).mockResolvedValue({ tipo: "consultado", mapa });
  render(<MapaDeTurnos contexto={contexto} />);
}

const fila = (hora: string) => screen.getByRole("rowheader", { name: new RegExp(`^${hora}`) }).closest("tr")!;
const tuTurno = () => screen.getByRole("complementary", { name: "Tu turno" });

describe("MapaDeTurnos", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(escucharCambios).mockReturnValue(() => undefined);
  });

  it("muestra cada cancha activa con los turnos del día, su precio y el adelanto mínimo", async () => {
    mostrar();

    expect(await screen.findByRole("columnheader", { name: /Cancha 1/ })).toHaveTextContent("Con luz");
    expect(screen.getByRole("columnheader", { name: /Cancha 2/ })).toHaveTextContent("Solo luz natural");
    expect(fila("18:00")).toHaveTextContent("S/ 80.00");
    expect(fila("18:00")).toHaveTextContent("Adelanto S/ 40.00");
    expect(screen.getByRole("rowheader", { name: "De noche · desde las 18:00" })).toBeInTheDocument();
  });

  it("dice el estado de cada turno y solo deja elegir los libres", async () => {
    mostrar();

    await screen.findByRole("table");
    expect(within(fila("17:00")).getByLabelText(/Cancha 2, de 17:00 a 18:00: pendiente/)).toBeInTheDocument();
    expect(within(fila("19:00")).getByText("Mantenimiento")).toBeInTheDocument();
    expect(within(fila("20:00")).getByText("Ocupado")).toBeInTheDocument();
    expect(within(fila("18:00")).getByText("Sin luz")).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: /: libre/ })).toHaveLength(2);
  });

  it("un tipo de cancha sin tarifa dice que todavía no tiene precio", async () => {
    const usuario = userEvent.setup();
    mostrar();

    await usuario.click(await screen.findByRole("tab", { name: "Fútbol 7 · 0 libres" }));

    expect(screen.getByText("Fútbol 7 todavía no tiene precio: sus turnos aún no se pueden reservar.")).toBeInTheDocument();
  });

  it("al elegir un turno libre muestra su precio, el adelanto y cómo reservarlo", async () => {
    const usuario = userEvent.setup();
    mostrar();

    await usuario.click(await screen.findByRole("button", { name: /Cancha 1, de 18:00 a 19:00: libre/ }));

    expect(tuTurno()).toHaveTextContent("Cancha 118:00–19:00");
    expect(tuTurno()).toHaveTextContent("S/ 80.00");
    expect(tuTurno()).toHaveTextContent("Lo separas con S/ 40.00 de adelanto (50 %)");
    const turno = "cancha=1&fecha=2026-11-25&desde=18%3A00";
    expect(within(tuTurno()).getByRole("link", { name: "Ingresar para reservar" })).toHaveAttribute("href", `/iniciar-sesion?${turno}`);
    expect(within(tuTurno()).getByRole("link", { name: "Crear cuenta" })).toHaveAttribute("href", `/registro?${turno}`);
  });

  it("dentro del panel del jugador lleva a confirmar el turno elegido, sin pedir iniciar sesión", async () => {
    const usuario = userEvent.setup();
    mostrar(mapaDePrueba(), "jugador");

    await usuario.click(await screen.findByRole("button", { name: /Cancha 1, de 18:00 a 19:00: libre/ }));

    expect(within(tuTurno()).queryByRole("link", { name: "Ingresar para reservar" })).not.toBeInTheDocument();
    expect(within(tuTurno()).getByRole("link", { name: "Reservar Cancha 1 · 18:00–19:00" })).toHaveAttribute(
      "href",
      "/inicio/reservar/confirmar?cancha=1&fecha=2026-11-25&desde=18%3A00",
    );
  });

  it("si el turno elegido se ocupa mientras se mira, lo quita y avisa", async () => {
    const usuario = userEvent.setup();
    mostrar();
    await usuario.click(await screen.findByRole("button", { name: /Cancha 1, de 18:00 a 19:00: libre/ }));
    const ocupado = mapaDePrueba();
    const tipo = ocupado.tipos[0];
    if (tipo.estado === "CON_TURNOS") tipo.turnos[2].canchas[0].estado = "PENDIENTE";
    vi.mocked(consultarMapa).mockResolvedValue({ tipo: "consultado", mapa: ocupado });

    await act(async () => vi.mocked(escucharCambios).mock.lastCall![0].alCambiar());

    expect(await screen.findByText("El turno que elegiste ya no está libre. Elige otro.")).toBeInTheDocument();
    expect(within(fila("18:00")).getByText("Pendiente")).toBeInTheDocument();
  });

  it("hoy pliega los turnos que ya empezaron y los muestra si se pide", async () => {
    const usuario = userEvent.setup();
    mostrar(mapaDePrueba({ ahora: "2026-11-25T22:30:00.000Z" }));

    await usuario.click(await screen.findByRole("button", { name: "Mostrar los 2 turnos que ya empezaron" }));

    expect(within(fila("16:00")).getByText("Ya empezó")).toBeInTheDocument();
  });

  it("consulta la fecha que se elige, desde hoy y hasta la última que permite el server", async () => {
    const usuario = userEvent.setup();
    mostrar();

    await usuario.click(await screen.findByRole("button", { name: "jueves, 26 de noviembre" }));

    await waitFor(() => expect(consultarMapa).toHaveBeenLastCalledWith("2026-11-26", expect.any(AbortSignal)));
    expect(screen.getByRole("button", { name: "Días anteriores" })).toBeDisabled();
    expect(screen.getByText(/puedes ver hasta el 24 de diciembre/)).toBeInTheDocument();
  });

  it("si el local no abre ese día lo dice en vez de mostrar turnos", async () => {
    mostrar(mapaDePrueba({ local: "CERRADO", tipos: [] }));

    expect(await screen.findByText("El local no abre este día. Elige otra fecha.")).toBeInTheDocument();
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
  });

  it("si no se puede cargar el mapa dice qué pasó", async () => {
    vi.mocked(consultarMapa).mockResolvedValue({ tipo: "error", mensaje: "No pudimos conectar con La Previa." });
    render(<MapaDeTurnos contexto="publico" />);

    expect(await screen.findByRole("alert")).toHaveTextContent("No pudimos conectar con La Previa.");
  });
});
