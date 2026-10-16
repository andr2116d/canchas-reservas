import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { ItemCambio, Pagina } from "./api";
import { PantallaActividad } from "./components/pantalla-actividad";

type Respuesta = { status: number; body?: unknown } | "red";

const ADMIN = { id: 1, nombre: "Admin La Previa", rol: "ADMINISTRADOR" as const };

const cambio = (datos: Partial<ItemCambio>): ItemCambio => ({
  id: 1,
  fecha: "2026-10-16T15:42:00.000Z",
  usuario: ADMIN,
  accion: "EDITAR",
  entidad: "CANCHA",
  entidadId: 3,
  referencia: "Cancha 1",
  motivo: null,
  cambios: [],
  ...datos,
});

const pagina = <T,>(items: T[], extra: Partial<Pagina<T>> = {}): Pagina<T> => ({
  items,
  total: items.length,
  pagina: 1,
  tamano: 20,
  ...extra,
});

const CAMBIOS: ItemCambio[] = [
  cambio({
    id: 7,
    entidad: "TARIFA",
    entidadId: 30,
    referencia: "Cancha 1 · Noche",
    cambios: [{ campo: "valor", anterior: 80, nuevo: 90.5 }],
  }),
  cambio({
    id: 6,
    entidad: "HORARIO",
    entidadId: null,
    referencia: "Horario",
    cambios: [
      { campo: "dia.7", anterior: "08:00-23:00", nuevo: "CERRADO" },
      { campo: "inicioNoche", anterior: "18:00", nuevo: "19:00" },
    ],
  }),
  cambio({
    id: 5,
    entidad: "REGLA_CANCELACION",
    entidadId: 1,
    referencia: "Regla de cancelación",
    cambios: [
      { campo: "horasAnticipacion", anterior: 24, nuevo: 12 },
      { campo: "tipoCompensacion", anterior: "CREDITO", nuevo: "DEVOLUCION" },
    ],
  }),
  cambio({
    id: 4,
    accion: "CREAR",
    entidad: "RESERVA",
    entidadId: 50,
    referencia: "LP7K2M9Q",
    usuario: { id: 9, nombre: "Luis Ramos", rol: "JUGADOR" },
    cambios: [
      { campo: "cancha", anterior: null, nuevo: "Cancha 1" },
      { campo: "fecha", anterior: null, nuevo: "2026-10-20" },
      { campo: "horaInicio", anterior: null, nuevo: "18:00" },
      { campo: "valorTurno", anterior: null, nuevo: 80 },
      { campo: "adelantoMinimo", anterior: null, nuevo: 40 },
    ],
  }),
  cambio({
    id: 3,
    accion: "DESACTIVAR",
    cambios: [
      { campo: "estado", anterior: "OPERATIVA", nuevo: "EN_MANTENIMIENTO" },
      { campo: "activa", anterior: true, nuevo: false },
    ],
  }),
  cambio({ id: 2, accion: "EXPIRAR", entidad: "RESERVA", referencia: "QW3E4R5T", usuario: null, motivo: "Sin pago" }),
];

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

function responder(responder: (ruta: string, query: URLSearchParams) => Respuesta | Respuesta[]) {
  const colas = new Map<string, Respuesta[]>();
  const fetchMock = vi.fn(async (url: string) => {
    const [ruta, texto] = url.split("?");
    let definida = responder(ruta, new URLSearchParams(texto));
    if (Array.isArray(definida)) {
      const cola = colas.get(ruta) ?? colas.set(ruta, [...definida]).get(ruta)!;
      definida = cola.length > 1 ? cola.shift()! : cola[0];
    }
    if (definida === "red") throw new TypeError("Failed to fetch");
    return new Response(definida.body === undefined ? null : JSON.stringify(definida.body), { status: definida.status });
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

function consultas(fetchMock: ReturnType<typeof responder>, ruta: string) {
  return fetchMock.mock.calls
    .map(([url]) => String(url).split("?"))
    .filter(([r]) => r === ruta)
    .map(([, query]) => Object.fromEntries(new URLSearchParams(query)));
}

function renderPantalla() {
  const cliente = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={cliente}>
      <PantallaActividad />
    </QueryClientProvider>,
  );
}

const tabla = async () => within(await screen.findByRole("table", { name: "Cambios" }));
const filaDe = async (texto: string) => within((await (await tabla()).findByText(texto)).closest("tr") as HTMLElement);

describe("Actividad: pestaña Cambios", () => {
  it("muestra la carga mientras llega la primera página", async () => {
    responder(() => ({ status: 200, body: pagina(CAMBIOS) }));
    renderPantalla();

    expect(screen.getByRole("status", { name: "Cargando cambios" })).toBeTruthy();
    expect(await screen.findByRole("table", { name: "Cambios" })).toBeTruthy();
    expect(screen.queryByRole("status", { name: "Cargando cambios" })).toBeNull();
  });

  it("pide la primera página de 20 al abrir", async () => {
    const fetchMock = responder(() => ({ status: 200, body: pagina(CAMBIOS) }));
    renderPantalla();
    await tabla();

    expect(consultas(fetchMock, "/api/auditoria")).toEqual([{ pagina: "1", tamano: "20" }]);
  });

  it("sin registros muestra el vacío", async () => {
    responder(() => ({ status: 200, body: pagina([]) }));
    renderPantalla();

    expect(await screen.findByText("No hay cambios registrados")).toBeTruthy();
    expect(screen.queryByRole("table")).toBeNull();
  });

  it("si falla muestra el error y Reintentar vuelve a pedir", async () => {
    const fetchMock = responder(() => [
      { status: 500, body: { statusCode: 500, message: "No se pudo cargar la actividad", errores: {} } },
      { status: 200, body: pagina(CAMBIOS) },
    ]);
    renderPantalla();

    const alerta = await screen.findByRole("alert");
    expect(within(alerta).getByText("No se pudo cargar la actividad")).toBeTruthy();
    fireEvent.click(within(alerta).getByRole("button", { name: "Reintentar" }));

    expect(await screen.findByRole("table", { name: "Cambios" })).toBeTruthy();
    expect(consultas(fetchMock, "/api/auditoria")).toHaveLength(2);
  });

  it("sin conexión muestra el mensaje de red", async () => {
    responder(() => "red");
    renderPantalla();

    expect(await screen.findByText("No se pudo conectar con el servidor")).toBeTruthy();
  });

  it("muestra fecha y hora en Lima, usuario con rol, acción y qué cambió", async () => {
    responder(() => ({ status: 200, body: pagina(CAMBIOS) }));
    renderPantalla();

    const tarifa = await filaDe("Cancha 1 · Noche");
    expect(tarifa.getByText("16/10/2026 10:42")).toBeTruthy();
    expect(tarifa.getByText("Admin La Previa")).toBeTruthy();
    expect(tarifa.getByText("Administrador")).toBeTruthy();
    expect(tarifa.getByText("Editó")).toBeTruthy();
    expect(tarifa.getByText("Tarifa")).toBeTruthy();
    expect(tarifa.getByText("Valor: S/ 80.00 → S/ 90.50")).toBeTruthy();
  });

  it("traduce el horario, la regla, la reserva y los estados a texto legible", async () => {
    responder(() => ({ status: 200, body: pagina(CAMBIOS) }));
    renderPantalla();

    const horario = await filaDe("Inicio de noche: 18:00 → 19:00");
    expect(horario.getByText("Domingo: 08:00 – 23:00 → Cerrado")).toBeTruthy();
    expect(horario.getByText("Inicio de noche: 18:00 → 19:00")).toBeTruthy();

    const regla = await filaDe("Horas de anticipación: 24 h → 12 h");
    expect(regla.getByText("Horas de anticipación: 24 h → 12 h")).toBeTruthy();
    expect(regla.getByText("Compensación: Crédito → Devolución")).toBeTruthy();

    const reserva = await filaDe("LP7K2M9Q");
    expect(reserva.getByText("Luis Ramos")).toBeTruthy();
    expect(reserva.getByText("Jugador")).toBeTruthy();
    expect(reserva.getByText("Creó")).toBeTruthy();
    expect(reserva.getByText("Cancha: Cancha 1")).toBeTruthy();
    expect(reserva.getByText("Fecha: 20/10/2026")).toBeTruthy();
    expect(reserva.getByText("Hora: 18:00")).toBeTruthy();
    expect(reserva.getByText("Valor del turno: S/ 80.00")).toBeTruthy();
    expect(reserva.getByText("Adelanto mínimo: S/ 40.00")).toBeTruthy();

    const cancha = await filaDe("Desactivó");
    expect(cancha.getByText("Estado: Operativa → En mantenimiento")).toBeTruthy();
    expect(cancha.getByText("Activa: Sí → No")).toBeTruthy();
  });

  it("un proceso automático aparece como Sistema y muestra el motivo", async () => {
    responder(() => ({ status: 200, body: pagina(CAMBIOS) }));
    renderPantalla();

    const expirada = await filaDe("QW3E4R5T");
    expect(expirada.getByText("Sistema")).toBeTruthy();
    expect(expirada.getByText("Expirar")).toBeTruthy();
    expect(expirada.getByText("Sin cambios")).toBeTruthy();
    expect(expirada.getByText("Motivo: Sin pago")).toBeTruthy();
  });

  it("en celular cada cambio se muestra como tarjeta con los mismos datos", async () => {
    responder(() => ({ status: 200, body: pagina(CAMBIOS) }));
    renderPantalla();
    await tabla();

    const lista = screen.getByRole("list", { name: "Cambios" });
    const tarjetas = within(lista).getAllByRole("listitem").filter((li) => li.parentElement === lista);
    expect(tarjetas).toHaveLength(CAMBIOS.length);
    expect(within(tarjetas[0]).getByText("Valor: S/ 80.00 → S/ 90.50")).toBeTruthy();
    expect(within(tarjetas[0]).getByText("Fecha y hora")).toBeTruthy();
  });
});

describe("Actividad: filtros y paginación de cambios", () => {
  const MENSAJE_RANGO = "La fecha hasta no puede ser anterior a la fecha desde";

  const elegir = (etiqueta: string, valor: string) =>
    fireEvent.change(screen.getByLabelText(etiqueta), { target: { value: valor } });

  const ultima = (fetchMock: ReturnType<typeof responder>) => consultas(fetchMock, "/api/auditoria").at(-1);

  it("entidad y acción cambian la consulta", async () => {
    const fetchMock = responder(() => ({ status: 200, body: pagina(CAMBIOS) }));
    renderPantalla();
    await tabla();

    elegir("Qué", "TARIFA");
    await waitFor(() => expect(ultima(fetchMock)).toEqual({ entidad: "TARIFA", pagina: "1", tamano: "20" }));
    elegir("Acción", "EDITAR");
    await waitFor(() =>
      expect(ultima(fetchMock)).toEqual({ entidad: "TARIFA", accion: "EDITAR", pagina: "1", tamano: "20" }),
    );
    elegir("Qué", "");
    await waitFor(() => expect(ultima(fetchMock)).toEqual({ accion: "EDITAR", pagina: "1", tamano: "20" }));
  });

  it("el rango de fechas va en la consulta", async () => {
    const fetchMock = responder(() => ({ status: 200, body: pagina(CAMBIOS) }));
    renderPantalla();
    await tabla();

    elegir("Desde", "2026-10-01");
    elegir("Hasta", "2026-10-16");

    await waitFor(() =>
      expect(ultima(fetchMock)).toEqual({ desde: "2026-10-01", hasta: "2026-10-16", pagina: "1", tamano: "20" }),
    );
    expect(screen.getByLabelText("Hasta").getAttribute("min")).toBe("2026-10-01");
  });

  it("pagina hacia adelante y atrás con el total del server", async () => {
    const fetchMock = responder((_ruta, query) => ({
      status: 200,
      body: pagina([cambio({ id: Number(query.get("pagina")), referencia: `Cancha de la página ${query.get("pagina")}` })], {
        total: 45,
        pagina: Number(query.get("pagina")),
      }),
    }));
    renderPantalla();

    await filaDe("Cancha de la página 1");
    expect(screen.getByText("Página 1 de 3 · 45 registros")).toBeTruthy();
    const anterior = () => screen.getByRole("button", { name: "Anterior" }) as HTMLButtonElement;
    const siguiente = () => screen.getByRole("button", { name: "Siguiente" }) as HTMLButtonElement;
    expect(anterior().disabled).toBe(true);

    fireEvent.click(siguiente());
    await filaDe("Cancha de la página 2");
    expect(anterior().disabled).toBe(false);
    fireEvent.click(siguiente());
    await filaDe("Cancha de la página 3");
    expect(screen.getByText("Página 3 de 3 · 45 registros")).toBeTruthy();
    expect(siguiente().disabled).toBe(true);
    fireEvent.click(anterior());
    await filaDe("Cancha de la página 2");

    expect(consultas(fetchMock, "/api/auditoria").map((q) => q.pagina)).toEqual(["1", "2", "3", "2"]);
  });

  it("cambiar un filtro vuelve a la página 1", async () => {
    const fetchMock = responder((_ruta, query) => ({
      status: 200,
      body: pagina(CAMBIOS, { total: 45, pagina: Number(query.get("pagina")) }),
    }));
    renderPantalla();
    await tabla();

    fireEvent.click(screen.getByRole("button", { name: "Siguiente" }));
    await waitFor(() => expect(ultima(fetchMock)?.pagina).toBe("2"));
    elegir("Acción", "ELIMINAR");

    await waitFor(() => expect(ultima(fetchMock)).toEqual({ accion: "ELIMINAR", pagina: "1", tamano: "20" }));
  });

  it("con filtros sin resultados muestra el vacío de filtros", async () => {
    responder((_ruta, query) => ({ status: 200, body: pagina(query.get("accion") ? [] : CAMBIOS) }));
    renderPantalla();
    await tabla();

    elegir("Acción", "ELIMINAR");

    expect(await screen.findByText("No hay cambios con estos filtros")).toBeTruthy();
    expect(screen.getByLabelText("Acción")).toBeTruthy();
  });

  it("si el server rechaza el rango muestra el error debajo de Hasta", async () => {
    responder((_ruta, query) =>
      query.get("hasta")
        ? { status: 400, body: { statusCode: 400, message: MENSAJE_RANGO, errores: { hasta: MENSAJE_RANGO } } }
        : { status: 200, body: pagina(CAMBIOS) },
    );
    renderPantalla();
    await tabla();

    elegir("Hasta", "2026-01-01");

    const hasta = screen.getByLabelText("Hasta");
    await waitFor(() => expect(hasta.getAttribute("aria-invalid")).toBe("true"));
    expect(document.getElementById(hasta.getAttribute("aria-describedby")!)?.textContent).toBe(MENSAJE_RANGO);
    expect(screen.queryByRole("button", { name: "Reintentar" })).toBeNull();
  });
});
