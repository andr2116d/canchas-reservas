import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { obtenerSocket } from "@/lib/socket";
import { useTurnosEnVivo } from "@/lib/use-turnos-en-vivo";
import type { Disponibilidad } from "./api";
import { PantallaDisponibilidad } from "./components/pantalla-disponibilidad";
import { limiteInferior, limiteSuperior, sumarDias } from "./fechas";

const push = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));

vi.mock("@/lib/use-turnos-en-vivo", async (importOriginal) => {
  const original = await importOriginal<typeof import("@/lib/use-turnos-en-vivo")>();
  return { useTurnosEnVivo: vi.fn(original.useTurnosEnVivo) };
});

let emitirTurnos: ((payload: unknown) => void) | undefined;
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
    __handler: () => handler,
    __capturar: (cb: (payload: unknown) => void) => {
      handler = cb;
    },
  };
});

const FECHA = "2026-10-20";

const CANCHA_1 = {
  id: 1,
  nombre: "Cancha 1",
  tamano: "FUTBOL_5" as const,
  iluminacion: true,
  turnos: [
    { horaInicio: "17:00", horaFin: "18:00", franja: "DIA" as const, estado: "DISPONIBLE" as const, seleccionable: true, valor: 60, adelanto: 30 },
    { horaInicio: "18:00", horaFin: "19:00", franja: "NOCHE" as const, estado: "DISPONIBLE" as const, seleccionable: false, motivo: "SIN_TARIFA" as const },
  ],
};

const CANCHA_2 = {
  id: 2,
  nombre: "Cancha 2",
  tamano: "FUTBOL_7" as const,
  iluminacion: false,
  turnos: [
    { horaInicio: "17:00", horaFin: "18:00", franja: "DIA" as const, estado: "PENDIENTE" as const, seleccionable: false },
    { horaInicio: "18:00", horaFin: "19:00", franja: "NOCHE" as const, estado: "OCUPADO" as const, seleccionable: false },
  ],
};

const DIA_LLENO: Disponibilidad = { fecha: FECHA, abierto: true, canchas: [CANCHA_1, CANCHA_2] };

const DIA_ESTADOS: Disponibilidad = {
  fecha: FECHA,
  abierto: true,
  canchas: [
    {
      ...CANCHA_1,
      turnos: [
        CANCHA_1.turnos[0],
        { horaInicio: "18:00", horaFin: "19:00", franja: "NOCHE", estado: "PENDIENTE", seleccionable: false },
        { horaInicio: "19:00", horaFin: "20:00", franja: "NOCHE", estado: "OCUPADO", seleccionable: false },
      ],
    },
    {
      id: 3,
      nombre: "Cancha 3",
      tamano: "FUTBOL_7",
      iluminacion: false,
      turnos: [
        { horaInicio: "17:00", horaFin: "18:00", franja: "DIA", estado: "EN_MANTENIMIENTO", seleccionable: false },
        { horaInicio: "18:00", horaFin: "19:00", franja: "NOCHE", estado: "EN_MANTENIMIENTO", seleccionable: false },
        { horaInicio: "19:00", horaFin: "20:00", franja: "NOCHE", estado: "EN_MANTENIMIENTO", seleccionable: false },
      ],
    },
  ],
};

/** El turno de la grilla de escritorio para una cancha (por su posición) y una hora. */
function celda(tabla: HTMLElement, cancha: number, hora: string) {
  const fila = (within(tabla).getAllByRole("row") as HTMLTableRowElement[]).find(
    (f) => f.cells[0]?.textContent === hora,
  );
  const turno = fila?.cells[cancha + 1]?.firstElementChild;
  if (!turno) throw new Error(`No hay turno de ${hora} en la columna ${cancha}`);
  return turno as HTMLElement;
}

function muestraDe(etiqueta: string) {
  const item = Array.from(document.querySelectorAll("li")).find((li) => li.textContent === etiqueta);
  const muestra = item?.querySelector("span[aria-hidden]");
  if (!muestra) throw new Error(`La leyenda no tiene "${etiqueta}"`);
  return muestra;
}

function clasesDeFondo(elemento: Element) {
  return Array.from(elemento.classList).filter((clase) => clase.startsWith("bg-"));
}

function responder(respuestas: Disponibilidad[]) {
  const cola = [...respuestas];
  const fetchMock = vi.fn(async () => {
    const cuerpo = cola.length > 1 ? cola.shift()! : cola[0];
    return new Response(JSON.stringify(cuerpo), { status: 200 });
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

function responderError() {
  const fetchMock = vi.fn(async () =>
    new Response(JSON.stringify({ statusCode: 500, message: "No se pudo cargar la disponibilidad" }), {
      status: 500,
    }),
  );
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

function listenersActivos(socket: { on: unknown; off: unknown }, evento: string) {
  const contar = (fn: unknown) =>
    (fn as { mock: { calls: [string, unknown][] } }).mock.calls.filter(([e]) => e === evento).length;
  return contar(socket.on) - contar(socket.off);
}

/** Las URLs pedidas, para comprobar qué fecha se consultó. */
function urlsPedidas(fetchMock: { mock: { calls: unknown[][] } }) {
  return fetchMock.mock.calls.map(([url]) => String(url));
}

function renderPantalla(rol: "JUGADOR" | "RECEPCIONISTA" = "JUGADOR") {
  return renderEnFecha(FECHA, rol);
}

function renderEnFecha(fecha: string, rol: "JUGADOR" | "RECEPCIONISTA" = "JUGADOR") {
  const cliente = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={cliente}>
      <PantallaDisponibilidad rol={rol} fechaInicial={fecha} />
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  push.mockClear();
  emitirTurnos = undefined;
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("PantallaDisponibilidad", () => {
  it("muestra una columna por cancha y una fila por hora", async () => {
    responder([DIA_LLENO]);
    renderPantalla();

    const tabla = await screen.findByRole("table");
    const encabezados = within(tabla).getAllByRole("columnheader").map((c) => c.textContent);
    expect(encabezados.some((t) => t?.includes("Cancha 1"))).toBe(true);
    expect(encabezados.some((t) => t?.includes("Cancha 2"))).toBe(true);

    const filas = within(tabla).getAllByRole("row") as HTMLTableRowElement[];
    const horas = filas.slice(1).map((f) => f.cells[0]?.textContent);
    expect(horas).toEqual(["17:00", "18:00"]);
  });

  it("un turno disponible muestra precio y adelanto mínimo", async () => {
    responder([DIA_LLENO]);
    renderPantalla();

    expect(await screen.findAllByText("S/ 60.00")).not.toHaveLength(0);
    expect(screen.getAllByText("Adelanto S/ 30.00").length).toBeGreaterThan(0);
  });

  it("muestra el motivo en los turnos no seleccionables", async () => {
    responder([DIA_LLENO]);
    renderPantalla();

    expect((await screen.findAllByText("Sin tarifa")).length).toBeGreaterThan(0);
    expect(screen.getAllByText("Pendiente").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Ocupado").length).toBeGreaterThan(0);
  });

  it("al tocar un turno disponible lleva a la pantalla de confirmación", async () => {
    responder([DIA_LLENO]);
    renderPantalla();

    const celdas = await screen.findAllByRole("button", { name: /17:00/ });
    fireEvent.click(celdas[0]);

    expect(push).toHaveBeenCalledWith(
      `/jugador/reservas/confirmar?canchaId=1&fecha=${FECHA}&horaInicio=17%3A00`,
    );
  });

  it("en recepción el turno no navega a ningún lado", async () => {
    responder([DIA_LLENO]);
    renderPantalla("RECEPCIONISTA");

    const celdas = await screen.findAllByRole("button", { name: /17:00/ });
    fireEvent.click(celdas[0]);

    expect(push).not.toHaveBeenCalled();
  });

  it("una cancha en mantenimiento muestra todos sus turnos en mantenimiento", async () => {
    responder([DIA_ESTADOS]);
    renderPantalla();

    const tabla = await screen.findByRole("table");
    for (const hora of ["17:00", "18:00", "19:00"]) {
      const turno = celda(tabla, 1, hora);
      expect(turno.tagName).toBe("DIV");
      expect(turno.textContent).toContain("En mantenimiento");
    }
  });

  it("cada estado se ve con su etiqueta y el color de su muestra en la leyenda", async () => {
    responder([DIA_ESTADOS]);
    renderPantalla();

    const tabla = await screen.findByRole("table");
    const casos = [
      { etiqueta: "Disponible", turno: celda(tabla, 0, "17:00"), texto: "S/ 60.00" },
      { etiqueta: "Pendiente", turno: celda(tabla, 0, "18:00"), texto: "Pendiente" },
      { etiqueta: "Ocupado", turno: celda(tabla, 0, "19:00"), texto: "Ocupado" },
      { etiqueta: "En mantenimiento", turno: celda(tabla, 1, "17:00"), texto: "En mantenimiento" },
    ];

    for (const { etiqueta, turno, texto } of casos) {
      expect(turno.textContent).toContain(texto);
      const fondos = clasesDeFondo(muestraDe(etiqueta));
      expect(fondos.length).toBeGreaterThan(0);
      for (const clase of fondos) expect(turno.classList.contains(clase)).toBe(true);
    }
  });

  it("deshabilita la flecha del día anterior en el límite inferior", async () => {
    responder([DIA_LLENO]);
    renderEnFecha(limiteInferior());

    expect(screen.getByRole("button", { name: "Día anterior" }).hasAttribute("disabled")).toBe(true);
    expect(screen.getByRole("button", { name: "Día siguiente" }).hasAttribute("disabled")).toBe(false);
  });

  it("deshabilita la flecha del día siguiente en el límite superior", async () => {
    responder([DIA_LLENO]);
    renderEnFecha(limiteSuperior());

    expect(screen.getByRole("button", { name: "Día siguiente" }).hasAttribute("disabled")).toBe(true);
    expect(screen.getByRole("button", { name: "Día anterior" }).hasAttribute("disabled")).toBe(false);
  });

  it("cada flecha apunta en la dirección que mueve la fecha", () => {
    responder([DIA_LLENO]);
    renderEnFecha(limiteInferior());

    const anterior = screen.getByRole("button", { name: "Día anterior" });
    const siguiente = screen.getByRole("button", { name: "Día siguiente" });

    const trazoDe = (boton: HTMLElement) => boton.querySelector("path")?.getAttribute("d");
    // La flecha de "anterior" es la que base apunta a la izquierda; la de "siguiente" es su espejo.
    expect(trazoDe(anterior)).toBe("m15 18-6-6 6-6");
    expect(trazoDe(siguiente)).toBe("m9 18 6-6-6-6");
  });

  it("la flecha del día siguiente cambia la fecha que se consulta", async () => {
    const fetchMock = responder([DIA_LLENO]);
    renderEnFecha(limiteInferior());
    await screen.findByRole("table");

    fireEvent.click(screen.getByRole("button", { name: "Día siguiente" }));

    const esperada = sumarDias(limiteInferior(), 1);
    await waitFor(() => expect(urlsPedidas(fetchMock).some((url) => url.includes(`fecha=${esperada}`))).toBe(true));
    expect((screen.getByLabelText("Fecha") as HTMLInputElement).value).toBe(esperada);
  });

  it("un día cerrado avisa que no hay horario", async () => {
    responder([{ fecha: FECHA, abierto: false, canchas: [] }]);
    renderPantalla();

    expect(await screen.findByText(/No hay horario de reservas el 20\/10\/2026/)).toBeTruthy();
  });

  it("ante un error de red muestra el mensaje y Reintentar vuelve a pedir los datos", async () => {
    const fetchMock = responderError();
    renderPantalla();

    fireEvent.click(await screen.findByRole("button", { name: "Reintentar" }));

    expect(screen.getByText("No se pudo cargar la disponibilidad")).toBeTruthy();
    await waitFor(() => expect(fetchMock.mock.calls.length).toBeGreaterThan(1));
  });

  it("al recibir el evento la grilla vuelve a pedir datos y el turno cambia de estado", async () => {
    const ocupado: Disponibilidad = {
      fecha: FECHA,
      abierto: true,
      canchas: [
        {
          ...CANCHA_1,
          turnos: [
            { horaInicio: "17:00", horaFin: "18:00", franja: "DIA", estado: "OCUPADO", seleccionable: false },
            CANCHA_1.turnos[1],
          ],
        },
      ],
    };
    const fetchMock = responder([DIA_LLENO, ocupado]);
    renderPantalla();

    await screen.findAllByRole("button", { name: /17:00/ });
    const antes = fetchMock.mock.calls.length;

    const { obtenerSocket } = await import("@/lib/socket");
    const socket = obtenerSocket();
    const registro = (socket.on as unknown as { mock: { calls: [string, (p: unknown) => void][] } }).mock.calls
      .find(([evento]) => evento === "turnos:actualizados");
    emitirTurnos = registro?.[1];
    emitirTurnos?.({ fecha: FECHA, canchaId: 1 });

    await waitFor(() => expect(fetchMock.mock.calls.length).toBeGreaterThan(antes));
    await waitFor(() => expect(screen.queryByRole("button", { name: /17:00/ })).toBeNull());
    expect((await screen.findAllByText("Ocupado")).length).toBeGreaterThan(0);
  });

  it("usa useTurnosEnVivo con la clave de la disponibilidad y registra un solo listener", async () => {
    responder([DIA_LLENO]);
    const socket = obtenerSocket();
    const antes = listenersActivos(socket, "turnos:actualizados");

    const { unmount } = renderPantalla();
    await screen.findAllByRole("button", { name: /17:00/ });

    expect(useTurnosEnVivo).toHaveBeenLastCalledWith(FECHA, [["disponibilidad", FECHA]]);
    expect(listenersActivos(socket, "turnos:actualizados") - antes).toBe(1);

    unmount();
    expect(listenersActivos(socket, "turnos:actualizados") - antes).toBe(0);
  });
});
