import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { FormularioLogin } from "./components/formulario-login";
import { LIMITE_INACTIVIDAD_MS, TemporizadorInactividad } from "./components/temporizador-inactividad";

const router = vi.hoisted(() => ({ replace: vi.fn(), push: vi.fn() }));
const url = vi.hoisted(() => ({ parametros: new URLSearchParams() }));
vi.mock("next/navigation", () => ({
  useRouter: () => router,
  useSearchParams: () => url.parametros,
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

const sinSesion: Respuesta = { status: 401, cuerpo: { statusCode: 401, message: "Sin sesión", errores: {} } };

function renderizar(ui: React.ReactNode) {
  const cliente = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={cliente}>{ui}</QueryClientProvider>);
}

function llenarYEnviar(correo: string, contrasena: string) {
  fireEvent.change(screen.getByLabelText("Correo"), { target: { value: correo } });
  fireEvent.change(screen.getByLabelText("Contraseña"), { target: { value: contrasena } });
  fireEvent.click(screen.getByRole("button", { name: "Ingresar" }));
}

beforeEach(() => {
  router.replace.mockReset();
  router.push.mockReset();
  url.parametros = new URLSearchParams();
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("FormularioLogin", () => {
  it("con credenciales incorrectas muestra el mensaje del server", async () => {
    responder({
      "/api/auth/me": sinSesion,
      "/api/auth/login": {
        status: 401,
        cuerpo: { statusCode: 401, message: "Correo o contraseña incorrectos", errores: {} },
      },
    });
    renderizar(<FormularioLogin />);
    llenarYEnviar("admin@laprevia.pe", "mala1234");
    expect((await screen.findByRole("alert")).textContent).toBe("Correo o contraseña incorrectos");
    expect(router.replace).not.toHaveBeenCalled();
  });

  it("con cuenta desactivada muestra el mensaje del server", async () => {
    const mensaje = "Tu cuenta está desactivada. Contacta al administrador.";
    responder({
      "/api/auth/me": sinSesion,
      "/api/auth/login": { status: 403, cuerpo: { statusCode: 403, message: mensaje, errores: {} } },
    });
    renderizar(<FormularioLogin />);
    llenarYEnviar("inactivo@laprevia.pe", "Clave1234");
    expect((await screen.findByRole("alert")).textContent).toBe(mensaje);
  });

  it("muestra los errores por campo sin llamar al server", async () => {
    const fetchSimulado = responder({ "/api/auth/me": sinSesion });
    renderizar(<FormularioLogin />);
    llenarYEnviar("correo-sin-arroba", "");
    expect(await screen.findByText("Ingresa un correo válido")).toBeTruthy();
    expect(screen.getByText("Ingresa tu contraseña")).toBeTruthy();
    expect(fetchSimulado).not.toHaveBeenCalledWith("/api/auth/login", expect.anything());
  });

  it("con credenciales correctas redirige al panel del rol", async () => {
    const fetchSimulado = responder({
      "/api/auth/me": sinSesion,
      "/api/auth/login": { status: 200, cuerpo: { id: 2, nombres: "Ana", rol: "JUGADOR" } },
    });
    renderizar(<FormularioLogin />);
    llenarYEnviar(" Jugador1@LaPrevia.pe ", "Jugador123");
    await waitFor(() => expect(router.replace).toHaveBeenCalledWith("/jugador"));
    expect(fetchSimulado).toHaveBeenCalledWith(
      "/api/auth/login",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ correo: "jugador1@laprevia.pe", contrasena: "Jugador123" }),
      }),
    );
  });

  it("tras iniciar sesión el formulario queda vacío", async () => {
    responder({
      "/api/auth/me": sinSesion,
      "/api/auth/login": { status: 200, cuerpo: { id: 2, nombres: "Ana", rol: "JUGADOR" } },
    });
    renderizar(<FormularioLogin />);
    llenarYEnviar("jugador1@laprevia.pe", "Jugador123");

    await waitFor(() => expect(router.replace).toHaveBeenCalledWith("/jugador"));
    await waitFor(() => expect((screen.getByLabelText("Correo") as HTMLInputElement).value).toBe(""));
    expect((screen.getByLabelText("Contraseña") as HTMLInputElement).value).toBe("");
  });

  it("con credenciales incorrectas conserva lo escrito", async () => {
    responder({
      "/api/auth/me": sinSesion,
      "/api/auth/login": {
        status: 401,
        cuerpo: { statusCode: 401, message: "Correo o contraseña incorrectos", errores: {} },
      },
    });
    renderizar(<FormularioLogin />);
    llenarYEnviar("admin@laprevia.pe", "mala1234");

    await screen.findByRole("alert");
    expect((screen.getByLabelText("Correo") as HTMLInputElement).value).toBe("admin@laprevia.pe");
  });

  it("con sesión activa redirige al panel del rol", async () => {
    responder({
      "/api/auth/me": {
        status: 200,
        cuerpo: { id: 1, nombres: "Luis", apellidos: "Paz", correo: "admin@laprevia.pe", rol: "ADMINISTRADOR" },
      },
    });
    renderizar(<FormularioLogin />);
    await waitFor(() => expect(router.replace).toHaveBeenCalledWith("/admin"));
  });

  it("con ?motivo=inactividad muestra el aviso de inactividad", () => {
    responder({ "/api/auth/me": sinSesion });
    url.parametros = new URLSearchParams("motivo=inactividad");
    renderizar(<FormularioLogin />);
    expect(screen.getByRole("status").textContent).toBe("Tu sesión se cerró por inactividad");
  });

  it("con ?registro=ok muestra el aviso de cuenta creada", () => {
    responder({ "/api/auth/me": sinSesion });
    url.parametros = new URLSearchParams("registro=ok");
    renderizar(<FormularioLogin />);
    expect(screen.getByRole("status").textContent).toBe("Tu cuenta fue creada. Inicia sesión.");
  });

  it("sin parámetros no muestra avisos", () => {
    responder({ "/api/auth/me": sinSesion });
    renderizar(<FormularioLogin />);
    expect(screen.queryByRole("status")).toBeNull();
  });

  it("tiene el enlace a /registro", () => {
    responder({ "/api/auth/me": sinSesion });
    renderizar(<FormularioLogin />);
    expect(screen.getByRole("link", { name: "Crea tu cuenta" }).getAttribute("href")).toBe("/registro");
  });
});

describe("TemporizadorInactividad", () => {
  const llamoLogout = (fetchSimulado: ReturnType<typeof responder>) =>
    fetchSimulado.mock.calls.some(([url]) => url === "/api/auth/logout");

  it("a los 15 minutos sin actividad llama a logout y va a /login?motivo=inactividad", async () => {
    vi.useFakeTimers();
    const fetchSimulado = responder({ "/api/auth/logout": { status: 204 } });
    renderizar(<TemporizadorInactividad />);

    await act(() => vi.advanceTimersByTimeAsync(LIMITE_INACTIVIDAD_MS - 1));
    expect(llamoLogout(fetchSimulado)).toBe(false);

    await act(() => vi.advanceTimersByTimeAsync(1));
    expect(fetchSimulado).toHaveBeenCalledWith("/api/auth/logout", expect.objectContaining({ method: "POST" }));
    await act(() => vi.runAllTimersAsync());
    expect(router.replace).toHaveBeenCalledWith("/login?motivo=inactividad");
  });

  it("un clic, una tecla o un scroll reinician la cuenta", async () => {
    vi.useFakeTimers();
    const fetchSimulado = responder({ "/api/auth/logout": { status: 204 } });
    renderizar(<TemporizadorInactividad />);

    for (const evento of ["click", "keydown", "scroll"]) {
      await act(() => vi.advanceTimersByTimeAsync(LIMITE_INACTIVIDAD_MS - 1000));
      fireEvent(document.body, new Event(evento, { bubbles: evento !== "scroll" }));
    }
    await act(() => vi.advanceTimersByTimeAsync(LIMITE_INACTIVIDAD_MS - 1000));
    expect(llamoLogout(fetchSimulado)).toBe(false);

    await act(() => vi.advanceTimersByTimeAsync(1000));
    expect(llamoLogout(fetchSimulado)).toBe(true);
  });

  it("si la sesión ya venció en el server igual va a /login?motivo=inactividad", async () => {
    vi.useFakeTimers();
    responder({ "/api/auth/logout": sinSesion });
    renderizar(<TemporizadorInactividad />);

    await act(() => vi.advanceTimersByTimeAsync(LIMITE_INACTIVIDAD_MS));
    await act(() => vi.runAllTimersAsync());
    expect(router.replace).toHaveBeenCalledWith("/login?motivo=inactividad");
  });
});
