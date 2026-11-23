import { afterEach, describe, expect, it, vi } from "vitest";
import { crearRecepcionista, sugerirCorreo } from "./recepcionistas.api";

function responder(estado: number, cuerpo: unknown) {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify(cuerpo), { status: estado })));
}

const DATOS = {
  nombres: "Rosa",
  apellidos: "Quispe",
  fechaNacimiento: "1995-02-01",
  tipoDocumento: "DNI" as const,
  numeroDocumento: "41234567",
  celular: "912345678",
  usuarioDeCorreo: "rosa.quispe",
  contrasena: "temporal2026",
};

describe("recepcionistas.api", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("devuelve el id de la recepcionista creada", async () => {
    responder(201, { id: 7 });

    await expect(crearRecepcionista(DATOS)).resolves.toEqual({ tipo: "creada", id: 7 });
  });

  it("ofrece reactivar si el server encuentra una cuenta desactivada", async () => {
    responder(409, { mensaje: "Puedes reactivarla.", errores: {}, datos: { reactivable: { id: 3, nombres: "Rosa" } } });

    await expect(crearRecepcionista(DATOS)).resolves.toEqual({ tipo: "reactivable", id: 3, nombres: "Rosa" });
  });

  it("devuelve los errores por campo de un duplicado", async () => {
    responder(409, { mensaje: "Ya existe", errores: { correo: "Este correo ya fue registrado." } });

    await expect(crearRecepcionista(DATOS)).resolves.toEqual({
      tipo: "datos-rechazados",
      errores: { usuarioDeCorreo: "Este correo ya fue registrado." },
    });
  });

  it("pide la sugerencia de correo con los nombres y apellidos", async () => {
    responder(200, { usuarioDeCorreo: "rosa.quispe2" });

    await expect(sugerirCorreo("Rosa", "Quispe")).resolves.toBe("rosa.quispe2");
    expect(vi.mocked(fetch).mock.calls[0][0]).toBe(
      "/api/recepcionistas/correo-sugerido?nombres=Rosa&apellidos=Quispe",
    );
  });
});
