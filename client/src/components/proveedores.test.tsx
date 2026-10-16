import { useMutation, useQuery, useQueryClient, type QueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { FormularioLogin } from "@/features/auth/components/formulario-login";
import {
  LIMITE_INACTIVIDAD_MS,
  TemporizadorInactividad,
} from "@/features/auth/components/temporizador-inactividad";
import { api } from "@/lib/api";
import { Proveedores } from "./proveedores";

const router = vi.hoisted(() => ({ replace: vi.fn(), push: vi.fn() }));
vi.mock("next/navigation", () => ({
  useRouter: () => router,
  useSearchParams: () => new URLSearchParams(),
}));

type Respuesta = { status: number; cuerpo?: unknown };

function responder(rutas: Record<string, Respuesta>) {
  const fetchSimulado = vi.fn().mockImplementation(async (url: string) => {
    const { status, cuerpo } = rutas[url] ?? { status: 404 };
    return new Response(cuerpo === undefined ? null : JSON.stringify(cuerpo), { status });
  });
  vi.stubGlobal("fetch", fetchSimulado);
  return fetchSimulado;
}

const sinSesion: Respuesta = {
  status: 401,
  cuerpo: { statusCode: 401, message: "Tu sesión no es válida. Inicia sesión de nuevo.", errores: {} },
};
const sesion = { id: 1, nombres: "Luis", apellidos: "Paz", correo: "luis@laprevia.pe", rol: "RECEPCIONISTA" };

function irA(destino: string) {
  window.history.replaceState(null, "", destino);
}

function Agenda() {
  const agenda = useQuery({ queryKey: ["agenda"], queryFn: () => api<string[]>("/recepcion/agenda") });
  if (agenda.isError) return <p role="alert">{agenda.error.message}</p>;
  return <p>{agenda.data ? "Agenda" : "Cargando"}</p>;
}

function Confirmar() {
  const confirmar = useMutation({ mutationFn: () => api("/reservas/1/confirmar", { method: "POST" }) });
  return (
    <>
      <button onClick={() => confirmar.mutate()}>Confirmar</button>
      {confirmar.isSuccess && <p>Confirmada</p>}
    </>
  );
}

function Capturar({ alObtener }: { alObtener: (cliente: QueryClient) => void }) {
  const cliente = useQueryClient();
  useEffect(() => alObtener(cliente), [cliente, alObtener]);
  return null;
}

const llamadasA = (fetchSimulado: ReturnType<typeof responder>, url: string) =>
  fetchSimulado.mock.calls.filter(([llamada]) => llamada === url).length;

beforeEach(() => {
  router.replace.mockReset();
  localStorage.clear();
  irA("/");
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("Proveedores ante un 401", () => {
  it("una query con 401 en una ruta privada va a /login y después limpia el cache", async () => {
    irA("/recepcion/agenda");
    const fetchSimulado = responder({ "/api/recepcion/agenda": sinSesion });
    let cliente: QueryClient | undefined;
    const sesionAlRedirigir: unknown[] = [];
    router.replace.mockImplementation(() => sesionAlRedirigir.push(cliente?.getQueryData(["sesion"])));

    render(
      <Proveedores>
        <Capturar
          alObtener={(capturado) => {
            cliente = capturado;
            capturado.setQueryData(["sesion"], sesion);
          }}
        />
        <Agenda />
      </Proveedores>,
    );

    await waitFor(() => expect(router.replace).toHaveBeenCalledWith("/login"));
    expect(sesionAlRedirigir).toEqual([sesion]);
    expect(cliente?.getQueryData(["sesion"])).toBeUndefined();

    await waitFor(() => expect(llamadasA(fetchSimulado, "/api/recepcion/agenda")).toBe(2));
    await act(() => Promise.resolve());
    expect(router.replace).toHaveBeenCalledTimes(1);
  });

  it("una mutation con 401 en una ruta privada va a /login", async () => {
    irA("/recepcion/agenda");
    responder({ "/api/reservas/1/confirmar": sinSesion });
    render(
      <Proveedores>
        <Confirmar />
      </Proveedores>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Confirmar" }));
    await waitFor(() => expect(router.replace).toHaveBeenCalledWith("/login"));
  });

  it("tras una respuesta correcta vuelve a redirigir ante un nuevo 401", async () => {
    irA("/recepcion/agenda");
    responder({ "/api/reservas/1/confirmar": sinSesion });
    render(
      <Proveedores>
        <Confirmar />
      </Proveedores>,
    );
    const confirmar = screen.getByRole("button", { name: "Confirmar" });

    fireEvent.click(confirmar);
    await waitFor(() => expect(router.replace).toHaveBeenCalledTimes(1));
    fireEvent.click(confirmar);
    await waitFor(() => expect(vi.mocked(fetch)).toHaveBeenCalledTimes(2));
    await act(() => Promise.resolve());
    expect(router.replace).toHaveBeenCalledTimes(1);

    responder({ "/api/reservas/1/confirmar": { status: 200, cuerpo: {} } });
    fireEvent.click(confirmar);
    await screen.findByText("Confirmada");
    responder({ "/api/reservas/1/confirmar": sinSesion });
    fireEvent.click(confirmar);
    await waitFor(() => expect(router.replace).toHaveBeenCalledTimes(2));
  });

  it("el 401 de credenciales incorrectas en el login no redirige y muestra su mensaje", async () => {
    irA("/login");
    responder({
      "/api/auth/me": sinSesion,
      "/api/auth/login": {
        status: 401,
        cuerpo: { statusCode: 401, message: "Correo o contraseña incorrectos", errores: {} },
      },
    });
    render(
      <Proveedores>
        <FormularioLogin />
      </Proveedores>,
    );

    fireEvent.change(screen.getByLabelText("Correo"), { target: { value: "admin@laprevia.pe" } });
    fireEvent.change(screen.getByLabelText("Contraseña"), { target: { value: "mala1234" } });
    fireEvent.click(screen.getByRole("button", { name: "Ingresar" }));

    expect((await screen.findByRole("alert")).textContent).toBe("Correo o contraseña incorrectos");
    expect(router.replace).not.toHaveBeenCalled();
  });

  it("un 401 en una página pública no redirige", async () => {
    irA("/registro");
    responder({ "/api/recepcion/agenda": sinSesion });
    render(
      <Proveedores>
        <Agenda />
      </Proveedores>,
    );

    expect((await screen.findByRole("alert")).textContent).toContain("Tu sesión no es válida");
    expect(router.replace).not.toHaveBeenCalled();
  });

  it("un 403 en una ruta privada no redirige", async () => {
    irA("/recepcion/agenda");
    responder({ "/api/recepcion/agenda": { status: 403, cuerpo: { statusCode: 403, message: "Sin permiso" } } });
    render(
      <Proveedores>
        <Agenda />
      </Proveedores>,
    );

    expect((await screen.findByRole("alert")).textContent).toBe("Sin permiso");
    expect(router.replace).not.toHaveBeenCalled();
  });

  it("el 401 del logout por inactividad conserva su destino", async () => {
    vi.useFakeTimers();
    irA("/recepcion/agenda");
    responder({ "/api/auth/logout": sinSesion });
    render(
      <Proveedores>
        <TemporizadorInactividad />
      </Proveedores>,
    );

    await act(() => vi.advanceTimersByTimeAsync(LIMITE_INACTIVIDAD_MS));
    await act(() => vi.runAllTimersAsync());
    expect(router.replace.mock.calls).toEqual([["/login?motivo=inactividad"]]);
  });
});
