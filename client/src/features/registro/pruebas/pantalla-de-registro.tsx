import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { RegistroDeJugador } from "../componentes/registro-de-jugador";

export type Persona = ReturnType<typeof userEvent.setup>;

/** Abre la pantalla de registro y devuelve a la persona que la usa. */
export function mostrarRegistro(): Persona {
  const persona = userEvent.setup();
  render(<RegistroDeJugador />);
  return persona;
}

/** Busca un campo por su etiqueta; la visible lleva un asterisco al final, por eso se busca por su comienzo. */
export const campo = (nombre: string) => screen.getByLabelText(new RegExp(`^${nombre}`));

export const botonCrearCuenta = () => screen.getByRole("button", { name: "Crear mi cuenta" });

/** Escribe datos que cumplen todas las reglas del registro. */
export async function llenarDatosValidos(persona: Persona) {
  await persona.type(campo("Nombres"), "Valeria");
  await persona.type(campo("Apellidos"), "León Paredes");
  await persona.type(campo("Fecha de nacimiento"), "1998-05-14");
  await persona.type(campo("Número de documento"), "45678912");
  await persona.type(campo("Celular"), "987654321");
  await persona.type(campo("Correo"), "valeria@gmail.com");
  await persona.type(campo("Contraseña"), "pichanga10");
}
