import { afterEach, describe, expect, it, vi } from "vitest";
import type { DatosRegistro } from "../esquemas/registro.schema";
import { registrarJugador } from "./registro.api";

const DATOS: DatosRegistro = {
  nombres: "Valeria",
  apellidos: "León",
  tipoDocumento: "DNI",
  numeroDocumento: "45678912",
  celular: "987654321",
  correo: "valeria@gmail.com",
  contrasena: "pichanga10",
};

function responderCon(estado: number, cuerpo: object) {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue(new Response(JSON.stringify(cuerpo), { status: estado })),
  );
}

describe("registrarJugador", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("envía los datos por POST a /api/jugadores", async () => {
    responderCon(201, { nombres: "Valeria" });

    await registrarJugador(DATOS);

    expect(fetch).toHaveBeenCalledWith("/api/jugadores", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(DATOS),
      credentials: "same-origin",
    });
  });

  it("confirma el registro con los nombres del jugador", async () => {
    responderCon(201, { nombres: "Valeria" });

    await expect(registrarJugador(DATOS)).resolves.toEqual({
      tipo: "registrado",
      nombres: "Valeria",
    });
  });

  it.each([400, 409])("devuelve los errores por campo de una respuesta %i", async (estado) => {
    responderCon(estado, {
      mensaje: "Ya existe una cuenta con estos datos.",
      errores: { correo: "Ya existe una cuenta con este correo." },
    });

    await expect(registrarJugador(DATOS)).resolves.toEqual({
      tipo: "datos-rechazados",
      errores: { correo: "Ya existe una cuenta con este correo." },
    });
  });

  it("devuelve el mensaje general de otros rechazos, como el límite de intentos", async () => {
    responderCon(429, {
      mensaje: "Hiciste demasiados intentos. Espera un momento y vuelve a intentarlo.",
      errores: {},
    });

    await expect(registrarJugador(DATOS)).resolves.toEqual({
      tipo: "error",
      mensaje: "Hiciste demasiados intentos. Espera un momento y vuelve a intentarlo.",
    });
  });

  it("explica qué hacer si no hay conexión", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("Failed to fetch")));

    await expect(registrarJugador(DATOS)).resolves.toEqual({
      tipo: "error",
      mensaje: "No pudimos conectar con La Previa. Revisa tu conexión e inténtalo de nuevo.",
    });
  });
});
