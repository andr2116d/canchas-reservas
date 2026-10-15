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
  regla: { horasAnticipacion: 24, tipoCompensacion: "CREDITO", plazoLimite: 30 },
};

function renderPantalla() {
  const cliente = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={cliente}>
      <PantallaConfirmarReserva canchaId={2} fecha="2026-10-20" horaInicio="18:00" />
    </QueryClientProvider>,
  );
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
});