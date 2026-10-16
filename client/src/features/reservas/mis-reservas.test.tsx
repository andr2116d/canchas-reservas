import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { EstadoReserva, ReservaJugador } from "./api";
import { PantallaReservas } from "./components/mis-reservas";

function reserva(id: number, estado: EstadoReserva, extra: Partial<ReservaJugador> = {}): ReservaJugador {
  return {
    id,
    codigo: `LP00000${id}`,
    fecha: "2026-10-20",
    horaInicio: "18:00",
    horaFin: "19:00",
    estado,
    cancha: { id: 2, nombre: "Cancha 2" },
    ...extra,
  };
}

function tarjetas() {
  return within(screen.getByRole("list")).getAllByRole("listitem");
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
});
