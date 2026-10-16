import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { PantallaReservas } from "./components/mis-reservas";

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
});
