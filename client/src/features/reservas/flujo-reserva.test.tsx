import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { useEffect, useState } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ProveedorToast } from "@/components/ui/toast";
import type { Disponibilidad } from "@/features/disponibilidad/api";
import { PantallaDisponibilidad } from "@/features/disponibilidad/components/pantalla-disponibilidad";
import { PantallaConfirmarReserva } from "./components/confirmar-reserva";
import { PantallaReservas } from "./components/mis-reservas";

let rutaActual = "";
let navegar: (ruta: string) => void = () => {};

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: (ruta: string) => navegar(ruta) }),
  useSearchParams: () => new URLSearchParams(rutaActual.split("?")[1] ?? ""),
}));

vi.mock("@/lib/socket", () => ({
  obtenerSocket: () => ({ on: vi.fn(), off: vi.fn() }),
}));

const FECHA = "2026-10-20";
const GRILLA = "/jugador/disponibilidad";
const MIS_RESERVAS = "/jugador/reservas";

function disponibilidad(estado: "DISPONIBLE" | "PENDIENTE"): Disponibilidad {
  const libre = estado === "DISPONIBLE";
  return {
    fecha: FECHA,
    abierto: true,
    canchas: [
      {
        id: 2,
        nombre: "Cancha 2",
        tamano: "FUTBOL_5",
        iluminacion: true,
        turnos: [
          {
            horaInicio: "18:00",
            horaFin: "19:00",
            franja: "NOCHE",
            estado,
            seleccionable: libre,
            ...(libre && { valor: 60, adelanto: 30 }),
          },
        ],
      },
    ],
  };
}

const RESUMEN = {
  cancha: { id: 2, nombre: "Cancha 2", tamano: "FUTBOL_5" },
  fecha: FECHA,
  horaInicio: "18:00",
  horaFin: "19:00",
  franja: "NOCHE",
  valorTurno: 60,
  adelanto: 30,
  saldo: 30,
  creditoDisponible: 0,
  minutosParaPagar: 15,
  regla: { horasAnticipacion: 24, tipoCompensacion: "CREDITO", plazoLimite: "2026-10-19T23:00:00.000Z" },
};

const CREADA = { id: 7, codigo: "LP7K2M9Q", estado: "PENDIENTE_PAGO", venceEn: "2026-10-20T18:15:00.000Z" };

const MIA = { id: 7, codigo: "LP7K2M9Q", fecha: FECHA, horaInicio: "18:00", horaFin: "19:00", estado: "PENDIENTE_PAGO" };

function json(cuerpo: unknown, status = 200) {
  return new Response(JSON.stringify(cuerpo), { status });
}

function servidor({ crear, grillas }: { crear: Response; grillas: Disponibilidad[] }) {
  const cola = [...grillas];
  let mias: unknown[] = [];
  const fetchMock = vi.fn(async (url: string, opciones?: RequestInit) => {
    if (url.startsWith("/api/disponibilidad")) return json(cola.length > 1 ? cola.shift() : cola[0]);
    if (url.startsWith("/api/reservas/resumen")) return json(RESUMEN);
    if (url === "/api/reservas/mias") return json(mias);
    if (url === "/api/reservas" && opciones?.method === "POST") {
      if (crear.ok) mias = [MIA];
      return crear;
    }
    throw new Error(`Ruta no esperada: ${url}`);
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

function llamadasA(fetchMock: { mock: { calls: unknown[][] } }, prefijo: string) {
  return fetchMock.mock.calls.filter(([url]) => String(url).startsWith(prefijo)).length;
}

function Pantalla() {
  const [ruta, setRuta] = useState(rutaActual);
  useEffect(() => {
    navegar = (nueva) => {
      rutaActual = nueva;
      setRuta(nueva);
    };
  }, []);
  if (ruta.startsWith("/jugador/reservas/confirmar")) return <PantallaConfirmarReserva />;
  if (ruta === MIS_RESERVAS) return <PantallaReservas />;
  return <PantallaDisponibilidad rol="JUGADOR" fechaInicial={FECHA} />;
}

function renderApp(inicio: string) {
  rutaActual = inicio;
  const cliente = new QueryClient({
    defaultOptions: { queries: { staleTime: 30_000, refetchOnWindowFocus: false, retry: false } },
  });
  return render(
    <QueryClientProvider client={cliente}>
      <ProveedorToast>
        <Pantalla />
      </ProveedorToast>
    </QueryClientProvider>,
  );
}

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("flujo de reserva", () => {
  it("desde la grilla reserva un turno, ve el código y se vuelven a pedir sus reservas y la grilla", async () => {
    const fetchMock = servidor({
      crear: json(CREADA, 201),
      grillas: [disponibilidad("DISPONIBLE"), disponibilidad("PENDIENTE")],
    });
    renderApp(MIS_RESERVAS);
    await screen.findByText("No tienes reservas todavía");

    act(() => navegar(GRILLA));
    fireEvent.click((await screen.findAllByRole("button", { name: /18:00/ }))[0]);

    expect(rutaActual).toBe(`/jugador/reservas/confirmar?canchaId=2&fecha=${FECHA}&horaInicio=18%3A00`);
    fireEvent.click(await screen.findByRole("button", { name: "Confirmar reserva" }));
    expect(String(fetchMock.mock.calls.find(([url]) => String(url).startsWith("/api/reservas/resumen"))?.[0])).toBe(
      `/api/reservas/resumen?canchaId=2&fecha=${FECHA}&horaInicio=18%3A00`,
    );

    await screen.findByText("LP7K2M9Q");
    const grillasAntes = llamadasA(fetchMock, "/api/disponibilidad");
    const miasAntes = llamadasA(fetchMock, "/api/reservas/mias");

    fireEvent.click(screen.getByRole("button", { name: "Volver a la grilla" }));
    await waitFor(() => expect(llamadasA(fetchMock, "/api/disponibilidad")).toBe(grillasAntes + 1));
    expect((await screen.findAllByText("Pendiente")).length).toBeGreaterThan(0);

    act(() => navegar(MIS_RESERVAS));
    await screen.findByText("LP7K2M9Q");
    expect(llamadasA(fetchMock, "/api/reservas/mias")).toBe(miasAntes + 1);
  });
});
