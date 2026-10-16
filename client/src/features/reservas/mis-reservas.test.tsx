import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, cleanup, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { EstadoReserva, ReservaJugador } from "./api";
import { PantallaReservas } from "./components/mis-reservas";

const socket = vi.hoisted(() => {
  const listeners = new Map<string, Set<(payload?: unknown) => void>>();
  return {
    on: vi.fn((evento: string, cb: (payload?: unknown) => void) => {
      if (!listeners.has(evento)) listeners.set(evento, new Set());
      listeners.get(evento)!.add(cb);
    }),
    off: vi.fn((evento: string, cb: (payload?: unknown) => void) => {
      listeners.get(evento)?.delete(cb);
    }),
    emitir(evento: string, payload?: unknown) {
      listeners.get(evento)?.forEach((cb) => cb(payload));
    },
  };
});

vi.mock("@/lib/socket", () => ({ obtenerSocket: () => socket }));

function reserva(id: number, estado: EstadoReserva, extra: Partial<ReservaJugador> = {}): ReservaJugador {
  return {
    id,
    codigo: `LP00000${id}`,
    fecha: "2026-10-20",
    horaInicio: "18:00",
    horaFin: "19:00",
    estado,
    cancha: { id: 2, nombre: "Cancha 2" },
    valorTurno: 80,
    adelantoMinimo: 40,
    adelantoPagado: 0,
    saldoPendiente: 80,
    ...extra,
  };
}

function tarjetas() {
  return within(screen.getByRole("list")).getAllByRole("listitem");
}

function montos(tarjeta: HTMLElement) {
  return Object.fromEntries(
    within(tarjeta)
      .queryAllByRole("term")
      .map((termino) => [termino.textContent, termino.nextElementSibling?.textContent]),
  );
}

function responder(status: number, cuerpo: unknown) {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify(cuerpo), { status })));
}

function renderPantalla() {
  const cliente = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={cliente}>
      <PantallaReservas />
    </QueryClientProvider>,
  );
}

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("PantallaReservas", () => {
  it("mientras carga muestra el aviso de carga", () => {
    vi.stubGlobal("fetch", vi.fn(() => new Promise<Response>(() => {})));
    renderPantalla();

    expect(screen.getByText("Cargando tus reservas…")).toBeTruthy();
    expect(screen.queryByRole("list")).toBeNull();
  });

  it("ante un error muestra el mensaje del server", async () => {
    responder(500, { statusCode: 500, message: "No se pudieron cargar tus reservas", errores: {} });
    renderPantalla();

    await screen.findByText("No se pudieron cargar tus reservas");
    expect(screen.queryByText("Cargando tus reservas…")).toBeNull();
    expect(screen.queryByRole("list")).toBeNull();
  });

  it("sin reservas muestra el estado vacío", async () => {
    responder(200, []);
    renderPantalla();

    await screen.findByText("No tienes reservas todavía");
    expect(screen.queryByRole("list")).toBeNull();
  });

  it("cada reserva muestra su código, fecha, hora y cancha", async () => {
    responder(200, [reserva(1, "PENDIENTE_PAGO", { codigo: "LP7K2M9Q", fecha: "2026-10-21", horaInicio: "20:00", horaFin: "21:00" })]);
    renderPantalla();

    await screen.findByText("LP7K2M9Q");
    const [tarjeta] = tarjetas();
    expect(within(tarjeta).getByText("21/10/2026 · 20:00–21:00")).toBeTruthy();
    expect(within(tarjeta).getByText("Cancha 2")).toBeTruthy();
  });

  it("cada tarjeta muestra el valor del turno, el adelanto pagado y el saldo por pagar", async () => {
    responder(200, [
      reserva(1, "CONFIRMADA", { valorTurno: 55.05, adelantoMinimo: 27.53, adelantoPagado: 27.53, saldoPendiente: 27.52 }),
    ]);
    renderPantalla();

    await screen.findByText("LP000001");
    expect(montos(tarjetas()[0])).toEqual({
      "Valor del turno": "S/ 55.05",
      "Adelanto pagado": "S/ 27.53",
      "Saldo por pagar": "S/ 27.52",
    });
  });

  it("una reserva pagada completa muestra el saldo en cero", async () => {
    responder(200, [reserva(1, "CONFIRMADA", { adelantoPagado: 40, saldoPendiente: 0 })]);
    renderPantalla();

    await screen.findByText("LP000001");
    expect(montos(tarjetas()[0])).toEqual({
      "Valor del turno": "S/ 80.00",
      "Adelanto pagado": "S/ 40.00",
      "Saldo por pagar": "S/ 0.00",
    });
  });

  it("en pendiente de pago destaca lo que falta para completar el adelanto", async () => {
    responder(200, [
      reserva(1, "PENDIENTE_PAGO", { valorTurno: 55.05, adelantoMinimo: 27.53, adelantoPagado: 10, saldoPendiente: 45.05 }),
    ]);
    renderPantalla();

    await screen.findByText("LP000001");
    expect(within(tarjetas()[0]).getByText("Falta para el adelanto: S/ 17.53")).toBeTruthy();
  });

  it("en pendiente de pago sin nada pagado falta todo el adelanto", async () => {
    responder(200, [reserva(1, "PENDIENTE_PAGO")]);
    renderPantalla();

    await screen.findByText("LP000001");
    expect(within(tarjetas()[0]).getByText("Falta para el adelanto: S/ 40.00")).toBeTruthy();
  });

  it.each<[EstadoReserva, Partial<ReservaJugador>]>([
    ["PENDIENTE_PAGO", { adelantoPagado: 40, saldoPendiente: 40 }],
    ["PENDIENTE_VALIDACION", {}],
    ["CONFIRMADA", { adelantoPagado: 40, saldoPendiente: 40 }],
    ["CANCELADA", {}],
    ["EXPIRADA", {}],
  ])("en %s con ese pago no muestra lo que falta para el adelanto", async (estado, extra) => {
    responder(200, [reserva(1, estado, extra)]);
    renderPantalla();

    await screen.findByText("LP000001");
    expect(within(tarjetas()[0]).queryByText(/Falta para el adelanto/)).toBeNull();
  });

  it.each<EstadoReserva>(["CANCELADA", "EXPIRADA"])(
    "una reserva %s sin pagos solo muestra el valor del turno",
    async (estado) => {
      responder(200, [reserva(1, estado)]);
      renderPantalla();

      await screen.findByText("LP000001");
      expect(montos(tarjetas()[0])).toEqual({ "Valor del turno": "S/ 80.00" });
    },
  );

  it.each<EstadoReserva>(["CANCELADA", "EXPIRADA"])(
    "una reserva %s con pagos muestra lo pagado y no el saldo como deuda",
    async (estado) => {
      responder(200, [reserva(1, estado, { valorTurno: 55.05, adelantoPagado: 27.53, saldoPendiente: 27.52 })]);
      renderPantalla();

      await screen.findByText("LP000001");
      expect(montos(tarjetas()[0])).toEqual({
        "Valor del turno": "S/ 55.05",
        Pagado: "S/ 27.53",
      });
      expect(within(tarjetas()[0]).queryByText("Saldo por pagar")).toBeNull();
    },
  );

  it.each<[EstadoReserva, string]>([
    ["PENDIENTE_PAGO", "Pendiente de pago"],
    ["PENDIENTE_VALIDACION", "Pendiente de validación"],
    ["CONFIRMADA", "Confirmada"],
    ["EN_JUEGO", "En juego"],
    ["FINALIZADA", "Finalizada"],
    ["CANCELADA", "Cancelada"],
    ["EXPIRADA", "Expirada"],
    ["AUSENTE", "Ausente"],
  ])("el estado %s se muestra con la etiqueta %s", async (estado, etiqueta) => {
    responder(200, [reserva(1, estado)]);
    renderPantalla();

    await screen.findByText("LP000001");
    expect(within(tarjetas()[0]).getByText(etiqueta)).toBeTruthy();
  });

  it("respeta el orden que llega de la API", async () => {
    responder(200, [
      reserva(3, "CONFIRMADA", { codigo: "LPPRIMER0", fecha: "2026-10-22" }),
      reserva(1, "PENDIENTE_PAGO", { codigo: "LPSEGUND0", fecha: "2026-10-25" }),
      reserva(2, "FINALIZADA", { codigo: "LPTERCER0", fecha: "2026-10-01" }),
    ]);
    renderPantalla();

    await screen.findByText("LPPRIMER0");
    expect(tarjetas().map((t) => within(t).getByText(/^LP/).textContent)).toEqual([
      "LPPRIMER0",
      "LPSEGUND0",
      "LPTERCER0",
    ]);
  });

  it("cuando recepción confirma el pago la reserva pasa a confirmada sin recargar", async () => {
    const pendiente = reserva(1, "PENDIENTE_PAGO");
    const confirmada = reserva(1, "CONFIRMADA", { adelantoPagado: 40, saldoPendiente: 40 });
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response(JSON.stringify([pendiente]), { status: 200 }))
      .mockResolvedValue(new Response(JSON.stringify([confirmada]), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    renderPantalla();

    expect(await screen.findByText("Pendiente de pago")).toBeTruthy();
    act(() => socket.emitir("turnos:actualizados", { fecha: "2026-10-20", canchaId: 2 }));

    expect(await screen.findByText("Confirmada")).toBeTruthy();
    await waitFor(() => expect(montos(tarjetas()[0])["Adelanto pagado"]).toBe("S/ 40.00"));
    expect(screen.queryByText(/Falta para el adelanto/)).toBeNull();
  });
});
