import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
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
});
