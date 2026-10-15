import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { PantallaConfirmarReserva } from "./confirmar-reserva";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
  useSearchParams: () => new URLSearchParams(""),
}));

const RESUMEN = {
  cancha: { id: 2, nombre: "Cancha 2", tamano: "FUTBOL_5" },
  fecha: "2026-10-20",
  horaInicio: "18:00",
  horaFin: "19:00",
  franja: "NOCHE",
  valorTurno: 60,
  adelanto: 30,
  saldo: 30,
  creditoDisponible: 10,
  minutosParaPagar: 15,
  regla: { horasAnticipacion: 24, tipoCompensacion: "CREDITO", plazoLimite: "2026-10-19T23:00:00.000Z" },
};

let cliente: QueryClient;

function envolver(contenido: React.ReactNode) {
  return <QueryClientProvider client={cliente}>{contenido}</QueryClientProvider>;
}

function renderPantalla() {
  cliente = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(envolver(<PantallaConfirmarReserva canchaId={2} fecha="2026-10-20" horaInicio="18:00" />));
}

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("PantallaConfirmarReserva", () => {
  it("muestra el resumen y el aviso de tiempo para pagar", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify(RESUMEN), { status: 200 })));

    renderPantalla();

    await screen.findByText(/Tienes 15 minutos/);
    expect(screen.getByText("S/ 60.00")).toBeTruthy();
  });

  it("recalcula el adelanto al usar el crédito", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify(RESUMEN), { status: 200 })));

    renderPantalla();

    await screen.findByText(/Usar mi crédito/);
    const casilla = screen.getByRole("checkbox") as HTMLInputElement;
    casilla.click();

    await waitFor(() => {
      expect(screen.getByText(/Adelanto a pagar: S\/ 20.00/)).toBeTruthy();
    });
  });

  it("muestra el código tras confirmar", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValueOnce(new Response(JSON.stringify(RESUMEN), { status: 200 }))
        .mockResolvedValueOnce(new Response(JSON.stringify({ id: 1, codigo: "LP7K2M9Q", estado: "PENDIENTE_PAGO", venceEn: "2026-10-20T18:15:00.000Z" }), { status: 201 })),
    );

    renderPantalla();

    const boton = await screen.findByRole("button", { name: "Confirmar reserva" });
    boton.click();

    await screen.findByText("LP7K2M9Q");
  });

  it("oculta la casilla de crédito si no hay crédito disponible", async () => {
    const resumen = { ...RESUMEN, creditoDisponible: 0 };
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify(resumen), { status: 200 })));

    renderPantalla();

    await screen.findByText(/Tienes 15 minutos/);
    expect(screen.queryByRole("checkbox")).toBeNull();
    expect(screen.queryByText(/Usar mi crédito/)).toBeNull();
  });

  it("muestra el crédito disponible en la casilla", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify(RESUMEN), { status: 200 })));

    renderPantalla();

    await screen.findByText("Usar mi crédito (S/ 10.00 disponible)");
  });

  it("con crédito mayor al adelanto el adelanto a pagar queda en cero", async () => {
    const resumen = { ...RESUMEN, creditoDisponible: 50 };
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify(resumen), { status: 200 })));

    renderPantalla();

    await screen.findByText(/Usar mi crédito/);
    (screen.getByRole("checkbox") as HTMLInputElement).click();

    await screen.findByText("Adelanto a pagar: S/ 0.00");
  });

  it("recalcula con céntimos sin errores de redondeo", async () => {
    const resumen = { ...RESUMEN, adelanto: 30.3, creditoDisponible: 10.1 };
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify(resumen), { status: 200 })));

    renderPantalla();

    await screen.findByText(/Usar mi crédito/);
    (screen.getByRole("checkbox") as HTMLInputElement).click();

    await screen.findByText("Adelanto a pagar: S/ 20.20");
  });

  it("al desmarcar la casilla deja de mostrar el adelanto recalculado", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify(RESUMEN), { status: 200 })));

    renderPantalla();

    await screen.findByText(/Usar mi crédito/);
    const casilla = screen.getByRole("checkbox") as HTMLInputElement;
    casilla.click();
    await screen.findByText(/Adelanto a pagar/);
    casilla.click();

    await waitFor(() => {
      expect(screen.queryByText(/Adelanto a pagar/)).toBeNull();
    });
  });

  it.each([
    [true, true],
    [false, false],
  ])("con la casilla marcada=%s envía usarCredito=%s", async (marcar, esperado) => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response(JSON.stringify(RESUMEN), { status: 200 }))
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ id: 1, codigo: "LP7K2M9Q", estado: "PENDIENTE_PAGO", venceEn: "2026-10-20T18:15:00.000Z" }), { status: 201 }),
      )
      .mockResolvedValue(new Response(JSON.stringify(RESUMEN), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    renderPantalla();

    await screen.findByText(/Usar mi crédito/);
    if (marcar) (screen.getByRole("checkbox") as HTMLInputElement).click();
    (await screen.findByRole("button", { name: "Confirmar reserva" })).click();

    await screen.findByText("LP7K2M9Q");
    const [url, opciones] = fetchMock.mock.calls[1] as [string, RequestInit];
    expect(url).toMatch(/\/reservas$/);
    expect(JSON.parse(String(opciones.body))).toEqual({
      canchaId: 2,
      fecha: "2026-10-20",
      horaInicio: "18:00",
      usarCredito: esperado,
    });
  });

  it("si la reserva queda confirmada no muestra la cuenta regresiva", async () => {
    const resumen = { ...RESUMEN, creditoDisponible: 50 };
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValueOnce(new Response(JSON.stringify(resumen), { status: 200 }))
        .mockResolvedValueOnce(new Response(JSON.stringify({ id: 1, codigo: "LP7K2M9Q", estado: "CONFIRMADA", venceEn: null }), { status: 201 }))
        .mockResolvedValue(new Response(JSON.stringify(resumen), { status: 200 })),
    );

    renderPantalla();

    await screen.findByText(/Usar mi crédito/);
    (screen.getByRole("checkbox") as HTMLInputElement).click();
    (await screen.findByRole("button", { name: "Confirmar reserva" })).click();

    await screen.findByText("LP7K2M9Q");
    expect(screen.getByRole("heading", { name: "¡Reserva confirmada!" })).toBeTruthy();
    expect(screen.getByText("Pagaste el adelanto con tu crédito.")).toBeTruthy();
    expect(screen.queryByText(/Tiempo para pagar el adelanto/)).toBeNull();
  });

  it("si la reserva queda pendiente muestra la cuenta regresiva", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValueOnce(new Response(JSON.stringify(RESUMEN), { status: 200 }))
        .mockResolvedValueOnce(
          new Response(JSON.stringify({ id: 1, codigo: "LP7K2M9Q", estado: "PENDIENTE_PAGO", venceEn: "2026-10-20T18:15:00.000Z" }), { status: 201 }),
        )
        .mockResolvedValue(new Response(JSON.stringify(RESUMEN), { status: 200 })),
    );

    renderPantalla();

    (await screen.findByRole("button", { name: "Confirmar reserva" })).click();

    await screen.findByText(/Tiempo para pagar el adelanto/);
    expect(screen.getByRole("heading", { name: "Reserva creada" })).toBeTruthy();
    expect(screen.queryByRole("heading", { name: "¡Reserva confirmada!" })).toBeNull();
    expect(screen.queryByText("Pagaste el adelanto con tu crédito.")).toBeNull();
  });

  it("al elegir otro turno reinicia la confirmación anterior", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValueOnce(new Response(JSON.stringify(RESUMEN), { status: 200 }))
        .mockResolvedValueOnce(new Response(JSON.stringify({ id: 1, codigo: "LP7K2M9Q", estado: "CONFIRMADA", venceEn: null }), { status: 201 }))
        .mockImplementation(() => Promise.resolve(new Response(JSON.stringify({ ...RESUMEN, horaInicio: "19:00" }), { status: 200 }))),
    );

    const { rerender } = renderPantalla();
    await screen.findByText(/Usar mi crédito/);
    (screen.getByRole("checkbox") as HTMLInputElement).click();
    (await screen.findByRole("button", { name: "Confirmar reserva" })).click();
    await screen.findByText("LP7K2M9Q");

    rerender(envolver(<PantallaConfirmarReserva canchaId={2} fecha="2026-10-20" horaInicio="19:00" />));

    await screen.findByRole("button", { name: "Confirmar reserva" });
    expect(screen.queryByText("LP7K2M9Q")).toBeNull();
    expect((screen.getByRole("checkbox") as HTMLInputElement).checked).toBe(false);
  });

  it("muestra el plazo de cancelación con el texto de la regla", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify(RESUMEN), { status: 200 })));

    renderPantalla();

    await screen.findByText(
      "Puedes cancelar hasta el lunes 19/10 a las 18:00 (24 h antes) y se te devolverá tu adelanto como crédito. Si cancelas después, el adelanto queda retenido.",
    );
  });

  it("con devolución indica que el adelanto se devuelve en recepción", async () => {
    const resumen = { ...RESUMEN, regla: { ...RESUMEN.regla, tipoCompensacion: "DEVOLUCION" } };
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify(resumen), { status: 200 })));

    renderPantalla();

    await screen.findByText(/y se te devolverá tu adelanto en recepción\./);
  });

  it("con 0 horas se puede cancelar hasta el inicio del turno", async () => {
    const resumen = {
      ...RESUMEN,
      regla: { horasAnticipacion: 0, tipoCompensacion: "CREDITO", plazoLimite: "2026-10-20T23:00:00.000Z" },
    };
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify(resumen), { status: 200 })));

    renderPantalla();

    await screen.findByText(/^Puedes cancelar hasta el inicio del turno y se te devolverá tu adelanto como crédito\./);
  });
});
