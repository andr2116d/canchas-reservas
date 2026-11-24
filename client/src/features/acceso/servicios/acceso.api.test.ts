import { afterEach, describe, expect, it, vi } from "vitest";
import { cambiarContrasenaTemporal, iniciarSesion, omitirCambioDeContrasena } from "./acceso.api";

const respuesta = (status: number, cuerpo?: unknown) =>
  new Response(cuerpo === undefined ? "no es json" : JSON.stringify(cuerpo), { status });

describe("acceso.api", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("envía las credenciales como JSON y devuelve el destino", async () => {
    const pedir = vi.fn().mockResolvedValue(respuesta(200, { rol: "JUGADOR", requiereCambiarContrasena: false }));
    vi.stubGlobal("fetch", pedir);

    const resultado = await iniciarSesion({ correo: "a@b.pe", contrasena: "x" });

    expect(resultado).toEqual({ tipo: "autenticado", rol: "JUGADOR", requiereCambiarContrasena: false });
    expect(pedir).toHaveBeenCalledWith("/api/sesiones", expect.objectContaining({ method: "POST", body: '{"correo":"a@b.pe","contrasena":"x"}' }));
  });

  it("prefiere el error del campo contraseña al mensaje general", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(respuesta(400, { mensaje: "Revisa", errores: { contrasena: "Muy corta." } })));

    expect(await cambiarContrasenaTemporal("x")).toEqual({ tipo: "error", mensaje: "Muy corta.", sesionVencida: false });
  });

  it("un 401 al cambiar la contraseña significa que la sesión venció; al iniciar sesión, no", async () => {
    vi.stubGlobal("fetch", vi.fn().mockImplementation(() => Promise.resolve(respuesta(401, { mensaje: "Inicia sesión." }))));

    expect(await cambiarContrasenaTemporal("x")).toMatchObject({ sesionVencida: true });
    expect(await iniciarSesion({ correo: "a@b.pe", contrasena: "x" })).toMatchObject({ sesionVencida: false });
  });

  it("si el server responde algo que no es JSON muestra un mensaje genérico", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(respuesta(502)));

    expect(await iniciarSesion({ correo: "a@b.pe", contrasena: "x" })).toMatchObject({
      tipo: "error",
      mensaje: "No pudimos completar la solicitud. Inténtalo de nuevo.",
    });
  });

  it("sin conexión lo dice en vez de quedarse esperando", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("Failed to fetch")));

    expect(await iniciarSesion({ correo: "a@b.pe", contrasena: "x" })).toMatchObject({ tipo: "error" });
    expect(await omitirCambioDeContrasena()).toEqual({
      tipo: "error",
      mensaje: "No pudimos conectar con La Previa. Inténtalo de nuevo.",
    });
  });

  it("muestra el mensaje del límite de intentos", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(respuesta(429, { mensaje: "Hubo demasiados intentos. Espera un momento y vuelve a intentarlo." })));

    expect(await iniciarSesion({ correo: "a@b.pe", contrasena: "x" })).toMatchObject({
      mensaje: "Hubo demasiados intentos. Espera un momento y vuelve a intentarlo.",
    });
  });
});
