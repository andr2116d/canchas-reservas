import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { ProveedorToast } from "@/components/ui";
import { hoyEnLima } from "@/lib/formato";
import type { Horario, TurnoPrevisto } from "./api";
import { PantallaHorario } from "./components/pantalla-horario";

const SEMANA: Horario = {
  dias: [
    { diaSemana: 1, abierto: true, apertura: "08:00", cierre: "23:00" },
    { diaSemana: 2, abierto: true, apertura: "08:00", cierre: "23:00" },
    { diaSemana: 3, abierto: true, apertura: "08:00", cierre: "23:00" },
    { diaSemana: 4, abierto: true, apertura: "08:00", cierre: "23:00" },
    { diaSemana: 5, abierto: true, apertura: "08:00", cierre: "23:00" },
    { diaSemana: 6, abierto: true, apertura: "08:00", cierre: "23:00" },
    { diaSemana: 7, abierto: false, apertura: null, cierre: null },
  ],
  inicioNoche: "18:00",
};

const TURNOS: TurnoPrevisto[] = [
  { horaInicio: "08:00", horaFin: "09:00", franja: "DIA" },
  { horaInicio: "17:00", horaFin: "18:00", franja: "DIA" },
  { horaInicio: "18:00", horaFin: "19:00", franja: "NOCHE" },
  { horaInicio: "22:00", horaFin: "23:00", franja: "NOCHE" },
];

const FUERA = [
  { id: 40, cancha: "Cancha 1", fecha: "2026-10-20", horaInicio: "07:00", jugador: "Diego Soto" },
  { id: 41, cancha: "Cancha 2", fecha: "2026-10-21", horaInicio: "23:00", jugador: "Ana Pérez" },
];

type Respuesta = { status: number; body?: unknown };
type Rutas = Record<string, Respuesta | Respuesta[]>;

const MENSAJE_FUERA = "Hay reservas que quedan fuera del nuevo horario. Confirma para guardar igual";

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

function rutasDeHorario(extra: Rutas = {}): Rutas {
  return {
    "GET /api/horario": { status: 200, body: SEMANA },
    [`GET /api/horario/vista-previa?fecha=${hoyEnLima()}`]: { status: 200, body: TURNOS },
    ...extra,
  };
}

function renderPantalla() {
  const cliente = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={cliente}>
      <ProveedorToast>
        <PantallaHorario />
      </ProveedorToast>
    </QueryClientProvider>,
  );
}

function cuerpos(fetchMock: ReturnType<typeof responder>, metodo: string) {
  return fetchMock.mock.calls
    .filter(([, opciones]) => opciones?.method === metodo)
    .map(([, opciones]) => JSON.parse(opciones?.body as string));
}

describe("Horario", () => {
  it("muestra los 7 días con sus horas y deshabilita el domingo que está cerrado", async () => {
    responder(rutasDeHorario());
    renderPantalla();

    const filas = await screen.findAllByRole("listitem");
    expect(filas).toHaveLength(7);
    const lunes = screen.getByLabelText("Apertura del lunes") as HTMLInputElement;
    expect(lunes.value).toBe("08:00");
    expect((screen.getByLabelText("Cierre del lunes") as HTMLInputElement).value).toBe("23:00");
    expect((screen.getByLabelText("Abre domingo") as HTMLInputElement).checked).toBe(false);
    expect((screen.getByLabelText("Apertura del domingo") as HTMLInputElement).disabled).toBe(true);
    expect((screen.getByLabelText("Cierre del domingo") as HTMLInputElement).disabled).toBe(true);
  });

  it("guarda los 7 días y la hora de inicio de la noche", async () => {
    const fetchMock = responder(
      rutasDeHorario({ "PUT /api/horario": { status: 200, body: SEMANA } }),
    );
    renderPantalla();

    fireEvent.change(await screen.findByLabelText("La noche empieza a las"), { target: { value: "18:40" } });
    fireEvent.click(screen.getByLabelText("Abre domingo"));
    fireEvent.change(screen.getByLabelText("Apertura del domingo"), { target: { value: "09:00" } });
    fireEvent.change(screen.getByLabelText("Cierre del domingo"), { target: { value: "22:00" } });
    fireEvent.click(screen.getByRole("button", { name: "Guardar horario" }));

    expect((await screen.findByRole("status")).textContent).toBe("Horario guardado");
    expect(cuerpos(fetchMock, "PUT")).toEqual([
      {
        dias: [
          { diaSemana: 1, abierto: true, apertura: "08:00", cierre: "23:00" },
          { diaSemana: 2, abierto: true, apertura: "08:00", cierre: "23:00" },
          { diaSemana: 3, abierto: true, apertura: "08:00", cierre: "23:00" },
          { diaSemana: 4, abierto: true, apertura: "08:00", cierre: "23:00" },
          { diaSemana: 5, abierto: true, apertura: "08:00", cierre: "23:00" },
          { diaSemana: 6, abierto: true, apertura: "08:00", cierre: "23:00" },
          { diaSemana: 7, abierto: true, apertura: "09:00", cierre: "22:00" },
        ],
        inicioNoche: "18:40",
      },
    ]);
  });

  it("los campos de hora son de texto de 24 horas con teclado numérico", async () => {
    responder(rutasDeHorario());
    renderPantalla();

    const campos = [
      await screen.findByLabelText("Apertura del lunes"),
      screen.getByLabelText("Cierre del lunes"),
      screen.getByLabelText("La noche empieza a las"),
    ] as HTMLInputElement[];
    for (const campo of campos) {
      expect(campo.type).toBe("text");
      expect(campo.inputMode).toBe("numeric");
      expect(campo.placeholder).toBe("HH:MM");
      expect(campo.maxLength).toBe(5);
    }
    expect(campos.map((campo) => campo.value)).toEqual(["08:00", "23:00", "18:00"]);
  });

  it("al escribir pone los dos puntos y al borrar con retroceso no se atasca", async () => {
    const fetchMock = responder(
      rutasDeHorario({ "PUT /api/horario": { status: 200, body: SEMANA } }),
    );
    renderPantalla();
    const noche = (await screen.findByLabelText("La noche empieza a las")) as HTMLInputElement;
    const escribir = (valor: string) => fireEvent.input(noche, { target: { value: valor }, inputType: "insertText" });
    const asignarValor = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!;
    const borrar = (valor: string, cursor = valor.length) => {
      asignarValor.call(noche, valor);
      noche.setSelectionRange(cursor, cursor);
      fireEvent.input(noche, { inputType: "deleteContentBackward" });
    };

    borrar("18:0");
    expect(noche.value).toBe("18:0");
    borrar("18:");
    expect(noche.value).toBe("18:");
    borrar("18");
    expect(noche.value).toBe("18");
    borrar("1");
    expect(noche.value).toBe("1");
    escribir("19");
    escribir("193");
    expect(noche.value).toBe("19:3");
    escribir("19:30");
    expect(noche.value).toBe("19:30");

    borrar("1930", 2);
    expect(noche.value).toBe("1930");
    expect(noche.selectionStart).toBe(2);
    borrar("130", 1);
    expect(noche.value).toBe("130");
    escribir("1830");
    expect(noche.value).toBe("18:30");

    fireEvent.click(screen.getByRole("button", { name: "Guardar horario" }));
    expect((await screen.findByRole("status")).textContent).toBe("Horario guardado");
    expect(cuerpos(fetchMock, "PUT")[0]).toMatchObject({ inicioNoche: "18:30" });
  });

  it("no guarda cuando el cierre no es posterior a la apertura", async () => {
    const fetchMock = responder(rutasDeHorario());
    renderPantalla();

    const cierre = await screen.findByLabelText("Cierre del martes");
    fireEvent.change(cierre, { target: { value: "07:00" } });
    fireEvent.click(screen.getByRole("button", { name: "Guardar horario" }));

    await waitFor(() => expect(cierre.getAttribute("aria-invalid")).toBe("true"));
    expect(document.getElementById(cierre.getAttribute("aria-describedby")!)?.textContent).toBe(
      "La hora de cierre debe ser posterior a la apertura",
    );
    expect(cuerpos(fetchMock, "PUT")).toEqual([]);
  });

  it("muestra en el campo el 400 que devuelve el server", async () => {
    responder(
      rutasDeHorario({
        "PUT /api/horario": {
          status: 400,
          body: {
            statusCode: 400,
            message: "La hora debe tener el formato HH:mm, de 00:00 a 23:59",
            errores: { "dias.0.cierre": "La hora debe tener el formato HH:mm, de 00:00 a 23:59" },
          },
        },
      }),
    );
    renderPantalla();

    await screen.findByLabelText("Cierre del lunes");
    fireEvent.click(screen.getByRole("button", { name: "Guardar horario" }));

    const cierre = await screen.findByLabelText("Cierre del lunes");
    await waitFor(() => expect(cierre.getAttribute("aria-invalid")).toBe("true"));
    expect(document.getElementById(cierre.getAttribute("aria-describedby")!)?.textContent).toBe(
      "La hora debe tener el formato HH:mm, de 00:00 a 23:59",
    );
  });

  it("muestra los turnos del día con la marca de la franja noche", async () => {
    responder(rutasDeHorario());
    renderPantalla();

    const lista = await screen.findByRole("list", { name: "Turnos del día" });
    const turnos = within(lista).getAllByRole("listitem");
    expect(turnos).toHaveLength(4);
    expect(turnos[0].textContent).toContain("08:00 – 09:00");
    expect(within(turnos[0]).getByText("Día")).toBeTruthy();
    expect(within(turnos[2]).getByText("Noche").className).toContain("bg-noche-900");
  });

  it("al recibir 409 lista las reservas fuera y Guardar igual confirma", async () => {
    const fetchMock = responder(
      rutasDeHorario({
        "PUT /api/horario": [
          { status: 409, body: { statusCode: 409, message: MENSAJE_FUERA, errores: {}, reservasFueraDeHorario: FUERA } },
          { status: 200, body: SEMANA },
        ],
      }),
    );
    renderPantalla();

    fireEvent.change(await screen.findByLabelText("La noche empieza a las"), { target: { value: "19:00" } });
    fireEvent.click(screen.getByRole("button", { name: "Guardar horario" }));

    const lista = await screen.findByRole("list", { name: "Reservas fuera de horario" });
    const reservas = within(lista).getAllByRole("listitem");
    expect(reservas).toHaveLength(2);
    expect(reservas[0].textContent).toContain("Cancha 1");
    expect(reservas[0].textContent).toContain("20/10/2026");
    expect(reservas[0].textContent).toContain("07:00");
    expect(reservas[1].textContent).toContain("Ana Pérez");

    fireEvent.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Guardar igual" }));

    expect((await screen.findByRole("status")).textContent).toBe("Horario guardado");
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(cuerpos(fetchMock, "PUT")).toEqual([
      expect.objectContaining({ inicioNoche: "19:00" }),
      expect.objectContaining({ inicioNoche: "19:00", confirmar: true }),
    ]);
  });
});