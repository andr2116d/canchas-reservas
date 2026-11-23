import { describe, expect, it } from "vitest";
import { destinoDeSesion, debePedirCambioDeContrasena } from "./destino-de-sesion";

describe("destinoDeSesion", () => {
  it("pide cambiar la contraseña temporal si no se omitió en esta sesión", () => {
    expect(destinoDeSesion({ rol: "RECEPCIONISTA", requiereCambiarContrasena: true })).toBe("/cambiar-contrasena");
  });

  it("lleva al panel del rol si el cambio se dejó para después", () => {
    expect(
      destinoDeSesion({ rol: "RECEPCIONISTA", requiereCambiarContrasena: true, cambioOmitido: true }),
    ).toBe("/recepcion");
  });

  it("lleva al panel del rol si la contraseña no es temporal", () => {
    expect(destinoDeSesion({ rol: "ADMINISTRADOR", requiereCambiarContrasena: false })).toBe("/administracion");
  });
});

describe("debePedirCambioDeContrasena", () => {
  it("solo con contraseña temporal y sin haber omitido el cambio", () => {
    expect(debePedirCambioDeContrasena({ requiereCambiarContrasena: true })).toBe(true);
    expect(debePedirCambioDeContrasena({ requiereCambiarContrasena: true, cambioOmitido: true })).toBe(false);
    expect(debePedirCambioDeContrasena({ requiereCambiarContrasena: false })).toBe(false);
  });
});
