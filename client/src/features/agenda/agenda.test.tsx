import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { obtenerSocket } from "@/lib/socket";
import { useTurnosEnVivo } from "@/lib/use-turnos-en-vivo";
import { PantallaAgenda } from "./components/agenda";

const TURNO_CON_SALDO = {
  id: 41,
  codigo: "LP-000041",
  horaInicio: "18:00",
  horaFin: "19:00",
  franja: "NOCHE",
  cancha: { id: 2, nombre: "Cancha 2", tamano: "FUTBOL_7" },
  cliente: { id: 7, nombre: "Lucía Ramírez", telefono: "987654321" },
  estado: "CONFIRMADA",
  valorTurno: 80,
  adelantoPagado: 40,
  saldoPendiente: 40,
  acciones: ["CHECK_IN", "MARCAR_AUSENTE", "CANCELAR", "REUBICAR"],
};

vi.mock("@/lib/use-turnos-en-vivo", async (importOriginal) => {
  const original = await importOriginal<typeof import("@/lib/use-turnos-en-vivo")>();
  return { useTurnosEnVivo: vi.fn(original.useTurnosEnVivo) };
});

vi.mock("@/lib/socket", () => {
  let handler: ((payload: unknown) => void) | undefined;
  const socket = {
    on: vi.fn((evento: string, cb: (payload: unknown) => void) => {
      if (evento === "turnos:actualizados") handler = cb;
    }),
    off: vi.fn(),
  };
  return {
    obtenerSocket: () => socket,
    __obtenerHandler: () => handler,
  };
});

const HOY = "2026-10-20";

function turnoAgenda(
  id: number,
  horaInicio: string,
  estado: string,
  saldoPendiente: number,
  acciones: string[],
  cancha = { id: 1, nombre: "Cancha 1", tamano: "FUTBOL_5" },
) {
  const horaFin = `${String(Number(horaInicio.slice(0, 2)) + 1).padStart(2, "0")}:00`;
  return {
    ...TURNO_CON_SALDO,
    id,
    codigo: `LP-${String(id).padStart(6, "0")}`,
    horaInicio,
    horaFin,
    franja: horaInicio >= "18:00" ? "NOCHE" : "DIA",
    cancha,
    cliente: { id, nombre: `Cliente ${id}`, telefono: `98765432${id}` },
    estado,
    adelantoPagado: 80 - saldoPendiente,
    saldoPendiente,
    acciones,
  };
}

const ACCIONES_CONFIRMADA = ["CHECK_IN", "MARCAR_AUSENTE", "CANCELAR", "REUBICAR"];
const CANCHA_2 = { id: 2, nombre: "Cancha 2", tamano: "FUTBOL_7" };

/** Los 8 estados en un mismo día, con una CONFIRMADA con saldo y otra pagada. */
const DIA_COMPLETO = [
  turnoAgenda(1, "08:00", "PENDIENTE_PAGO", 80, ["CANCELAR", "REUBICAR"]),
  turnoAgenda(2, "09:00", "PENDIENTE_VALIDACION", 80, []),
  turnoAgenda(3, "10:00", "CONFIRMADA", 40, ACCIONES_CONFIRMADA, CANCHA_2),
  turnoAgenda(4, "11:00", "CONFIRMADA", 0, ACCIONES_CONFIRMADA),
  turnoAgenda(5, "12:00", "EN_JUEGO", 30, ["REGISTRAR_ADICIONALES", "FINALIZAR"]),
  turnoAgenda(6, "13:00", "FINALIZADA", 0, []),
  turnoAgenda(7, "14:00", "CANCELADA", 80, []),
  turnoAgenda(8, "15:00", "EXPIRADA", 80, []),
  turnoAgenda(9, "16:00", "AUSENTE", 40, []),
];

function cancha(id: number, tamano = "FUTBOL_5") {
  return {
    id,
    nombre: `Cancha ${id}`,
    tamano,
    iluminacion: true,
    estado: "OPERATIVA",
    activa: true,
    tieneTarifas: true,
    franjasSinTarifa: [],
  };
}

const CANCHAS = [cancha(1), cancha(2, "FUTBOL_7"), cancha(3)];

function json(datos: unknown, status = 200) {
  return new Response(JSON.stringify(datos), { status });
}

type LlamadasFetch = { mock: { calls: unknown[][] } };

/** Responde /api/canchas y /api/agenda por separado, con una respuesta nueva en cada consulta. */
function responderApi(
  agenda: unknown | ((consulta: URLSearchParams) => unknown),
  canchas: () => Response | Promise<Response> = () => json(CANCHAS),
) {
  const fetchMock = vi.fn(async (url: string) => {
    const destino = new URL(String(url), "http://localhost");
    if (destino.pathname === "/api/canchas") return canchas();
    return json(typeof agenda === "function" ? agenda(destino.searchParams) : agenda);
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

function consultasAgenda(fetchMock: LlamadasFetch = vi.mocked(fetch)) {
  return fetchMock.mock.calls
    .map(([url]) => new URL(String(url), "http://localhost"))
    .filter((destino) => destino.pathname === "/api/agenda")
    .map((destino) => destino.searchParams);
}

function ultimaConsulta(fetchMock: LlamadasFetch) {
  return consultasAgenda(fetchMock).at(-1)!;
}

function opcionesCancha() {
  return within(screen.getByLabelText("Cancha"))
    .getAllByRole("option")
    .map((opcion) => opcion.textContent);
}

/** La fila de la tabla de escritorio que empieza a esa hora. */
function filaDe(hora: string) {
  const tabla = screen.getByRole("table");
  const fila = within(tabla)
    .getAllByRole("row")
    .find((f) => f.textContent?.startsWith(`${hora}–`));
  if (!fila) throw new Error(`No hay fila de las ${hora}`);
  return fila;
}

/** La tarjeta de celular que empieza a esa hora. */
function tarjetaDe(hora: string) {
  const tarjeta = screen
    .getAllByRole("listitem")
    .find((item) => item.textContent?.startsWith(`${hora}–`));
  if (!tarjeta) throw new Error(`No hay tarjeta de las ${hora}`);
  return tarjeta;
}

/** Los elementos que describen al botón según su aria-describedby. */
function descripcionesDe(boton: HTMLElement) {
  return (boton.getAttribute("aria-describedby") ?? "")
    .split(" ")
    .filter(Boolean)
    .map((id) => document.getElementById(id));
}

function botonesDe(elemento: HTMLElement) {
  return within(elemento)
    .queryAllByRole("button")
    .map((boton) => boton.textContent);
}

/** El número de una tarjeta del resumen. */
function contador(etiqueta: string) {
  return screen.getByText(etiqueta).nextElementSibling?.textContent;
}

function listenersActivos(socket: { on: unknown; off: unknown }, evento: string) {
  const contar = (fn: unknown) =>
    (fn as { mock: { calls: [string, unknown][] } }).mock.calls.filter(([e]) => e === evento).length;
  return contar(socket.on) - contar(socket.off);
}

function renderAgenda() {
  const cliente = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={cliente}>
      <PantallaAgenda />
    </QueryClientProvider>,
  );
}

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("PantallaAgenda", () => {
  it("muestra el badge de saldo y solo los botones de sus acciones", async () => {
    responderApi([TURNO_CON_SALDO]);

    renderAgenda();

    const badges = await screen.findAllByText("Saldo S/ 40.00");
    expect(badges.length).toBeGreaterThan(0);
    for (const accion of ["Check-in", "Marcar ausente", "Cancelar", "Reubicar"]) {
      const botones = screen.getAllByRole("button", { name: accion });
      expect(botones.length).toBeGreaterThan(0);
      for (const boton of botones) {
        expect((boton as HTMLButtonElement).disabled).toBe(true);
        expect(descripcionesDe(boton).map((d) => d?.textContent)).toEqual([
          "Disponible en el próximo sprint",
        ]);
      }
    }
    expect(screen.queryByRole("button", { name: "Finalizar" })).toBeNull();
  });

  it("vuelve a pedir la agenda al recibir turnos:actualizados de la fecha mostrada", async () => {
    responderApi([TURNO_CON_SALDO]);

    renderAgenda();

    await screen.findAllByText("Saldo S/ 40.00");
    const fecha = consultasAgenda()[0].get("fecha");
    const llamadas = consultasAgenda().length;

    const socketModulo = await import("@/lib/socket");
    const handler = (socketModulo as unknown as { __obtenerHandler: () => ((payload: unknown) => void) | undefined }).__obtenerHandler();
    handler?.({ fecha, canchaId: 2 });

    await waitFor(() => {
      expect(consultasAgenda().length).toBeGreaterThan(llamadas);
    });
  });

  it("también refresca cuando el cambio afecta a todas las fechas (fecha: null)", async () => {
    responderApi([TURNO_CON_SALDO]);

    renderAgenda();

    await screen.findAllByText("Saldo S/ 40.00");
    const socketModulo = await import("@/lib/socket");
    const handler = (socketModulo as unknown as { __obtenerHandler: () => ((payload: unknown) => void) | undefined }).__obtenerHandler();
    const llamadas = consultasAgenda().length;
    handler?.({ fecha: null, canchaId: 2 });

    await waitFor(() => {
      expect(consultasAgenda().length).toBeGreaterThan(llamadas);
    });
  });

  it("usa useTurnosEnVivo con la clave de la agenda y registra un solo listener", async () => {
    responderApi([TURNO_CON_SALDO]);
    const socket = obtenerSocket();
    const antes = listenersActivos(socket, "turnos:actualizados");

    const { unmount } = renderAgenda();
    await screen.findAllByText("Saldo S/ 40.00");

    const fecha = consultasAgenda()[0].get("fecha");
    expect(useTurnosEnVivo).toHaveBeenLastCalledWith(fecha, [["agenda", fecha]]);
    expect(listenersActivos(socket, "turnos:actualizados") - antes).toBe(1);

    unmount();
    expect(listenersActivos(socket, "turnos:actualizados") - antes).toBe(0);
  });

  it("no vuelve a pedir la agenda si el evento es de otra fecha", async () => {
    responderApi([TURNO_CON_SALDO]);

    renderAgenda();

    await screen.findAllByText("Saldo S/ 40.00");
    const socketModulo = await import("@/lib/socket");
    const handler = (socketModulo as unknown as { __obtenerHandler: () => ((payload: unknown) => void) | undefined }).__obtenerHandler();
    const llamadas = consultasAgenda().length;
    handler?.({ fecha: "1999-01-01", canchaId: 2 });

    await new Promise((resolver) => setTimeout(resolver, 50));
    expect(consultasAgenda().length).toBe(llamadas);
  });
});

describe("PantallaAgenda con fecha fija", () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date(`${HOY}T15:00:00-05:00`));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("los filtros de cancha y estado cambian la consulta", async () => {
    const fetchMock = responderApi(DIA_COMPLETO);
    renderAgenda();

    await screen.findByRole("table");
    expect(ultimaConsulta(fetchMock).toString()).toBe(`fecha=${HOY}`);

    await waitFor(() => expect(opcionesCancha()).toHaveLength(4));
    fireEvent.change(screen.getByLabelText("Cancha"), { target: { value: "2" } });
    await waitFor(() => expect(ultimaConsulta(fetchMock).get("canchaId")).toBe("2"));

    fireEvent.change(screen.getByLabelText("Estado"), { target: { value: "CONFIRMADA" } });
    await waitFor(() => expect(ultimaConsulta(fetchMock).get("estado")).toBe("CONFIRMADA"));
    expect(ultimaConsulta(fetchMock).get("canchaId")).toBe("2");
    expect(ultimaConsulta(fetchMock).get("fecha")).toBe(HOY);

    fireEvent.change(screen.getByLabelText("Cancha"), { target: { value: "" } });
    await waitFor(() => expect(ultimaConsulta(fetchMock).has("canchaId")).toBe(false));
    expect(ultimaConsulta(fetchMock).get("estado")).toBe("CONFIRMADA");
  });

  it("cada estado muestra solo los botones de sus acciones, deshabilitados", async () => {
    responderApi(DIA_COMPLETO);
    renderAgenda();

    await screen.findByRole("table");
    const casos: [string, string[]][] = [
      ["08:00", ["Cancelar", "Reubicar"]],
      ["09:00", []],
      ["10:00", ["Check-in", "Marcar ausente", "Cancelar", "Reubicar"]],
      ["11:00", ["Check-in", "Marcar ausente", "Cancelar", "Reubicar"]],
      ["12:00", ["Adicionales", "Finalizar"]],
      ["13:00", []],
      ["14:00", []],
      ["15:00", []],
      ["16:00", []],
    ];

    for (const [hora, esperados] of casos) {
      for (const contenedor of [filaDe(hora), tarjetaDe(hora)]) {
        expect(botonesDe(contenedor)).toEqual(esperados);
        for (const boton of within(contenedor).queryAllByRole("button")) {
          expect((boton as HTMLButtonElement).disabled).toBe(true);
        }
      }
    }
  });

  it("el aviso de los botones deshabilitados se ve en la tabla y en la tarjeta y está asociado a cada botón", async () => {
    responderApi(DIA_COMPLETO);
    renderAgenda();

    await screen.findByRole("table");
    const ids = new Set<string>();
    for (const contenedor of [filaDe("10:00"), tarjetaDe("10:00")]) {
      const aviso = within(contenedor).getByText("Disponible en el próximo sprint");
      expect(aviso.closest("[aria-hidden='true'], [hidden], .sr-only")).toBeNull();
      ids.add(aviso.id);

      const botones = within(contenedor).getAllByRole("button");
      expect(botones).toHaveLength(4);
      for (const boton of botones) {
        expect(descripcionesDe(boton)).toEqual([aviso]);
        expect(boton.hasAttribute("title")).toBe(false);
      }
    }
    expect(ids.size).toBe(2);

    for (const contenedor of [filaDe("09:00"), tarjetaDe("09:00")]) {
      expect(within(contenedor).queryByText("Disponible en el próximo sprint")).toBeNull();
    }
  });

  it("una confirmada con saldo lleva borde y badge de saldo, y una pagada lleva Pagada", async () => {
    responderApi(DIA_COMPLETO);
    renderAgenda();

    await screen.findByRole("table");
    const conSaldo = filaDe("10:00");
    const pagada = filaDe("11:00");

    expect(within(conSaldo).getByText("Saldo S/ 40.00")).toBeTruthy();
    expect(within(conSaldo).queryByText("Pagada")).toBeNull();
    expect(conSaldo.className).toContain("border-alerta");

    expect(within(pagada).getByText("Pagada")).toBeTruthy();
    expect(within(pagada).queryByText(/^Saldo S\//)).toBeNull();
    expect(pagada.className).not.toContain("border-alerta");

    expect(within(tarjetaDe("10:00")).getByText("Saldo S/ 40.00")).toBeTruthy();
    expect(within(tarjetaDe("11:00")).getByText("Pagada")).toBeTruthy();
    for (const hora of ["08:00", "12:00", "14:00"]) {
      expect(within(filaDe(hora)).queryByText(/^Saldo S\/|^Pagada$/)).toBeNull();
    }
  });

  it("los contadores cuentan solo los turnos que corresponden a cada resumen", async () => {
    responderApi(DIA_COMPLETO);
    renderAgenda();

    await screen.findByRole("table");

    expect(contador("Turnos del día")).toBe("6");
    expect(contador("Con saldo pendiente")).toBe("2");
    expect(contador("Pendientes de pago")).toBe("1");
  });

  it("los contadores se calculan sobre la lista mostrada", async () => {
    responderApi([DIA_COMPLETO[2], DIA_COMPLETO[3], DIA_COMPLETO[6]]);
    renderAgenda();

    await screen.findByRole("table");

    expect(contador("Turnos del día")).toBe("2");
    expect(contador("Con saldo pendiente")).toBe("1");
    expect(contador("Pendientes de pago")).toBe("0");
  });

  it("un día sin reservas muestra el mensaje de vacío", async () => {
    responderApi([]);
    renderAgenda();

    expect(await screen.findByText("No hay reservas para este día")).toBeTruthy();
    expect(screen.queryByRole("table")).toBeNull();
  });

  it("las flechas mueven la fecha consultada y Hoy vuelve al día actual", async () => {
    const fetchMock = responderApi(DIA_COMPLETO);
    renderAgenda();

    await screen.findByRole("table");
    expect(ultimaConsulta(fetchMock).get("fecha")).toBe(HOY);

    fireEvent.click(screen.getByRole("button", { name: "Día siguiente" }));
    await waitFor(() => expect(ultimaConsulta(fetchMock).get("fecha")).toBe("2026-10-21"));
    expect(screen.getByText("Turnos del día 21/10/2026")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Día anterior" }));
    fireEvent.click(screen.getByRole("button", { name: "Día anterior" }));
    await waitFor(() => expect(screen.getByText("Turnos del día 19/10/2026")).toBeTruthy());
    expect(consultasAgenda(fetchMock).map((p) => p.get("fecha"))).toContain("2026-10-19");

    fireEvent.click(screen.getByRole("button", { name: "Hoy" }));
    expect(screen.getByText("Turnos del día 20/10/2026")).toBeTruthy();
  });

  it("el campo de fecha cambia la agenda pedida", async () => {
    const fetchMock = responderApi(DIA_COMPLETO);
    renderAgenda();

    await screen.findByRole("table");
    const campo = screen.getByLabelText("Fecha") as HTMLInputElement;
    expect(campo.value).toBe(HOY);
    expect(screen.getByText("20/10/2026")).toBeTruthy();

    fireEvent.change(campo, { target: { value: "2026-11-09" } });

    await waitFor(() => expect(ultimaConsulta(fetchMock).get("fecha")).toBe("2026-11-09"));
    expect(screen.getByText("09/11/2026")).toBeTruthy();
    expect(screen.getByText("Turnos del día 09/11/2026")).toBeTruthy();
  });

  it("las flechas y Hoy actualizan el campo de fecha", async () => {
    responderApi(DIA_COMPLETO);
    renderAgenda();

    await screen.findByRole("table");
    const campo = screen.getByLabelText("Fecha") as HTMLInputElement;

    fireEvent.change(campo, { target: { value: "2026-11-09" } });
    fireEvent.click(screen.getByRole("button", { name: "Día siguiente" }));
    expect(campo.value).toBe("2026-11-10");
    expect(screen.getByText("10/11/2026")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Día anterior" }));
    fireEvent.click(screen.getByRole("button", { name: "Día anterior" }));
    expect(campo.value).toBe("2026-11-08");

    fireEvent.click(screen.getByRole("button", { name: "Hoy" }));
    expect(campo.value).toBe(HOY);
    expect(screen.getByText("20/10/2026")).toBeTruthy();
  });

  it("vaciar el campo de fecha no cambia la agenda pedida", async () => {
    const fetchMock = responderApi(DIA_COMPLETO);
    renderAgenda();

    await screen.findByRole("table");
    const campo = screen.getByLabelText("Fecha") as HTMLInputElement;
    fireEvent.change(campo, { target: { value: "" } });

    expect(campo.value).toBe(HOY);
    expect(consultasAgenda(fetchMock).every((consulta) => consulta.get("fecha") === HOY)).toBe(true);
  });

  it("cruza bien el cambio de mes y de año", async () => {
    vi.setSystemTime(new Date("2026-12-31T15:00:00-05:00"));
    const fetchMock = responderApi([]);
    renderAgenda();

    await screen.findByText("No hay reservas para este día");
    fireEvent.click(screen.getByRole("button", { name: "Día siguiente" }));

    await waitFor(() => expect(ultimaConsulta(fetchMock).get("fecha")).toBe("2027-01-01"));
  });

  it("el filtro de cancha lista todas las canchas aunque no tengan reservas ese día", async () => {
    responderApi((consulta: URLSearchParams) =>
      consulta.get("fecha") === HOY ? [DIA_COMPLETO[0]] : [],
    );
    renderAgenda();

    await screen.findByRole("table");
    await waitFor(() =>
      expect(opcionesCancha()).toEqual(["Todas las canchas", "Cancha 1", "Cancha 2", "Cancha 3"]),
    );

    fireEvent.click(screen.getByRole("button", { name: "Día siguiente" }));
    await screen.findByText("No hay reservas para este día");
    expect(opcionesCancha()).toEqual(["Todas las canchas", "Cancha 1", "Cancha 2", "Cancha 3"]);
  });

  it("mientras cargan las canchas el filtro solo ofrece todas y la agenda se muestra", async () => {
    responderApi(DIA_COMPLETO, () => new Promise<Response>(() => {}));
    renderAgenda();

    await screen.findByRole("table");
    expect(opcionesCancha()).toEqual(["Todas las canchas"]);
    expect(screen.queryByText("No se pudo cargar la lista de canchas")).toBeNull();
  });

  it("si fallan las canchas el filtro avisa y la agenda se muestra", async () => {
    const fetchMock = responderApi(DIA_COMPLETO, () =>
      json({ statusCode: 500, message: "Error interno" }, 500),
    );
    renderAgenda();

    expect(await screen.findByText("No se pudo cargar la lista de canchas")).toBeTruthy();
    expect(screen.getByRole("table")).toBeTruthy();
    expect(opcionesCancha()).toEqual(["Todas las canchas"]);

    fireEvent.change(screen.getByLabelText("Estado"), { target: { value: "CONFIRMADA" } });
    await waitFor(() => expect(ultimaConsulta(fetchMock).get("estado")).toBe("CONFIRMADA"));
  });
});
