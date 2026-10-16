import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ProveedorToast } from "@/components/ui";
import type { CanchaOpcion, Tarifas } from "./api";
import { PantallaTarifas } from "./components/pantalla-tarifas";

const router = { push: vi.fn() };

vi.mock("next/navigation", () => ({
  useRouter: () => router,
}));

const CANCHAS: CanchaOpcion[] = [
  { id: 1, nombre: "Cancha 1" },
  { id: 2, nombre: "Cancha 2" },
];

const ANA = { id: 7, nombre: "Ana Torres" };
const LUIS = { id: 8, nombre: "Luis Quispe" };

const TARIFAS_CANCHA_1: Tarifas = {
  dia: { valor: 55.05, vigenteDesde: "2026-10-01T14:00:00.000Z" },
  noche: { valor: 80, vigenteDesde: "2026-10-16T01:30:00.000Z" },
  historial: [
    {
      id: 3,
      franja: "NOCHE",
      valor: 80,
      valorAnterior: 70,
      vigenteDesde: "2026-10-16T01:30:00.000Z",
      vigenteHasta: null,
      creadoPor: LUIS,
    },
    {
      id: 2,
      franja: "DIA",
      valor: 55.05,
      valorAnterior: null,
      vigenteDesde: "2026-10-01T14:00:00.000Z",
      vigenteHasta: null,
      creadoPor: ANA,
    },
    {
      id: 1,
      franja: "NOCHE",
      valor: 70,
      valorAnterior: null,
      vigenteDesde: "2026-09-01T14:00:00.000Z",
      vigenteHasta: "2026-10-16T01:30:00.000Z",
      creadoPor: ANA,
    },
  ],
};

const TARIFAS_CANCHA_2: Tarifas = {
  dia: null,
  noche: { valor: 90, vigenteDesde: "2026-10-02T14:00:00.000Z" },
  historial: [
    {
      id: 4,
      franja: "NOCHE",
      valor: 90,
      valorAnterior: null,
      vigenteDesde: "2026-10-02T14:00:00.000Z",
      vigenteHasta: null,
      creadoPor: ANA,
    },
  ],
};

type Respuesta = { status: number; body?: unknown } | "red";
type Rutas = Record<string, Respuesta | Respuesta[]>;

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  router.push.mockReset();
});

function responder(rutas: Rutas) {
  const fetchMock = vi.fn(async (url: string, opciones?: RequestInit) => {
    const definida = rutas[`${opciones?.method ?? "GET"} ${url}`];
    const respuesta = Array.isArray(definida) ? (definida.length > 1 ? definida.shift() : definida[0]) : definida;
    if (respuesta === "red") throw new TypeError("Failed to fetch");
    const { status, body } = respuesta ?? { status: 500 };
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
        <PantallaTarifas />
      </ProveedorToast>
    </QueryClientProvider>,
  );
}

function llamadas(fetchMock: ReturnType<typeof responder>, metodo: string, url: string) {
  return fetchMock.mock.calls.filter(([u, opciones]) => (opciones?.method ?? "GET") === metodo && u === url);
}

async function tarjeta(nombre: "Día" | "Noche") {
  const titulo = await screen.findByRole("heading", { name: nombre, level: 2 });
  return within(titulo.closest("header")?.parentElement as HTMLElement);
}

function rutasBase(extra: Rutas = {}): Rutas {
  return {
    "GET /api/canchas": { status: 200, body: CANCHAS },
    "GET /api/canchas/1/tarifas": { status: 200, body: TARIFAS_CANCHA_1 },
    "GET /api/canchas/2/tarifas": { status: 200, body: TARIFAS_CANCHA_2 },
    ...extra,
  };
}

describe("Pantalla de tarifas", () => {
  it("carga las canchas y muestra las tarifas de la primera con su adelanto", async () => {
    const fetchMock = responder(rutasBase());
    renderPantalla();

    const dia = await tarjeta("Día");
    expect(dia.getByText("S/ 55.05")).toBeTruthy();
    expect(dia.getByText("Rige desde el 01/10/2026")).toBeTruthy();
    expect(dia.getByText("Adelanto (50 %): S/ 27.53")).toBeTruthy();
    expect(dia.getByLabelText("Nuevo valor por hora")).toHaveProperty("value", "55.05");

    const noche = await tarjeta("Noche");
    expect(noche.getByText("S/ 80.00")).toBeTruthy();
    expect(noche.getByText("Rige desde el 15/10/2026")).toBeTruthy();
    expect(noche.getByText("Adelanto (50 %): S/ 40.00")).toBeTruthy();
    expect(noche.getByText("Franja noche")).toBeTruthy();

    const select = screen.getByLabelText("Cancha") as HTMLSelectElement;
    expect(select.value).toBe("1");
    expect(within(select).getAllByRole("option").map((opcion) => opcion.textContent)).toEqual(["Cancha 1", "Cancha 2"]);
    expect(llamadas(fetchMock, "GET", "/api/canchas/1/tarifas")).toHaveLength(1);
  });

  it("muestra el historial con fecha y hora de Lima y la vigente con su badge", async () => {
    responder(rutasBase());
    renderPantalla();

    const tabla = await screen.findByRole("table", { name: "Historial de tarifas" });
    const filas = within(tabla).getAllByRole("row").slice(1) as HTMLTableRowElement[];
    expect(filas.map((fila) => Array.from(fila.cells).map((celda) => celda.textContent))).toEqual([
      ["Noche", "S/ 70.00", "S/ 80.00", "Luis Quispe", "15/10/2026 20:30", "Vigente"],
      ["Día", "—", "S/ 55.05", "Ana Torres", "01/10/2026 09:00", "Vigente"],
      ["Noche", "—", "S/ 70.00", "Ana Torres", "01/09/2026 09:00", "15/10/2026 20:30"],
    ]);
  });

  it("al cambiar de cancha vuelve a pedir sus tarifas y muestra Sin tarifa en la franja vacía", async () => {
    const fetchMock = responder(rutasBase());
    renderPantalla();
    await (await tarjeta("Día")).findByText("S/ 55.05");

    fireEvent.change(screen.getByLabelText("Cancha"), { target: { value: "2" } });

    const dia = await tarjeta("Día");
    expect(await dia.findByText("Sin tarifa")).toBeTruthy();
    expect(dia.queryByText(/Adelanto/)).toBeNull();
    expect(dia.queryByText(/Rige desde/)).toBeNull();
    expect(dia.getByLabelText("Nuevo valor por hora")).toHaveProperty("value", "");
    expect((await tarjeta("Noche")).getByText("S/ 90.00")).toBeTruthy();
    expect(llamadas(fetchMock, "GET", "/api/canchas/2/tarifas")).toHaveLength(1);
  });

  it("guardar envía el PUT de la franja, muestra el toast y vuelve a pedir las tarifas", async () => {
    const actualizadas: Tarifas = {
      ...TARIFAS_CANCHA_1,
      noche: { valor: 85.5, vigenteDesde: "2026-10-16T02:00:00.000Z" },
    };
    const fetchMock = responder(
      rutasBase({
        "GET /api/canchas/1/tarifas": [
          { status: 200, body: TARIFAS_CANCHA_1 },
          { status: 200, body: actualizadas },
        ],
        "PUT /api/canchas/1/tarifas": {
          status: 200,
          body: { franja: "NOCHE", valor: 85.5, vigenteDesde: "2026-10-16T02:00:00.000Z" },
        },
      }),
    );
    renderPantalla();

    const noche = await tarjeta("Noche");
    fireEvent.change(noche.getByLabelText("Nuevo valor por hora"), { target: { value: "85,5" } });
    fireEvent.click(noche.getByRole("button", { name: "Guardar" }));

    expect((await screen.findByRole("status")).textContent).toBe("Tarifa de noche guardada");
    const [put] = llamadas(fetchMock, "PUT", "/api/canchas/1/tarifas");
    expect(JSON.parse(put[1]?.body as string)).toEqual({ franja: "NOCHE", valor: 85.5 });
    expect(await noche.findByText("S/ 85.50")).toBeTruthy();
    expect(noche.getByLabelText("Nuevo valor por hora")).toHaveProperty("value", "85.50");
    expect(llamadas(fetchMock, "GET", "/api/canchas/1/tarifas")).toHaveLength(2);
  });

  it("el valor no acepta letras ni signos, es de texto decimal y guarda el número limpio", async () => {
    const fetchMock = responder(
      rutasBase({
        "PUT /api/canchas/1/tarifas": {
          status: 200,
          body: { franja: "DIA", valor: 60.5, vigenteDesde: "2026-10-16T02:00:00.000Z" },
        },
      }),
    );
    renderPantalla();

    const dia = await tarjeta("Día");
    const valor = dia.getByLabelText("Nuevo valor por hora") as HTMLInputElement;
    expect(valor.type).toBe("text");
    expect(valor.inputMode).toBe("decimal");

    fireEvent.change(valor, { target: { value: "abc" } });
    expect(valor.value).toBe("");
    fireEvent.paste(valor, { clipboardData: { getData: () => "S/ -6a0,505" } });
    fireEvent.change(valor, { target: { value: "S/ -6a0,505" } });
    expect(valor.value).toBe("60.50");
    fireEvent.click(dia.getByRole("button", { name: "Guardar" }));

    expect((await screen.findByRole("status")).textContent).toBe("Tarifa de día guardada");
    const [put] = llamadas(fetchMock, "PUT", "/api/canchas/1/tarifas");
    expect(JSON.parse(put[1]?.body as string)).toEqual({ franja: "DIA", valor: 60.5 });
  });

  it("no envía nada si el valor no es mayor que 0", async () => {
    const fetchMock = responder(rutasBase());
    renderPantalla();

    const dia = await tarjeta("Día");
    fireEvent.change(dia.getByLabelText("Nuevo valor por hora"), { target: { value: "0" } });
    fireEvent.click(dia.getByRole("button", { name: "Guardar" }));

    expect(await dia.findByText("El valor debe ser mayor que 0")).toBeTruthy();
    expect(dia.getByLabelText("Nuevo valor por hora").getAttribute("aria-invalid")).toBe("true");
    expect(llamadas(fetchMock, "PUT", "/api/canchas/1/tarifas")).toHaveLength(0);
  });

  it("con un error visible, corregir el valor lo quita sin salir del campo", async () => {
    responder(rutasBase());
    renderPantalla();

    const dia = await tarjeta("Día");
    const valor = dia.getByLabelText("Nuevo valor por hora");
    fireEvent.change(valor, { target: { value: "0" } });
    fireEvent.click(dia.getByRole("button", { name: "Guardar" }));
    expect(await dia.findByText("El valor debe ser mayor que 0")).toBeTruthy();

    fireEvent.change(valor, { target: { value: "60" } });

    await waitFor(() => expect(dia.queryByText("El valor debe ser mayor que 0")).toBeNull());
    expect(valor.getAttribute("aria-invalid")).toBe("false");
  });

  it("un 400 del servidor se muestra debajo del campo", async () => {
    responder(
      rutasBase({
        "PUT /api/canchas/1/tarifas": {
          status: 400,
          body: {
            statusCode: 400,
            message: "El valor no puede ser mayor que 9999.99",
            errores: { valor: "El valor no puede ser mayor que 9999.99" },
          },
        },
      }),
    );
    renderPantalla();

    const dia = await tarjeta("Día");
    fireEvent.change(dia.getByLabelText("Nuevo valor por hora"), { target: { value: "60" } });
    fireEvent.click(dia.getByRole("button", { name: "Guardar" }));

    expect(await dia.findByText("El valor no puede ser mayor que 9999.99")).toBeTruthy();
    expect(dia.getByLabelText("Nuevo valor por hora").getAttribute("aria-invalid")).toBe("true");
    expect(screen.queryByRole("status")).toBeNull();
  });

  it("un 409 del servidor se muestra como alerta en la tarjeta", async () => {
    const mensaje = "La tarifa cambió mientras se guardaba, vuelve a intentarlo";
    responder(
      rutasBase({
        "PUT /api/canchas/1/tarifas": { status: 409, body: { statusCode: 409, message: mensaje, errores: {} } },
      }),
    );
    renderPantalla();

    const noche = await tarjeta("Noche");
    fireEvent.change(noche.getByLabelText("Nuevo valor por hora"), { target: { value: "95" } });
    fireEvent.click(noche.getByRole("button", { name: "Guardar" }));

    expect((await noche.findByRole("alert")).textContent).toBe(mensaje);
  });
});

describe("Estados de la pantalla de tarifas", () => {
  it("muestra el esqueleto mientras cargan las canchas y las tarifas", async () => {
    let soltarTarifas: (respuesta: Response) => void = () => {};
    vi.stubGlobal(
      "fetch",
      vi.fn((url: string) =>
        url === "/api/canchas"
          ? Promise.resolve(new Response(JSON.stringify(CANCHAS), { status: 200 }))
          : new Promise<Response>((resolver) => {
              soltarTarifas = resolver;
            }),
      ),
    );
    renderPantalla();

    expect(screen.getAllByTestId("esqueleto-tarifas")).toHaveLength(1);
    expect(screen.queryByLabelText("Cancha")).toBeNull();

    await screen.findByLabelText("Cancha");
    expect(screen.getByTestId("esqueleto-tarifas")).toBeTruthy();

    soltarTarifas(new Response(JSON.stringify(TARIFAS_CANCHA_1), { status: 200 }));
    await screen.findByRole("table", { name: "Historial de tarifas" });
    expect(screen.queryByTestId("esqueleto-tarifas")).toBeNull();
  });

  it("si falla la red al pedir las canchas muestra el error y Reintentar las vuelve a pedir", async () => {
    const fetchMock = responder(rutasBase({ "GET /api/canchas": ["red", { status: 200, body: CANCHAS }] }));
    renderPantalla();

    const alerta = await screen.findByRole("alert");
    expect(within(alerta).getByText("No se pudo conectar con el servidor")).toBeTruthy();

    fireEvent.click(within(alerta).getByRole("button", { name: "Reintentar" }));

    expect(await screen.findByLabelText("Cancha")).toBeTruthy();
    expect(screen.queryByRole("alert")).toBeNull();
    expect(llamadas(fetchMock, "GET", "/api/canchas")).toHaveLength(2);
  });

  it("si falla la red al pedir las tarifas mantiene el selector y permite reintentar", async () => {
    const fetchMock = responder(
      rutasBase({ "GET /api/canchas/1/tarifas": ["red", { status: 200, body: TARIFAS_CANCHA_1 }] }),
    );
    renderPantalla();

    const alerta = await screen.findByRole("alert");
    expect(within(alerta).getByText("No se pudo conectar con el servidor")).toBeTruthy();
    expect(screen.getByLabelText("Cancha")).toBeTruthy();

    fireEvent.click(within(alerta).getByRole("button", { name: "Reintentar" }));

    expect(await (await tarjeta("Día")).findByText("S/ 55.05")).toBeTruthy();
    expect(llamadas(fetchMock, "GET", "/api/canchas/1/tarifas")).toHaveLength(2);
  });

  it("sin canchas muestra el estado vacío con el acceso a canchas y no pide tarifas", async () => {
    const fetchMock = responder({ "GET /api/canchas": { status: 200, body: [] } });
    renderPantalla();

    expect(await screen.findByText("Todavía no hay canchas. Crea una para definir sus tarifas.")).toBeTruthy();
    expect(screen.queryByLabelText("Cancha")).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Ir a canchas" }));
    expect(router.push).toHaveBeenCalledWith("/admin/canchas");
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
  });
});
