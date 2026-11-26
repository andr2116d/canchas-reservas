import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { EstadoDeSesion } from "./destino-de-sesion";
import {
  consultarApiPrivada,
  exigirCambioDeContrasena,
  exigirCompletarDatos,
  exigirPanel,
} from "./sesion.servidor";

const entorno = vi.hoisted(() => ({ cookie: "sesion=abc", ip: "190.42.10.5" as string | null }));
vi.mock("next/headers", () => ({
  cookies: () => Promise.resolve({ toString: () => entorno.cookie }),
  headers: () => Promise.resolve({ get: () => entorno.ip }),
}));
vi.mock("next/navigation", () => ({
  redirect: (destino: string) => {
    throw new Error(`redirige a ${destino}`);
  },
}));

const ADMIN: EstadoDeSesion = { rol: "ADMINISTRADOR", requiereCambiarContrasena: false, venceEn: "2026-11-24T16:00:00.000Z" };

function conSesion(sesion: EstadoDeSesion | number) {
  const respuesta = typeof sesion === "number" ? new Response("{}", { status: sesion }) : new Response(JSON.stringify(sesion));
  const pedir = vi.fn().mockResolvedValue(respuesta);
  vi.stubGlobal("fetch", pedir);
  return pedir;
}

describe("sesion.servidor", () => {
  beforeEach(() => {
    entorno.cookie = "sesion=abc";
    entorno.ip = "190.42.10.5";
  });
  afterEach(() => vi.unstubAllGlobals());

  it("consulta la API privada reenviando la cookie y la IP, sin caché", async () => {
    const pedir = conSesion(ADMIN);

    await consultarApiPrivada("cuenta", "sesion=abc");

    expect(pedir).toHaveBeenCalledWith(expect.stringMatching(/\/api\/cuenta$/), {
      headers: { cookie: "sesion=abc", "x-forwarded-for": "190.42.10.5" },
      cache: "no-store",
    });
  });

  describe("exigirPanel", () => {
    it("sin cookie va al acceso sin consultar la API", async () => {
      entorno.cookie = "";
      const pedir = conSesion(ADMIN);

      await expect(exigirPanel("ADMINISTRADOR")).rejects.toThrow("redirige a /iniciar-sesion");
      expect(pedir).not.toHaveBeenCalled();
    });

    it("con la sesión vencida va al acceso", async () => {
      conSesion(401);

      await expect(exigirPanel("ADMINISTRADOR")).rejects.toThrow("redirige a /iniciar-sesion");
    });

    it("si la API falla no deja pasar", async () => {
      conSesion(500);

      await expect(exigirPanel("ADMINISTRADOR")).rejects.toThrow("No pudimos comprobar tu sesión.");
    });

    it("el panel de otro rol responde que no tiene acceso", async () => {
      conSesion({ ...ADMIN, rol: "RECEPCIONISTA" });

      await expect(exigirPanel("ADMINISTRADOR")).rejects.toThrow("redirige a /acceso-no-autorizado");
    });

    it("primero pide los datos y luego la contraseña temporal", async () => {
      conSesion({ ...ADMIN, requiereCompletarDatos: true, requiereCambiarContrasena: true });
      await expect(exigirPanel("ADMINISTRADOR")).rejects.toThrow("redirige a /completar-datos");

      conSesion({ ...ADMIN, requiereCambiarContrasena: true });
      await expect(exigirPanel("ADMINISTRADOR")).rejects.toThrow("redirige a /cambiar-contrasena");
    });

    it("deja entrar con la contraseña temporal si en esta sesión se dejó para después", async () => {
      conSesion({ ...ADMIN, requiereCambiarContrasena: true, cambioOmitido: true });

      await expect(exigirPanel("ADMINISTRADOR")).resolves.toMatchObject({ cookie: "sesion=abc" });
    });
  });

  it("el cambio de contraseña lleva al panel a quien ya no la tiene temporal", async () => {
    conSesion(ADMIN);

    await expect(exigirCambioDeContrasena()).rejects.toThrow("redirige a /administracion");
  });

  it("completar datos lleva a lo que corresponda a quien ya los confirmó", async () => {
    conSesion({ ...ADMIN, requiereCambiarContrasena: true });

    await expect(exigirCompletarDatos()).rejects.toThrow("redirige a /cambiar-contrasena");
  });
});
