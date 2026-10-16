import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { BarraSuperior } from "@/components/layout/barra-superior";
import {
  INTERVALO_COMPARTIR_MS,
  LIMITE_INACTIVIDAD_MS,
  TemporizadorInactividad,
} from "./components/temporizador-inactividad";

const router = vi.hoisted(() => ({ replace: vi.fn(), push: vi.fn() }));
vi.mock("next/navigation", () => ({
  useRouter: () => router,
  usePathname: () => "/admin",
}));

const CLAVE_ACTIVIDAD = "la-previa:actividad";
const CLAVE_CIERRE = "la-previa:sesion-cerrada";
const MINUTO = 60 * 1000;

function responder(rutas: Record<string, { status: number; cuerpo?: unknown }>) {
  const fetchSimulado = vi.fn().mockImplementation(async (url: string) => {
    const { status, cuerpo } = rutas[url] ?? { status: 404 };
    return new Response(cuerpo === undefined ? null : JSON.stringify(cuerpo), { status });
  });
  vi.stubGlobal("fetch", fetchSimulado);
  return fetchSimulado;
}

function renderizar(ui: React.ReactNode) {
  const cliente = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(<QueryClientProvider client={cliente}>{ui}</QueryClientProvider>);
  return cliente;
}

const llamoLogout = (fetchSimulado: ReturnType<typeof responder>) =>
  fetchSimulado.mock.calls.some(([url]) => url === "/api/auth/logout");

function actividadEnOtraPestana() {
  localStorage.setItem(CLAVE_ACTIVIDAD, String(Date.now()));
}

function entregarAOtraPestana(valor = localStorage.getItem(CLAVE_CIERRE), clave = CLAVE_CIERRE) {
  act(() => {
    window.dispatchEvent(new StorageEvent("storage", { key: clave, newValue: valor }));
  });
}

const sesion = { id: 1, nombres: "Luis", apellidos: "Paz", correo: "luis@laprevia.pe", rol: "ADMINISTRADOR" };
const sinSesion = { status: 401, cuerpo: { statusCode: 401, message: "Sin sesión", errores: {} } };

const avanzar = (ms: number) => act(() => vi.advanceTimersByTimeAsync(ms));

beforeEach(() => {
  router.replace.mockReset();
  localStorage.clear();
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("inactividad entre pestañas", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  it("la actividad en otra pestaña evita el cierre y reprograma por el tiempo que falta", async () => {
    const fetchSimulado = responder({ "/api/auth/logout": { status: 204 } });
    renderizar(<TemporizadorInactividad />);

    await avanzar(14 * MINUTO);
    actividadEnOtraPestana();
    await avanzar(MINUTO);
    expect(llamoLogout(fetchSimulado)).toBe(false);

    await avanzar(14 * MINUTO - 1);
    expect(llamoLogout(fetchSimulado)).toBe(false);
    await avanzar(1);
    expect(llamoLogout(fetchSimulado)).toBe(true);
  });

  it("si ninguna pestaña tuvo actividad en 15 minutos cierra la sesión", async () => {
    const fetchSimulado = responder({ "/api/auth/logout": { status: 204 } });
    actividadEnOtraPestana();
    renderizar(<TemporizadorInactividad />);

    await avanzar(LIMITE_INACTIVIDAD_MS);
    expect(llamoLogout(fetchSimulado)).toBe(true);
    await act(() => vi.runAllTimersAsync());
    expect(router.replace).toHaveBeenCalledWith("/login?motivo=inactividad");
  });

  it("comparte su actividad como máximo cada 5 segundos y guarda la última", async () => {
    responder({});
    renderizar(<TemporizadorInactividad />);
    const alMontar = Number(localStorage.getItem(CLAVE_ACTIVIDAD));
    expect(alMontar).toBe(Date.now());

    await avanzar(1000);
    fireEvent.click(document.body);
    await avanzar(2000);
    fireEvent.keyDown(document.body);
    const ultimaTecla = Date.now();
    expect(Number(localStorage.getItem(CLAVE_ACTIVIDAD))).toBe(alMontar);

    await avanzar(INTERVALO_COMPARTIR_MS - 3000);
    expect(Number(localStorage.getItem(CLAVE_ACTIVIDAD))).toBe(ultimaTecla);
  });

  it("sin acceso a localStorage cuenta solo su propia actividad", async () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("bloqueado");
    });
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("bloqueado");
    });
    const fetchSimulado = responder({ "/api/auth/logout": { status: 204 } });
    renderizar(<TemporizadorInactividad />);

    await avanzar(LIMITE_INACTIVIDAD_MS - 1);
    expect(llamoLogout(fetchSimulado)).toBe(false);
    await avanzar(1);
    expect(llamoLogout(fetchSimulado)).toBe(true);
  });
});

describe("cierre de sesión entre pestañas", () => {
  it("cerrar sesión en una pestaña lleva a la otra a /login y limpia su cache", async () => {
    responder({ "/api/auth/me": { status: 200, cuerpo: sesion }, "/api/auth/logout": { status: 204 } });
    const otraPestana = renderizar(<TemporizadorInactividad />);
    otraPestana.setQueryData(["sesion"], sesion);
    renderizar(<BarraSuperior />);

    fireEvent.click(await screen.findByRole("button", { name: "Cerrar sesión" }));
    await waitFor(() => expect(router.replace).toHaveBeenCalledWith("/login"));
    expect(JSON.parse(localStorage.getItem(CLAVE_CIERRE)!).motivo).toBe("manual");

    router.replace.mockReset();
    entregarAOtraPestana();
    expect(router.replace).toHaveBeenCalledWith("/login");
    expect(otraPestana.getQueryData(["sesion"])).toBeUndefined();
  });

  it("si la sesión ya venció, Cerrar sesión igual lleva a /login y avisa a las demás", async () => {
    responder({ "/api/auth/me": { status: 200, cuerpo: sesion }, "/api/auth/logout": sinSesion });
    renderizar(<BarraSuperior />);

    fireEvent.click(await screen.findByRole("button", { name: "Cerrar sesión" }));
    await waitFor(() => expect(router.replace).toHaveBeenCalledWith("/login"));
    expect(JSON.parse(localStorage.getItem(CLAVE_CIERRE)!).motivo).toBe("manual");
  });

  it("al cerrar por inactividad deja el aviso con su motivo", async () => {
    vi.useFakeTimers();
    responder({ "/api/auth/logout": { status: 204 } });
    renderizar(<TemporizadorInactividad />);

    await avanzar(LIMITE_INACTIVIDAD_MS);
    await act(() => vi.runAllTimersAsync());
    expect(JSON.parse(localStorage.getItem(CLAVE_CIERRE)!).motivo).toBe("inactividad");
  });

  it("un cierre por inactividad en otra pestaña lleva a /login?motivo=inactividad", () => {
    responder({});
    const cliente = renderizar(<TemporizadorInactividad />);
    cliente.setQueryData(["sesion"], sesion);

    entregarAOtraPestana(JSON.stringify({ motivo: "inactividad", en: Date.now() }));
    expect(router.replace).toHaveBeenCalledWith("/login?motivo=inactividad");
    expect(cliente.getQueryData(["sesion"])).toBeUndefined();
  });

  it("ignora otras claves y avisos con un motivo desconocido", () => {
    responder({});
    renderizar(<TemporizadorInactividad />);

    entregarAOtraPestana(JSON.stringify({ motivo: "https://otro.sitio", en: 1 }));
    entregarAOtraPestana("no es json");
    entregarAOtraPestana(String(Date.now()), CLAVE_ACTIVIDAD);
    expect(router.replace).not.toHaveBeenCalled();
  });
});
