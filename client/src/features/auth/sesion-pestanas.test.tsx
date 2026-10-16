import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, cleanup, fireEvent, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
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

const avanzar = (ms: number) => act(() => vi.advanceTimersByTimeAsync(ms));

beforeEach(() => {
  vi.useFakeTimers();
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
