import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { ProveedorToast } from "@/components/ui";
import type { Recepcionista } from "./api";
import { PantallaRecepcionistas } from "./components/pantalla-recepcionistas";
import { TablaRecepcionistas } from "./components/tabla-recepcionistas";

const ACTIVA: Recepcionista = {
  id: 3,
  nombres: "Ana María",
  apellidos: "Pérez",
  tipoDocumento: "DNI",
  numeroDocumento: "71234567",
  correo: "ana@laprevia.pe",
  telefono: "987654321",
  estado: "ACTIVO",
  creadoEn: "2026-10-14T15:00:00.000Z",
};

const INACTIVO: Recepcionista = {
  ...ACTIVA,
  id: 4,
  nombres: "Luis",
  apellidos: "Quispe",
  numeroDocumento: "72345678",
  correo: "luis@laprevia.pe",
  estado: "INACTIVO",
};

type Respuesta = { status: number; body?: unknown };

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

function responder(alCrear: Respuesta) {
  const fetchMock = vi.fn(async (_url: string, opciones?: RequestInit) => {
    const { status, body } = opciones?.method === "POST" ? alCrear : { status: 200, body: [] };
    return new Response(body === undefined ? null : JSON.stringify(body), { status });
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

function responderConLista(
  lista: Recepcionista[],
  responder: (url: string, metodo: string) => Respuesta | undefined = () => undefined,
) {
  const fetchMock = vi.fn(async (url: string, opciones?: RequestInit) => {
    const metodo = opciones?.method ?? "GET";
    const propia = responder(url, metodo);
    const { status, body } = propia ?? { status: 200, body: metodo === "GET" ? lista : null };
    return new Response(body === undefined || body === null ? null : JSON.stringify(body), { status });
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

async function filaDe(nombre: string) {
  const tabla = await screen.findByRole("table");
  const filas = within(tabla).getAllByRole("row") as HTMLTableRowElement[];
  const fila = filas.find((f) => f.textContent?.includes(nombre));
  if (!fila) throw new Error(`No se encontró la fila de ${nombre}`);
  return fila;
}

type LlamadaFetch = [string, (RequestInit | undefined)?];

function llamadaDe(fetchMock: { mock: { calls: LlamadaFetch[] } }, metodo: string) {
  return fetchMock.mock.calls.find(([, opciones]) => opciones?.method === metodo);
}

function renderPantalla() {
  const cliente = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={cliente}>
      <ProveedorToast>
        <PantallaRecepcionistas />
      </ProveedorToast>
    </QueryClientProvider>,
  );
}

async function llenarYCrear() {
  fireEvent.click(await screen.findByRole("button", { name: "Nuevo recepcionista" }));
  const dialogo = within(screen.getByRole("dialog"));
  fireEvent.input(dialogo.getByLabelText("Nombres"), { target: { value: "Ana María" } });
  fireEvent.input(dialogo.getByLabelText("Apellidos"), { target: { value: "Pérez" } });
  fireEvent.input(dialogo.getByLabelText("Número de documento"), { target: { value: "71234567" } });
  fireEvent.input(dialogo.getByLabelText("Correo"), { target: { value: "ana@laprevia.pe" } });
  fireEvent.input(dialogo.getByLabelText("Teléfono"), { target: { value: "987654321" } });
  fireEvent.input(dialogo.getByLabelText("Contraseña inicial"), { target: { value: "Recepcion123" } });
  fireEvent.click(dialogo.getByRole("button", { name: "Crear recepcionista" }));
  return dialogo;
}

describe("Recepcionistas", () => {
  it("muestra en el campo el error que devuelve el server", async () => {
    responder({
      status: 409,
      body: {
        statusCode: 409,
        message: "Este correo ya está registrado",
        errores: { correo: "Este correo ya está registrado" },
      },
    });
    renderPantalla();

    const dialogo = await llenarYCrear();

    const correo = dialogo.getByLabelText("Correo");
    await waitFor(() => expect(correo.getAttribute("aria-invalid")).toBe("true"));
    const error = document.getElementById(correo.getAttribute("aria-describedby")!);
    expect(error?.textContent).toBe("Este correo ya está registrado");
    expect(screen.getByRole("dialog")).toBeTruthy();
    expect(screen.queryByRole("status")).toBeNull();
  });

  it("muestra Desactivar a los activos y Activar a los inactivos", () => {
    const sinAccion = () => {};
    render(
      <TablaRecepcionistas
        recepcionistas={[ACTIVA, INACTIVO]}
        onEditar={sinAccion}
        onDesactivar={sinAccion}
        onActivar={sinAccion}
        onRestablecer={sinAccion}
      />,
    );

    const tabla = within(screen.getByRole("table"));
    const [, filaActiva, filaInactiva] = tabla.getAllByRole("row");
    expect(within(filaActiva).getByText("Activo")).toBeTruthy();
    expect(within(filaActiva).getByRole("button", { name: "Desactivar" })).toBeTruthy();
    expect(within(filaActiva).queryByRole("button", { name: "Activar" })).toBeNull();
    expect(within(filaInactiva).getByText("Inactivo")).toBeTruthy();
    expect(within(filaInactiva).getByRole("button", { name: "Activar" })).toBeTruthy();
    expect(within(filaInactiva).queryByRole("button", { name: "Desactivar" })).toBeNull();
  });

  it("arma el nombre completo sin los valores vacíos", () => {
    const sinAccion = () => {};
    render(
      <TablaRecepcionistas
        recepcionistas={[
          { ...ACTIVA, id: 5, nombres: "Recepcion", apellidos: null },
          { ...ACTIVA, id: 6, nombres: "Prueba", apellidos: "  " },
        ]}
        onEditar={sinAccion}
        onDesactivar={sinAccion}
        onActivar={sinAccion}
        onRestablecer={sinAccion}
      />,
    );

    const [, filaNula, filaVacia] = within(screen.getByRole("table")).getAllByRole("row") as HTMLTableRowElement[];
    expect(filaNula.cells[0].textContent).toBe("Recepcion");
    expect(filaVacia.cells[0].textContent).toBe("Prueba");
    expect(screen.getByRole("table").textContent).not.toContain("null");
  });

  it("muestra el Toast de éxito después de crear", async () => {
    const fetchMock = responder({ status: 201, body: ACTIVA });
    renderPantalla();

    await llenarYCrear();

    expect((await screen.findByRole("status")).textContent).toBe("Recepcionista creado");
    expect(screen.queryByRole("dialog")).toBeNull();
    const post = fetchMock.mock.calls.find(([, opciones]) => opciones?.method === "POST");
    expect(post?.[0]).toBe("/api/recepcionistas");
    expect(JSON.parse(post?.[1]?.body as string)).toEqual({
      nombres: "Ana María",
      apellidos: "Pérez",
      tipoDocumento: "DNI",
      numeroDocumento: "71234567",
      correo: "ana@laprevia.pe",
      telefono: "987654321",
      contrasena: "Recepcion123",
    });
  });

  it("pide confirmación antes de desactivar y avisa con un Toast de éxito", async () => {
    const fetchMock = responderConLista([ACTIVA]);
    renderPantalla();

    fireEvent.click(within(await filaDe("Ana María Pérez")).getByRole("button", { name: "Desactivar" }));

    const dialogo = within(await screen.findByRole("dialog"));
    expect(dialogo.getByText("Desactivar recepcionista")).toBeTruthy();
    expect(dialogo.getByText(/ya no podrá iniciar sesión/i)).toBeTruthy();
    expect(llamadaDe(fetchMock, "PATCH")).toBeUndefined();

    fireEvent.click(dialogo.getByRole("button", { name: "Desactivar" }));

    expect((await screen.findByRole("status")).textContent).toBe("Recepcionista desactivado");
    expect(screen.queryByRole("dialog")).toBeNull();
    const patch = llamadaDe(fetchMock, "PATCH");
    expect(patch?.[0]).toBe("/api/recepcionistas/3/estado");
    expect(JSON.parse(patch?.[1]?.body as string)).toEqual({ estado: "INACTIVO" });
  });

  it("cancela la desactivación sin llamar al servidor", async () => {
    const fetchMock = responderConLista([ACTIVA]);
    renderPantalla();

    fireEvent.click(within(await filaDe("Ana María Pérez")).getByRole("button", { name: "Desactivar" }));
    const dialogo = within(await screen.findByRole("dialog"));
    fireEvent.click(dialogo.getByRole("button", { name: "Cancelar" }));

    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    expect(llamadaDe(fetchMock, "PATCH")).toBeUndefined();
  });

  it("activa sin pedir confirmación y avisa con un Toast de éxito", async () => {
    const fetchMock = responderConLista([INACTIVO]);
    renderPantalla();

    fireEvent.click(within(await filaDe("Luis Quispe")).getByRole("button", { name: "Activar" }));

    expect(screen.queryByRole("dialog")).toBeNull();
    expect((await screen.findByRole("status")).textContent).toBe("Recepcionista activado");
    const patch = llamadaDe(fetchMock, "PATCH");
    expect(patch?.[0]).toBe("/api/recepcionistas/4/estado");
    expect(JSON.parse(patch?.[1]?.body as string)).toEqual({ estado: "ACTIVO" });
  });

  it("restablece la contraseña desde el modal y avisa con un Toast de éxito", async () => {
    const fetchMock = responderConLista([ACTIVA], (url, metodo) =>
      metodo === "POST" && url.endsWith("/restablecer-contrasena") ? { status: 204 } : undefined,
    );
    renderPantalla();

    fireEvent.click(
      within(await filaDe("Ana María Pérez")).getByRole("button", { name: "Restablecer contraseña" }),
    );

    const dialogo = within(await screen.findByRole("dialog"));
    expect(dialogo.getByText("Restablecer contraseña")).toBeTruthy();
    expect(dialogo.getByText(/La usará en su próximo inicio de sesión/)).toBeTruthy();
    fireEvent.input(dialogo.getByLabelText("Nueva contraseña"), { target: { value: "NuevaClave2026" } });
    fireEvent.click(dialogo.getByRole("button", { name: "Restablecer" }));

    expect((await screen.findByRole("status")).textContent).toBe("Contraseña restablecida");
    expect(screen.queryByRole("dialog")).toBeNull();
    const post = llamadaDe(fetchMock, "POST");
    expect(post?.[0]).toBe("/api/recepcionistas/3/restablecer-contrasena");
    expect(JSON.parse(post?.[1]?.body as string)).toEqual({ contrasena: "NuevaClave2026" });
  });
});

describe("Recepcionistas: filtros al escribir", () => {
  async function abrirNuevo() {
    fireEvent.click(await screen.findByRole("button", { name: "Nuevo recepcionista" }));
    return within(screen.getByRole("dialog"));
  }

  function pegar(control: HTMLInputElement, texto: string) {
    fireEvent.paste(control, { clipboardData: { getData: () => texto } });
    fireEvent.input(control, { target: { value: texto } });
  }

  it("con DNI el documento no acepta letras ni más de 8 dígitos", async () => {
    responder({ status: 201, body: ACTIVA });
    renderPantalla();

    const dialogo = await abrirNuevo();
    const documento = dialogo.getByLabelText("Número de documento") as HTMLInputElement;
    expect(documento.type).toBe("text");
    expect(documento.inputMode).toBe("numeric");

    fireEvent.input(documento, { target: { value: "12a4b" } });
    expect(documento.value).toBe("124");
    pegar(documento, "12a4b56789");
    expect(documento.value).toBe("12456789");
  });

  it("con CE el documento acepta letras y dígitos hasta 12", async () => {
    responder({ status: 201, body: ACTIVA });
    renderPantalla();

    const dialogo = await abrirNuevo();
    fireEvent.change(dialogo.getByLabelText("Tipo de documento"), { target: { value: "CE" } });
    const documento = dialogo.getByLabelText("Número de documento") as HTMLInputElement;
    expect(documento.inputMode).toBe("text");

    pegar(documento, "ab-123 456 789 0");
    expect(documento.value).toBe("ab1234567890");
  });

  it("al pasar de CE a DNI recorta lo que no cumple y crea con ese número", async () => {
    const fetchMock = responder({ status: 201, body: ACTIVA });
    renderPantalla();

    const dialogo = await abrirNuevo();
    const tipo = dialogo.getByLabelText("Tipo de documento");
    const documento = dialogo.getByLabelText("Número de documento") as HTMLInputElement;
    fireEvent.change(tipo, { target: { value: "CE" } });
    fireEvent.input(documento, { target: { value: "AB712345678" } });
    fireEvent.change(tipo, { target: { value: "DNI" } });
    expect(documento.value).toBe("71234567");

    fireEvent.input(dialogo.getByLabelText("Nombres"), { target: { value: "Ana María" } });
    fireEvent.input(dialogo.getByLabelText("Apellidos"), { target: { value: "Pérez" } });
    fireEvent.input(dialogo.getByLabelText("Correo"), { target: { value: "ana@laprevia.pe" } });
    fireEvent.input(dialogo.getByLabelText("Teléfono"), { target: { value: "987654321" } });
    fireEvent.input(dialogo.getByLabelText("Contraseña inicial"), { target: { value: "Recepcion123" } });
    fireEvent.click(dialogo.getByRole("button", { name: "Crear recepcionista" }));

    await waitFor(() => expect(llamadaDe(fetchMock, "POST")).toBeTruthy());
    expect(JSON.parse(llamadaDe(fetchMock, "POST")?.[1]?.body as string)).toMatchObject({
      tipoDocumento: "DNI",
      numeroDocumento: "71234567",
    });
  });

  it("al crear, el teléfono solo acepta dígitos al escribir y al pegar, hasta 9", async () => {
    responder({ status: 201, body: ACTIVA });
    renderPantalla();

    const dialogo = await abrirNuevo();
    const telefono = dialogo.getByLabelText("Teléfono") as HTMLInputElement;
    fireEvent.input(telefono, { target: { value: "9a8b" } });
    expect(telefono.value).toBe("98");
    pegar(telefono, "9a8b7-654 321 00");
    expect(telefono.value).toBe("987654321");
  });

  it("al editar, el teléfono solo acepta dígitos y guarda el valor limpio", async () => {
    const fetchMock = responderConLista([ACTIVA], (_url, metodo) =>
      metodo === "PATCH" ? { status: 200, body: { ...ACTIVA, telefono: "912345678" } } : undefined,
    );
    renderPantalla();

    fireEvent.click(within(await filaDe("Ana María Pérez")).getByRole("button", { name: "Editar" }));
    const dialogo = within(await screen.findByRole("dialog"));
    const telefono = dialogo.getByLabelText("Teléfono") as HTMLInputElement;
    expect(telefono.inputMode).toBe("numeric");

    pegar(telefono, "912-345 678");
    expect(telefono.value).toBe("912345678");
    fireEvent.click(dialogo.getByRole("button", { name: "Guardar cambios" }));

    await waitFor(() => expect(llamadaDe(fetchMock, "PATCH")).toBeTruthy());
    expect(JSON.parse(llamadaDe(fetchMock, "PATCH")?.[1]?.body as string)).toMatchObject({ telefono: "912345678" });
  });
});
