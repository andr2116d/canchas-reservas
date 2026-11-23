import { describe, expect, it } from "vitest";
import { esquemaDeAlta, esquemaDeEdicion } from "./recepcionista.schema";

const valida = {
  nombres: "Rosa",
  apellidos: "Quispe Lozano",
  fechaNacimiento: "1995-02-01",
  tipoDocumento: "DNI" as const,
  numeroDocumento: "41234567",
  celular: "912345678",
  usuarioDeCorreo: "rosa.quispe",
  contrasena: "temporal2026",
};

function errores(resultado: { success: boolean; error?: { issues: { path: PropertyKey[]; message: string }[] } }) {
  return Object.fromEntries((resultado.error?.issues ?? []).map((i) => [String(i.path[0]), i.message]));
}

describe("esquema de la recepcionista", () => {
  it("acepta datos válidos", () => {
    expect(esquemaDeAlta.safeParse(valida).success).toBe(true);
  });

  it("habla de la otra persona en los mensajes", () => {
    expect(errores(esquemaDeAlta.safeParse({ ...valida, nombres: "", fechaNacimiento: "2015-01-01" }))).toEqual({
      nombres: "Ingresa los nombres.",
      fechaNacimiento: "Debe tener al menos 18 años.",
    });
  });

  it.each([
    ["", "Escribe el correo o genéralo con sus nombres."],
    ["rosa@gmail.com", "Escribe solo lo que va antes de la @, sin espacios."],
    ["rosa quispe", "Escribe solo lo que va antes de la @, sin espacios."],
  ])("pide solo lo que va antes de la @ (%s)", (usuarioDeCorreo, mensaje) => {
    expect(errores(esquemaDeAlta.safeParse({ ...valida, usuarioDeCorreo })).usuarioDeCorreo).toBe(mensaje);
  });

  it("exige la contraseña temporal en el alta pero no en la edición", () => {
    const sinContrasena: Partial<typeof valida> = { ...valida };
    delete sinContrasena.contrasena;

    expect(errores(esquemaDeAlta.safeParse(sinContrasena)).contrasena).toBeDefined();
    expect(esquemaDeEdicion.safeParse(sinContrasena).success).toBe(true);
  });
});
