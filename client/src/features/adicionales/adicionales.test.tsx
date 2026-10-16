import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { ProveedorToast } from "@/components/ui";
import { decimal } from "@/lib/filtros-entrada";
import type { Adicional } from "./api";
import { PantallaAdicionales } from "./components/pantalla-adicionales";
import { TablaAdicionales } from "./components/tabla-adicionales";

const AGUA: Adicional = { id: 1, nombre: "Agua", precio: 5, activo: true };
const BALON: Adicional = { id: 2, nombre: "Balón", precio: 15.5, activo: true };
const CHALECO: Adicional = { id: 3, nombre: "Chaleco", precio: 10, activo: false };

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
        <PantallaAdicionales />
      </ProveedorToast>
    </QueryClientProvider>,
  );
}

function cuerpos(fetchMock: ReturnType<typeof responder>, metodo: string) {
  return fetchMock.mock.calls
    .filter(([, opciones]) => opciones?.method === metodo)
    .map(([url, opciones]) => ({ url, body: JSON.parse(opciones?.body as string) }));
}

async function filaDe(nombre: string) {
  const tabla = await screen.findByRole("table");
  const filas = within(tabla).getAllByRole("row") as HTMLTableRowElement[];
  const fila = filas.find((f) => f.textContent?.includes(nombre));
  if (!fila) throw new Error(`No se encontró la fila de ${nombre}`);
  return fila;
}

async function abrirFormulario() {
  await screen.findByRole("heading", { name: "Adicionales" });
  const botones = screen.getAllByRole("button", { name: "Nuevo adicional" });
  fireEvent.click(botones[botones.length - 1]);
  return within(screen.getByRole("dialog"));
}

const sinAccion = () => {};

describe("Adicionales", () => {
  it("muestra el precio con el formato de moneda y el badge según el estado", () => {
    render(<TablaAdicionales adicionales={[AGUA, CHALECO]} onEditar={sinAccion} onDesactivar={sinAccion} onActivar={sinAccion} onEliminar={sinAccion} />);

    const [, activa, inactivo] = within(screen.getByRole("table")).getAllByRole("row");
    expect(within(activa).getByText("S/ 5.00")).toBeTruthy();
    expect(within(activa).getByText("Activo").className).toContain("bg-exito-fondo");
    expect(within(activa).getByRole("button", { name: "Desactivar" })).toBeTruthy();
    expect(within(activa).queryByRole("button", { name: "Activar" })).toBeNull();

    expect(within(inactivo).getByText("S/ 10.00")).toBeTruthy();
    expect(within(inactivo).getByText("Inactivo").className).toContain("bg-linea");
    expect(within(inactivo).getByRole("button", { name: "Activar" })).toBeTruthy();
    expect(within(inactivo).queryByRole("button", { name: "Desactivar" })).toBeNull();
  });

  it("muestra el estado vacío con el botón para crear el primero", async () => {
    responder({ "GET /api/adicionales": { status: 200, body: [] } });
    renderPantalla();

    expect(await screen.findByText("Todavía no hay adicionales")).toBeTruthy();
    const botones = screen.getAllByRole("button", { name: "Nuevo adicional" });
    fireEvent.click(botones[botones.length - 1]);
    expect(within(await screen.findByRole("dialog")).getByLabelText("Nombre")).toBeTruthy();
  });

  it("crea un adicional y avisa con un Toast de éxito", async () => {
    const fetchMock = responder({
      "GET /api/adicionales": { status: 200, body: [] },
      "POST /api/adicionales": { status: 201, body: AGUA },
    });
    renderPantalla();

    const dialogo = await abrirFormulario();
    fireEvent.input(dialogo.getByLabelText("Nombre"), { target: { value: "Agua" } });
    fireEvent.input(dialogo.getByLabelText("Precio unitario"), { target: { value: "5.50" } });
    fireEvent.click(dialogo.getByRole("button", { name: "Crear adicional" }));

    expect((await screen.findByRole("status")).textContent).toBe("Adicional creado");
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(cuerpos(fetchMock, "POST")).toEqual([
      { url: "/api/adicionales", body: { nombre: "Agua", precio: 5.5 } },
    ]);
  });

  it("muestra en el campo nombre el 409 de nombre repetido", async () => {
    const mensaje = "Ya existe un adicional con ese nombre";
    const fetchMock = responder({
      "GET /api/adicionales": { status: 200, body: [] },
      "POST /api/adicionales": { status: 409, body: { statusCode: 409, message: mensaje, errores: { nombre: mensaje } } },
    });
    renderPantalla();

    const dialogo = await abrirFormulario();
    fireEvent.input(dialogo.getByLabelText("Nombre"), { target: { value: " agua " } });
    fireEvent.input(dialogo.getByLabelText("Precio unitario"), { target: { value: "5.00" } });
    fireEvent.click(dialogo.getByRole("button", { name: "Crear adicional" }));

    const nombre = dialogo.getByLabelText("Nombre");
    await waitFor(() => expect(nombre.getAttribute("aria-invalid")).toBe("true"));
    expect(document.getElementById(nombre.getAttribute("aria-describedby")!)?.textContent).toBe(mensaje);
    expect(screen.getByRole("dialog")).toBeTruthy();
    expect(cuerpos(fetchMock, "POST")).toEqual([
      { url: "/api/adicionales", body: { nombre: "agua", precio: 5 } },
    ]);
  });

  it("no guarda cuando el precio es cero y lo muestra en el campo precio", async () => {
    const fetchMock = responder({ "GET /api/adicionales": { status: 200, body: [] } });
    renderPantalla();

    const dialogo = await abrirFormulario();
    fireEvent.input(dialogo.getByLabelText("Nombre"), { target: { value: "Agua" } });
    fireEvent.input(dialogo.getByLabelText("Precio unitario"), { target: { value: "0" } });
    fireEvent.click(dialogo.getByRole("button", { name: "Crear adicional" }));

    const precio = dialogo.getByLabelText("Precio unitario");
    await waitFor(() => expect(precio.getAttribute("aria-invalid")).toBe("true"));
    expect(document.getElementById(precio.getAttribute("aria-describedby")!)?.textContent).toBe(
      "El precio debe ser mayor que cero",
    );
    expect(cuerpos(fetchMock, "POST")).toEqual([]);
    expect(screen.getByRole("dialog")).toBeTruthy();
  });

  it("deja escribir solo cifras y un punto decimal, con hasta 2 decimales", () => {
    expect(decimal("-5")).toBe("5");
    expect(decimal("-0.50")).toBe("0.50");
    expect(decimal("5,50")).toBe("5.50");
    expect(decimal("5.678")).toBe("5.67");
    expect(decimal("5..6")).toBe("5.6");
    expect(decimal("...")).toBe(".");
    expect(decimal(".")).toBe(".");
    expect(decimal("1e5")).toBe("15");
    expect(decimal("")).toBe("");
  });

  it("el campo precio es de texto con teclado decimal, sin flechas que admitan negativos", async () => {
    responder({ "GET /api/adicionales": { status: 200, body: [] } });
    renderPantalla();

    const dialogo = await abrirFormulario();
    const precio = dialogo.getByLabelText("Precio unitario");
    expect(precio.getAttribute("type")).toBe("text");
    expect(precio.getAttribute("inputmode")).toBe("decimal");
  });

  it("descarta lo tecleado que no es un número y guarda el precio", async () => {
    const fetchMock = responder({
      "GET /api/adicionales": { status: 200, body: [] },
      "POST /api/adicionales": { status: 201, body: AGUA },
    });
    renderPantalla();

    const dialogo = await abrirFormulario();
    fireEvent.input(dialogo.getByLabelText("Nombre"), { target: { value: "Agua" } });
    const precio = dialogo.getByLabelText("Precio unitario") as HTMLInputElement;
    fireEvent.input(precio, { target: { value: "-5.50" } });
    expect(precio.value).toBe("5.50");

    fireEvent.input(precio, { target: { value: "5..6" } });
    expect(precio.value).toBe("5.6");

    fireEvent.input(precio, { target: { value: "15.5" } });
    fireEvent.click(dialogo.getByRole("button", { name: "Crear adicional" }));

    expect((await screen.findByRole("status")).textContent).toBe("Adicional creado");
    expect(cuerpos(fetchMock, "POST")).toEqual([
      { url: "/api/adicionales", body: { nombre: "Agua", precio: 15.5 } },
    ]);
  });

  it("avisa cuando el precio supera el máximo", async () => {
    const fetchMock = responder({ "GET /api/adicionales": { status: 200, body: [] } });
    renderPantalla();

    const dialogo = await abrirFormulario();
    fireEvent.input(dialogo.getByLabelText("Nombre"), { target: { value: "Agua" } });
    fireEvent.input(dialogo.getByLabelText("Precio unitario"), { target: { value: "10000" } });
    fireEvent.click(dialogo.getByRole("button", { name: "Crear adicional" }));

    const precio = dialogo.getByLabelText("Precio unitario");
    await waitFor(() => expect(precio.getAttribute("aria-invalid")).toBe("true"));
    expect(document.getElementById(precio.getAttribute("aria-describedby")!)?.textContent).toBe(
      "El precio no puede superar S/ 9999.99",
    );
    expect(cuerpos(fetchMock, "POST")).toEqual([]);
  });

  it("edita el nombre y el precio de un adicional", async () => {
    const fetchMock = responder({
      "GET /api/adicionales": { status: 200, body: [BALON] },
      "PATCH /api/adicionales/2": { status: 200, body: { ...BALON, precio: 18 } },
    });
    renderPantalla();

    fireEvent.click(within(await filaDe("Balón")).getByRole("button", { name: "Editar" }));
    const dialogo = within(await screen.findByRole("dialog"));
    expect(dialogo.getByLabelText("Nombre")).toHaveProperty("value", "Balón");
    expect(dialogo.getByLabelText("Precio unitario")).toHaveProperty("value", "15.50");
    fireEvent.input(dialogo.getByLabelText("Precio unitario"), { target: { value: "18" } });
    fireEvent.click(dialogo.getByRole("button", { name: "Guardar cambios" }));

    expect((await screen.findByRole("status")).textContent).toBe("Cambios guardados");
    expect(cuerpos(fetchMock, "PATCH")).toEqual([
      { url: "/api/adicionales/2", body: { nombre: "Balón", precio: 18 } },
    ]);
  });

  it("pide confirmación antes de desactivar y avisa con un Toast de éxito", async () => {
    const fetchMock = responder({
      "GET /api/adicionales": { status: 200, body: [AGUA] },
      "PATCH /api/adicionales/1/estado": { status: 200, body: { ...AGUA, activo: false } },
    });
    renderPantalla();

    fireEvent.click(within(await filaDe("Agua")).getByRole("button", { name: "Desactivar" }));

    const dialogo = within(await screen.findByRole("dialog"));
    expect(dialogo.getByText("Desactivar adicional")).toBeTruthy();
    expect(dialogo.getByText(/dejará de ofrecerse al registrar consumos/)).toBeTruthy();
    expect(cuerpos(fetchMock, "PATCH")).toEqual([]);

    fireEvent.click(dialogo.getByRole("button", { name: "Desactivar" }));

    expect((await screen.findByRole("status")).textContent).toBe("Adicional desactivado");
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(cuerpos(fetchMock, "PATCH")).toEqual([
      { url: "/api/adicionales/1/estado", body: { activo: false } },
    ]);
  });

  it("cancela la desactivación sin llamar al servidor", async () => {
    const fetchMock = responder({ "GET /api/adicionales": { status: 200, body: [AGUA] } });
    renderPantalla();

    fireEvent.click(within(await filaDe("Agua")).getByRole("button", { name: "Desactivar" }));
    fireEvent.click(within(await screen.findByRole("dialog")).getByRole("button", { name: "Cancelar" }));

    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    expect(cuerpos(fetchMock, "PATCH")).toEqual([]);
  });

  it("activa sin pedir confirmación y avisa con un Toast de éxito", async () => {
    const fetchMock = responder({
      "GET /api/adicionales": { status: 200, body: [CHALECO] },
      "PATCH /api/adicionales/3/estado": { status: 200, body: { ...CHALECO, activo: true } },
    });
    renderPantalla();

    fireEvent.click(within(await filaDe("Chaleco")).getByRole("button", { name: "Activar" }));

    expect(screen.queryByRole("dialog")).toBeNull();
    expect((await screen.findByRole("status")).textContent).toBe("Adicional activado");
    expect(cuerpos(fetchMock, "PATCH")).toEqual([
      { url: "/api/adicionales/3/estado", body: { activo: true } },
    ]);
  });

  it("pide confirmación con el nombre antes de eliminar", async () => {
    const fetchMock = responder({
      "GET /api/adicionales": { status: 200, body: [AGUA] },
      "DELETE /api/adicionales/1": { status: 204 },
    });
    renderPantalla();

    fireEvent.click(within(await filaDe("Agua")).getByRole("button", { name: "Eliminar" }));

    const dialogo = within(await screen.findByRole("dialog"));
    expect(dialogo.getByText("Eliminar adicional")).toBeTruthy();
    expect(dialogo.getByText(/Esta acción no se puede deshacer/)).toBeTruthy();
    expect(cuerpos(fetchMock, "DELETE")).toEqual([]);

    fireEvent.click(dialogo.getByRole("button", { name: "Eliminar" }));

    expect((await screen.findByRole("status")).textContent).toBe("Adicional eliminado");
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(fetchMock.mock.calls.filter(([, opciones]) => opciones?.method === "DELETE")[0][0]).toBe("/api/adicionales/1");
  });

  it("filtra el listado por estado", async () => {
    const fetchMock = responder({
      "GET /api/adicionales": { status: 200, body: [AGUA] },
      "GET /api/adicionales?activo=true": { status: 200, body: [AGUA] },
      "GET /api/adicionales?activo=false": { status: 200, body: [CHALECO] },
    });
    renderPantalla();

    await filaDe("Agua");
    fireEvent.change(screen.getByLabelText("Estado"), { target: { value: "activos" } });
    await filaDe("Agua");

    fireEvent.change(screen.getByLabelText("Estado"), { target: { value: "inactivos" } });
    await filaDe("Chaleco");

    const pedidas = fetchMock.mock.calls.filter(([, opciones]) => !opciones?.method).map(([url]) => url);
    expect(pedidas).toEqual([
      "/api/adicionales",
      "/api/adicionales?activo=true",
      "/api/adicionales?activo=false",
    ]);
  });
});