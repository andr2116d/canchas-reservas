import type { Cuenta } from "@/compartido/cuenta/cuenta.servidor";

export function unaCuenta(cambios: Partial<Cuenta> = {}): Cuenta {
  return {
    id: 7,
    rol: "JUGADOR",
    nombres: "Valeria",
    apellidos: "León Paredes",
    tipoDocumento: "DNI",
    numeroDocumento: "45678912",
    fechaNacimiento: "1998-05-14",
    correo: "valeria@gmail.com",
    celular: "987654321",
    dorsal: 10,
    editables: ["correo", "celular", "dorsal"],
    puedeCambiarTipoDeDocumento: false,
    ...cambios,
  };
}
