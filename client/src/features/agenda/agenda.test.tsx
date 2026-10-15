import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { obtenerSocket } from "@/lib/socket";
import { useTurnosEnVivo } from "@/lib/use-turnos-en-vivo";
import { PantallaAgenda } from "./components/agenda";

const TURNO_CON_SALDO = {
  id: 41,
  codigo: "LP-000041",
  horaInicio: "18:00",
  horaFin: "19:00",
  franja: "NOCHE",
  cancha: { id: 2, nombre: "Cancha 2", tamano: "FUTBOL_7" },
  cliente: { id: 7, nombre: "Lucía Ramírez", telefono: "987654321" },
  estado: "CONFIRMADA",
  valorTurno: 80,
  adelantoPagado: 40,
  saldoPendiente: 40,
  acciones: ["CHECK_IN", "MARCAR_AUSENTE", "CANCELAR", "REUBICAR"],
};

vi.mock("@/lib/use-turnos-en-vivo", async (importOriginal) => {
  const original = await importOriginal<typeof import("@/lib/use-turnos-en-vivo")>();
  return { useTurnosEnVivo: vi.fn(original.useTurnosEnVivo) };
});

vi.mock("@/lib/socket", () => {
  let handler: ((payload: unknown) => void) | undefined;
  const socket = {
    on: vi.fn((evento: string, cb: (payload: unknown) => void) => {
      if (evento === "turnos:actualizados") handler = cb;
    }),
    off: vi.fn(),
  };
  return {
    obtenerSocket: () => socket,
    __obtenerHandler: () => handler,
  };
});

const HOY = "2026-10-20";

function turnoAgenda(
  id: number,
  horaInicio: string,
  estado: string,
  saldoPendiente: number,
  acciones: string[],
  cancha = { id: 1, nombre: "Cancha 1", tamano: "FUTBOL_5" },
) {
  const horaFin = `${String(Number(horaInicio.slice(0, 2)) + 1).padStart(2, "0")}:00`;
  return {
    ...TURNO_CON_SALDO,
    id,
    codigo: `LP-${String(id).padStart(6, "0")}`,
    horaInicio,
    horaFin,
    franja: horaInicio >= "18:00" ? "NOCHE" : "DIA",
    cancha,
    cliente: { id, nombre: `Cliente ${id}`, telefono: `98765432${id}` },
    estado,
    adelantoPagado: 80 - saldoPendiente,
    saldoPendiente,
    acciones,
  };
}

const ACCIONES_CONFIRMADA = ["CHECK_IN", "MARCAR_AUSENTE", "CANCELAR", "REUBICAR"];
const CANCHA_2 = { id: 2, nombre: "Cancha 2", tamano: "FUTBOL_7" };

/** Los 8 estados en un mismo día, con una CONFIRMADA con saldo y otra pagada. */
const DIA_COMPLETO = [
  turnoAgenda(1, "08:00", "PENDIENTE_PAGO", 80, ["CANCELAR", "REUBICAR"]),
  turnoAgenda(2, "09:00", "PENDIENTE_VALIDACION", 80, []),
  turnoAgenda(3, "10:00", "CONFIRMADA", 40, ACCIONES_CONFIRMADA, CANCHA_2),
  turnoAgenda(4, "11:00", "CONFIRMADA", 0, ACCIONES_CONFIRMADA),
  turnoAgenda(5, "12:00", "EN_JUEGO", 30, ["REGISTRAR_ADICIONALES", "FINALIZAR"]),
  turnoAgenda(6, "13:00", "FINALIZADA", 0, []),
  turnoAgenda(7, "14:00", "CANCELADA", 80, []),
  turnoAgenda(8, "15:00", "EXPIRADA", 80, []),
  turnoAgenda(9, "16:00", "AUSENTE", 40, []),
];

/** Responde siempre con una respuesta nueva para poder leerla en cada consulta. */
function responderSiempre(turnos: unknown) {
  const fetchMock = vi.fn(async () => new Response(JSON.stringify(turnos), { status: 200 }));
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

function parametrosPedidos(fetchMock: { mock: { calls: unknown[][] } }) {
  return fetchMock.mock.calls.map(([url]) => new URL(String(url), "http://localhost").searchParams);
}

function ultimaConsulta(fetchMock: { mock: { calls: unknown[][] } }) {
  return parametrosPedidos(fetchMock).at(-1)!;
}

/** La fila de la tabla de escritorio que empieza a esa hora. */
function filaDe(hora: string) {
  const tabla = screen.getByRole("table");
  const fila = within(tabla)
    .getAllByRole("row")
    .find((f) => f.textContent?.startsWith(`${hora}–`));
  if (!fila) throw new Error(`No hay fila de las ${hora}`);
  return fila;
}

/** La tarjeta de celular que empieza a esa hora. */
function tarjetaDe(hora: string) {
  const tarjeta = screen
    .getAllByRole("listitem")
    .find((item) => item.textContent?.startsWith(`${hora}–`));
  if (!tarjeta) throw new Error(`No hay tarjeta de las ${hora}`);
  return tarjeta;
}

function botonesDe(elemento: HTMLElement) {
  return within(elemento)
    .queryAllByRole("button")
    .map((boton) => boton.textContent);
}

function listenersActivos(socket: { on: unknown; off: unknown }, evento: string) {
  const contar = (fn: unknown) =>
    (fn as { mock: { calls: [string, unknown][] } }).mock.calls.filter(([e]) => e === evento).length;
  return contar(socket.on) - contar(socket.off);
}

function renderAgenda() {
  const cliente = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={cliente}>
      <PantallaAgenda />
    </QueryClientProvider>,
  );
}

function responderTurnos(turnos: unknown) {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue(
      new Response(JSON.stringify(turnos), { status: 200 }),
    ),
  );
}

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("PantallaAgenda", () => {
  it("muestra el badge de saldo y solo los botones de sus acciones", async () => {
    responderTurnos([TURNO_CON_SALDO]);

    renderAgenda();

    const badges = await screen.findAllByText("Saldo S/ 40.00");
    expect(badges.length).toBeGreaterThan(0);
    for (const accion of ["Check-in", "Marcar ausente", "Cancelar", "Reubicar"]) {
      const botones = screen.getAllByRole("button", { name: accion });
      expect(botones.length).toBeGreaterThan(0);
      for (const boton of botones) {
        expect((boton as HTMLButtonElement).disabled).toBe(true);
        expect(boton.getAttribute("title")).toBe("Disponible en el próximo sprint");
      }
    }
    expect(screen.queryByRole("button", { name: "Finalizar" })).toBeNull();
  });

  it("vuelve a pedir la agenda al recibir turnos:actualizados de la fecha mostrada", async () => {
    responderTurnos([TURNO_CON_SALDO]);

    renderAgenda();

    await screen.findAllByText("Saldo S/ 40.00");
    const primeraUrl = vi.mocked(fetch).mock.calls[0][0] as string;
    const fecha = new URL(primeraUrl, "http://localhost").searchParams.get("fecha");

    const socketModulo = await import("@/lib/socket");
    const handler = (socketModulo as unknown as { __obtenerHandler: () => ((payload: unknown) => void) | undefined }).__obtenerHandler();
    handler?.({ fecha, canchaId: 2 });

    await waitFor(() => {
      expect(vi.mocked(fetch).mock.calls.length).toBeGreaterThan(1);
    });
  });

  it("también refresca cuando el cambio afecta a todas las fechas (fecha: null)", async () => {
    responderTurnos([TURNO_CON_SALDO]);

    renderAgenda();

    await screen.findAllByText("Saldo S/ 40.00");
    const socketModulo = await import("@/lib/socket");
    const handler = (socketModulo as unknown as { __obtenerHandler: () => ((payload: unknown) => void) | undefined }).__obtenerHandler();
    const llamadas = vi.mocked(fetch).mock.calls.length;
    handler?.({ fecha: null, canchaId: 2 });

    await waitFor(() => {
      expect(vi.mocked(fetch).mock.calls.length).toBeGreaterThan(llamadas);
    });
  });

  it("usa useTurnosEnVivo con la clave de la agenda y registra un solo listener", async () => {
    responderTurnos([TURNO_CON_SALDO]);
    const socket = obtenerSocket();
    const antes = listenersActivos(socket, "turnos:actualizados");

    const { unmount } = renderAgenda();
    await screen.findAllByText("Saldo S/ 40.00");

    const fecha = new URL(vi.mocked(fetch).mock.calls[0][0] as string, "http://localhost").searchParams.get("fecha");
    expect(useTurnosEnVivo).toHaveBeenLastCalledWith(fecha, [["agenda", fecha]]);
    expect(listenersActivos(socket, "turnos:actualizados") - antes).toBe(1);

    unmount();
    expect(listenersActivos(socket, "turnos:actualizados") - antes).toBe(0);
  });

  it("no vuelve a pedir la agenda si el evento es de otra fecha", async () => {
    responderTurnos([TURNO_CON_SALDO]);

    renderAgenda();

    await screen.findAllByText("Saldo S/ 40.00");
    const socketModulo = await import("@/lib/socket");
    const handler = (socketModulo as unknown as { __obtenerHandler: () => ((payload: unknown) => void) | undefined }).__obtenerHandler();
    const llamadas = vi.mocked(fetch).mock.calls.length;
    handler?.({ fecha: "1999-01-01", canchaId: 2 });

    await new Promise((resolver) => setTimeout(resolver, 50));
    expect(vi.mocked(fetch).mock.calls.length).toBe(llamadas);
  });
});

describe("PantallaAgenda con fecha fija", () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date(`${HOY}T15:00:00-05:00`));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("los filtros de cancha y estado cambian la consulta", async () => {
    const fetchMock = responderSiempre(DIA_COMPLETO);
    renderAgenda();

    await screen.findByRole("table");
    expect(ultimaConsulta(fetchMock).toString()).toBe(`fecha=${HOY}`);

    const cancha = screen.getByLabelText("Cancha");
    expect(within(cancha).getAllByRole("option").map((o) => o.textContent)).toEqual([
      "Todas las canchas",
      "Cancha 1",
      "Cancha 2",
    ]);
    fireEvent.change(cancha, { target: { value: "2" } });
    await waitFor(() => expect(ultimaConsulta(fetchMock).get("canchaId")).toBe("2"));

    fireEvent.change(screen.getByLabelText("Estado"), { target: { value: "CONFIRMADA" } });
    await waitFor(() => expect(ultimaConsulta(fetchMock).get("estado")).toBe("CONFIRMADA"));
    expect(ultimaConsulta(fetchMock).get("canchaId")).toBe("2");
    expect(ultimaConsulta(fetchMock).get("fecha")).toBe(HOY);

    fireEvent.change(screen.getByLabelText("Cancha"), { target: { value: "" } });
    await waitFor(() => expect(ultimaConsulta(fetchMock).has("canchaId")).toBe(false));
    expect(ultimaConsulta(fetchMock).get("estado")).toBe("CONFIRMADA");
  });

  it("cada estado muestra solo los botones de sus acciones, deshabilitados", async () => {
    responderSiempre(DIA_COMPLETO);
    renderAgenda();

    await screen.findByRole("table");
    const casos: [string, string[]][] = [
      ["08:00", ["Cancelar", "Reubicar"]],
      ["09:00", []],
      ["10:00", ["Check-in", "Marcar ausente", "Cancelar", "Reubicar"]],
      ["11:00", ["Check-in", "Marcar ausente", "Cancelar", "Reubicar"]],
      ["12:00", ["Adicionales", "Finalizar"]],
      ["13:00", []],
      ["14:00", []],
      ["15:00", []],
      ["16:00", []],
    ];

    for (const [hora, esperados] of casos) {
      for (const contenedor of [filaDe(hora), tarjetaDe(hora)]) {
        expect(botonesDe(contenedor)).toEqual(esperados);
        for (const boton of within(contenedor).queryAllByRole("button")) {
          expect((boton as HTMLButtonElement).disabled).toBe(true);
        }
      }
    }
  });

  it("una confirmada con saldo lleva borde y badge de saldo, y una pagada lleva Pagada", async () => {
    responderSiempre(DIA_COMPLETO);
    renderAgenda();

    await screen.findByRole("table");
    const conSaldo = filaDe("10:00");
    const pagada = filaDe("11:00");

    expect(within(conSaldo).getByText("Saldo S/ 40.00")).toBeTruthy();
    expect(within(conSaldo).queryByText("Pagada")).toBeNull();
    expect(conSaldo.className).toContain("border-alerta");

    expect(within(pagada).getByText("Pagada")).toBeTruthy();
    expect(within(pagada).queryByText(/^Saldo S\//)).toBeNull();
    expect(pagada.className).not.toContain("border-alerta");

    expect(within(tarjetaDe("10:00")).getByText("Saldo S/ 40.00")).toBeTruthy();
    expect(within(tarjetaDe("11:00")).getByText("Pagada")).toBeTruthy();
    for (const hora of ["08:00", "12:00", "14:00"]) {
      expect(within(filaDe(hora)).queryByText(/^Saldo S\/|^Pagada$/)).toBeNull();
    }
  });

  it("un día sin reservas muestra el mensaje de vacío", async () => {
    responderSiempre([]);
    renderAgenda();

    expect(await screen.findByText("No hay reservas para este día")).toBeTruthy();
    expect(screen.queryByRole("table")).toBeNull();
  });
});
