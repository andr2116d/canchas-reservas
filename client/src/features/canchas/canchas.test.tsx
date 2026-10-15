import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { ProveedorToast } from "@/components/ui";
import type { Cancha } from "./api";
import { PantallaCanchas } from "./components/pantalla-canchas";
import { TablaCanchas } from "./components/tabla-canchas";

const OPERATIVA: Cancha = {
  id: 1,
  nombre: "Cancha 1",
  tamano: "FUTBOL_5",
  iluminacion: true,
  estado: "OPERATIVA",
  activa: true,
  tieneTarifas: true,
};

const EN_MANTENIMIENTO: Cancha = {
  ...OPERATIVA,
  id: 2,
  nombre: "Cancha 2",
  tamano: "FUTBOL_7",
  iluminacion: false,
  estado: "EN_MANTENIMIENTO",
};

const DESACTIVADA: Cancha = { ...OPERATIVA, id: 3, nombre: "Cancha 3", activa: false };
const SIN_TARIFA: Cancha = { ...OPERATIVA, id: 4, nombre: "Cancha 4", tieneTarifas: false };

type Respuesta = { status: number; body?: unknown };
type Rutas = Record<string, Respuesta | Respuesta[]>;

beforeAll(() => {
  HTMLDialogElement.prototype.showModal = function (this: HTMLDialogElement) {
    this.open = true;
  };
  HTMLDialogElement.prototype.close = function (this: HTMLDialogElement) {
    this.open = false;
  };
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

function responder(rutas: Rutas) {
  const fetchMock = vi.fn(async (url: string, opciones?: RequestInit) => {
    const clave = `${opciones?.method ?? "GET"} ${url}`;
    const definida = rutas[clave];
    const { status, body } = Array.isArray(definida) ? (definida.shift() ?? { status: 500 }) : (definida ?? { status: 500 });
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
        <PantallaCanchas />
      </ProveedorToast>
    </QueryClientProvider>,
  );
}

function cuerpos(fetchMock: ReturnType<typeof responder>, metodo: string) {
  return fetchMock.mock.calls
    .filter(([, opciones]) => opciones?.method === metodo)
    .map(([url, opciones]) => ({ url, body: JSON.parse(opciones?.body as string) }));
}

const sinAccion = () => {};

describe("Canchas", () => {
  it("muestra en el campo nombre el 409 de nombre repetido", async () => {
    const mensaje = "Ya existe una cancha con ese nombre";
    const fetchMock = responder({
      "GET /api/canchas": { status: 200, body: [] },
      "POST /api/canchas": { status: 409, body: { statusCode: 409, message: mensaje, errores: { nombre: mensaje } } },
    });
    renderPantalla();

    fireEvent.click(await screen.findByRole("button", { name: "Nueva cancha" }));
    const dialogo = within(screen.getByRole("dialog"));
    fireEvent.input(dialogo.getByLabelText("Nombre"), { target: { value: "cancha 1" } });
    fireEvent.change(dialogo.getByLabelText("Tamaño"), { target: { value: "FUTBOL_5" } });
    fireEvent.click(dialogo.getByRole("switch", { name: "Tiene iluminación" }));
    fireEvent.click(dialogo.getByRole("button", { name: "Crear cancha" }));

    const nombre = dialogo.getByLabelText("Nombre");
    await waitFor(() => expect(nombre.getAttribute("aria-invalid")).toBe("true"));
    expect(document.getElementById(nombre.getAttribute("aria-describedby")!)?.textContent).toBe(mensaje);
    expect(screen.getByRole("dialog")).toBeTruthy();
    expect(cuerpos(fetchMock, "POST")).toEqual([
      { url: "/api/canchas", body: { nombre: "cancha 1", tamano: "FUTBOL_5", iluminacion: true } },
    ]);
  });

  it("muestra los badges según estado y activa", () => {
    render(
      <TablaCanchas
        canchas={[OPERATIVA, EN_MANTENIMIENTO, DESACTIVADA]}
        onEditar={sinAccion}
        onDesactivar={sinAccion}
        onActivar={sinAccion}
        onEliminar={sinAccion}
      />,
    );

    const [, operativa, mantenimiento, desactivada] = within(screen.getByRole("table")).getAllByRole("row");
    expect(within(operativa).getByText("Operativa").className).toContain("bg-exito-fondo");
    expect(within(operativa).queryByText("Desactivada")).toBeNull();
    expect(within(operativa).getByText("Fútbol 5")).toBeTruthy();
    expect(within(operativa).getByText("Sí")).toBeTruthy();
    expect(within(operativa).getByRole("button", { name: "Desactivar" })).toBeTruthy();

    expect(within(mantenimiento).getByText("En mantenimiento").className).toContain("bg-alerta-fondo");
    expect(within(mantenimiento).getByText("Fútbol 7")).toBeTruthy();
    expect(within(mantenimiento).getByText("No")).toBeTruthy();

    expect(within(desactivada).getByText("Desactivada").className).toContain("bg-linea");
    expect(within(desactivada).getByRole("button", { name: "Activar" })).toBeTruthy();
    expect(within(desactivada).queryByRole("button", { name: "Desactivar" })).toBeNull();
  });

  it("avisa Sin tarifa solo cuando la cancha no tiene tarifas", () => {
    render(
      <TablaCanchas
        canchas={[OPERATIVA, SIN_TARIFA]}
        onEditar={sinAccion}
        onDesactivar={sinAccion}
        onActivar={sinAccion}
        onEliminar={sinAccion}
      />,
    );

    const [, conTarifa, sinTarifa] = within(screen.getByRole("table")).getAllByRole("row");
    expect(within(conTarifa).queryByText("Sin tarifa")).toBeNull();
    expect(within(sinTarifa).getByText("Sin tarifa").className).toContain("bg-alerta-fondo");
  });

  it("al recibir 409 al desactivar muestra las reservas afectadas y Desactivar igual confirma", async () => {
    const fetchMock = responder({
      "GET /api/canchas": { status: 200, body: [OPERATIVA] },
      "PATCH /api/canchas/1/activa": [
        {
          status: 409,
          body: {
            statusCode: 409,
            message: "La cancha tiene reservas futuras. Confirma para desactivarla igual",
            errores: {},
            reservasFuturas: [
              { id: 7, codigo: "LP-0007", fecha: "2026-10-20", horaInicio: "18:00", cliente: "Ana Pérez" },
              { id: 8, codigo: "LP-0008", fecha: "2026-10-21", horaInicio: "20:00", cliente: "Luis Quispe" },
            ],
          },
        },
        { status: 200, body: { ...OPERATIVA, activa: false } },
      ],
    });
    renderPantalla();

    const tabla = await screen.findByRole("table");
    fireEvent.click(within(tabla).getByRole("button", { name: "Desactivar" }));
    fireEvent.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Desactivar" }));

    const lista = await screen.findByRole("list", { name: "Reservas afectadas" });
    const items = within(lista).getAllByRole("listitem");
    expect(items).toHaveLength(2);
    expect(items[0].textContent).toContain("LP-0007");
    expect(items[0].textContent).toContain("20/10/2026");
    expect(items[0].textContent).toContain("18:00");
    expect(items[0].textContent).toContain("Ana Pérez");

    fireEvent.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Desactivar igual" }));

    expect((await screen.findByRole("status")).textContent).toBe("Cancha desactivada");
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(cuerpos(fetchMock, "PATCH")).toEqual([
      { url: "/api/canchas/1/activa", body: { activa: false } },
      { url: "/api/canchas/1/activa", body: { activa: false, confirmar: true } },
    ]);
  });
});
