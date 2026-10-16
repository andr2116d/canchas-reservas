import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ProveedorToast } from "@/components/ui";
import type { ReglaCancelacion } from "./api";
import { PantallaReglaCancelacion } from "./components/pantalla-regla-cancelacion";
import { MENSAJES_REGLA } from "./schemas";

const REGLA: ReglaCancelacion = { horasAnticipacion: 12, tipoCompensacion: "DEVOLUCION" };

type Respuesta = { status: number; body?: unknown } | "red" | Promise<{ status: number; body?: unknown }>;
type Rutas = Record<string, Respuesta | Respuesta[]>;

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

function responder(rutas: Rutas) {
  const fetchMock = vi.fn(async (url: string, opciones?: RequestInit) => {
    const definida = rutas[`${opciones?.method ?? "GET"} ${url}`];
    const respuesta = Array.isArray(definida) ? (definida.length > 1 ? definida.shift() : definida[0]) : definida;
    if (respuesta === "red") throw new TypeError("Failed to fetch");
    const { status, body } = (await respuesta) ?? { status: 500 };
    return new Response(body === undefined ? null : JSON.stringify(body), { status });
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

function renderPantalla() {
  const cliente = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={cliente}>
      <ProveedorToast>
        <PantallaReglaCancelacion />
      </ProveedorToast>
    </QueryClientProvider>,
  );
}

function llamadas(fetchMock: ReturnType<typeof responder>, metodo: string) {
  return fetchMock.mock.calls.filter(
    ([url, opciones]) => (opciones?.method ?? "GET") === metodo && url === "/api/regla-cancelacion",
  );
}

async function campoHoras() {
  return (await screen.findByLabelText("Horas de anticipación")) as HTMLInputElement;
}

function campoTipo() {
  return screen.getByLabelText("Compensación del adelanto") as HTMLSelectElement;
}

function botonGuardar() {
  return screen.getByRole("button", { name: "Guardar" }) as HTMLButtonElement;
}

describe("Pantalla de la regla de cancelación", () => {
  it("muestra el esqueleto y luego los valores de la API", async () => {
    const fetchMock = responder({ "GET /api/regla-cancelacion": { status: 200, body: REGLA } });
    renderPantalla();

    expect(screen.getByTestId("esqueleto-regla")).toBeTruthy();
    expect((await campoHoras()).value).toBe("12");
    expect(campoTipo().value).toBe("DEVOLUCION");
    expect(screen.queryByTestId("esqueleto-regla")).toBeNull();
    expect(llamadas(fetchMock, "GET")).toHaveLength(1);
  });

  it("si la carga falla muestra el error y Reintentar vuelve a pedir la regla", async () => {
    const fetchMock = responder({
      "GET /api/regla-cancelacion": ["red", { status: 200, body: REGLA }],
    });
    renderPantalla();

    const alerta = await screen.findByRole("alert");
    expect(within(alerta).getByText("No se pudo conectar con el servidor")).toBeTruthy();
    expect(screen.queryByLabelText("Horas de anticipación")).toBeNull();

    fireEvent.click(within(alerta).getByRole("button", { name: "Reintentar" }));

    expect((await campoHoras()).value).toBe("12");
    expect(llamadas(fetchMock, "GET")).toHaveLength(2);
  });

  it("guardar envía el PUT con los valores, muestra el toast y deja los guardados como iniciales", async () => {
    const guardada: ReglaCancelacion = { horasAnticipacion: 48, tipoCompensacion: "CREDITO" };
    const fetchMock = responder({
      "GET /api/regla-cancelacion": [
        { status: 200, body: REGLA },
        { status: 200, body: guardada },
      ],
      "PUT /api/regla-cancelacion": { status: 200, body: guardada },
    });
    renderPantalla();

    fireEvent.change(await campoHoras(), { target: { value: "48" } });
    fireEvent.change(campoTipo(), { target: { value: "CREDITO" } });
    fireEvent.click(botonGuardar());

    expect((await screen.findByRole("status")).textContent).toBe("Regla de cancelación guardada");
    const [put] = llamadas(fetchMock, "PUT");
    expect(JSON.parse(put[1]?.body as string)).toEqual({ horasAnticipacion: 48, tipoCompensacion: "CREDITO" });
    expect((await campoHoras()).value).toBe("48");
    expect(campoTipo().value).toBe("CREDITO");
    await waitFor(() => expect(botonGuardar().disabled).toBe(true));

    fireEvent.change(await campoHoras(), { target: { value: "12" } });
    await waitFor(() => expect(botonGuardar().disabled).toBe(false));
    fireEvent.change(await campoHoras(), { target: { value: "48" } });
    await waitFor(() => expect(botonGuardar().disabled).toBe(true));
  });

  it("Guardar está deshabilitado sin cambios, se habilita al editar y vuelve a deshabilitarse al volver al valor original", async () => {
    responder({ "GET /api/regla-cancelacion": { status: 200, body: REGLA } });
    renderPantalla();

    const horas = await campoHoras();
    expect(botonGuardar().disabled).toBe(true);

    fireEvent.change(horas, { target: { value: "24" } });
    expect(botonGuardar().disabled).toBe(false);
    fireEvent.change(horas, { target: { value: "12" } });
    expect(botonGuardar().disabled).toBe(true);

    fireEvent.change(campoTipo(), { target: { value: "CREDITO" } });
    expect(botonGuardar().disabled).toBe(false);
    fireEvent.change(campoTipo(), { target: { value: "DEVOLUCION" } });
    expect(botonGuardar().disabled).toBe(true);
  });

  it("Guardar está deshabilitado mientras guarda", async () => {
    let terminar: (respuesta: { status: number; body?: unknown }) => void = () => {};
    const pendiente = new Promise<{ status: number; body?: unknown }>((resolver) => {
      terminar = resolver;
    });
    const fetchMock = responder({
      "GET /api/regla-cancelacion": { status: 200, body: REGLA },
      "PUT /api/regla-cancelacion": pendiente,
    });
    renderPantalla();

    fireEvent.change(await campoHoras(), { target: { value: "6" } });
    fireEvent.click(botonGuardar());

    await waitFor(() => expect(llamadas(fetchMock, "PUT")).toHaveLength(1));
    expect(botonGuardar().disabled).toBe(true);
    fireEvent.click(botonGuardar());
    expect(llamadas(fetchMock, "PUT")).toHaveLength(1);

    terminar({ status: 200, body: { horasAnticipacion: 6, tipoCompensacion: "DEVOLUCION" } });
    expect((await screen.findByRole("status")).textContent).toBe("Regla de cancelación guardada");
    expect(botonGuardar().disabled).toBe(true);
  });

  it("un 400 del servidor muestra su mensaje debajo del campo", async () => {
    const mensaje = "Las horas de anticipación no pueden superar 2147483647";
    responder({
      "GET /api/regla-cancelacion": { status: 200, body: REGLA },
      "PUT /api/regla-cancelacion": {
        status: 400,
        body: { statusCode: 400, message: mensaje, errores: { horasAnticipacion: mensaje } },
      },
    });
    renderPantalla();

    const horas = await campoHoras();
    fireEvent.change(horas, { target: { value: "30" } });
    fireEvent.click(botonGuardar());

    const error = await screen.findByText(mensaje);
    expect(error.id).toBe(horas.getAttribute("aria-describedby"));
    expect(horas.getAttribute("aria-invalid")).toBe("true");
    expect(screen.queryByRole("status")).toBeNull();
  });

  it("otro error del servidor se muestra en la alerta de la tarjeta, sin toast", async () => {
    responder({
      "GET /api/regla-cancelacion": { status: 200, body: REGLA },
      "PUT /api/regla-cancelacion": {
        status: 403,
        body: { statusCode: 403, message: "No tienes permiso para esta acción" },
      },
    });
    renderPantalla();

    fireEvent.change(await campoHoras(), { target: { value: "30" } });
    fireEvent.click(botonGuardar());

    const alerta = await screen.findByRole("alert");
    expect(alerta.textContent).toBe("No tienes permiso para esta acción");
    expect(alerta.closest("form")).toBeTruthy();
    expect(screen.getAllByRole("alert")).toHaveLength(1);
    expect(screen.queryByRole("status")).toBeNull();
  });

  it.each([
    ["-3", MENSAJES_REGLA.horasMinimo],
    ["1.5", MENSAJES_REGLA.horasEntero],
    ["", MENSAJES_REGLA.horasEntero],
  ])("con %j no envía nada y muestra el motivo", async (valor, mensaje) => {
    const fetchMock = responder({ "GET /api/regla-cancelacion": { status: 200, body: REGLA } });
    renderPantalla();

    const horas = await campoHoras();
    fireEvent.change(horas, { target: { value: valor } });
    fireEvent.click(botonGuardar());

    expect(await screen.findByText(mensaje)).toBeTruthy();
    expect(horas.getAttribute("aria-invalid")).toBe("true");
    expect(llamadas(fetchMock, "PUT")).toHaveLength(0);
  });
});
