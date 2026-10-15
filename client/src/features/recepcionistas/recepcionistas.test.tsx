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
});
