import { z } from "zod";

export const MENSAJE_OBLIGATORIO = "Este campo es obligatorio";
export const MENSAJES_USUARIO = {
  nombres: "Ingresa los nombres",
  apellidos: "Ingresa los apellidos",
  tipoDocumento: "Elige el tipo de documento",
  dni: "El DNI debe tener 8 dígitos",
  ce: "El CE debe tener entre 9 y 12 caracteres alfanuméricos",
  correo: "Ingresa un correo válido",
  telefono: "Ingresa un celular de 9 dígitos",
  contrasena: "La contraseña debe tener al menos 8 caracteres",
};

const SOLO_LETRAS = /^[\p{L} ]{2,60}$/u;
const DNI = /^\d{8}$/;
const CE = /^[A-Za-z0-9]{9,12}$/;
const CELULAR = /^9\d{8}$/;

const obligatorio = () => z.string(MENSAJE_OBLIGATORIO).trim().min(1, MENSAJE_OBLIGATORIO);

const nombres = obligatorio().regex(SOLO_LETRAS, MENSAJES_USUARIO.nombres);
const apellidos = obligatorio().regex(SOLO_LETRAS, MENSAJES_USUARIO.apellidos);
const telefono = obligatorio().regex(CELULAR, MENSAJES_USUARIO.telefono);
const correo = obligatorio().toLowerCase().pipe(z.email(MENSAJES_USUARIO.correo));
const contrasena = z
  .string(MENSAJE_OBLIGATORIO)
  .min(1, MENSAJE_OBLIGATORIO)
  .min(8, MENSAJES_USUARIO.contrasena);

const numeroDocumentoLleno = ({ value }: { value: unknown }) => {
  const numero = (value as { numeroDocumento?: unknown }).numeroDocumento;
  return typeof numero === "string" && numero !== "";
};

export const esquemaCrearRecepcionista = z
  .object({
    nombres,
    apellidos,
    tipoDocumento: obligatorio().pipe(z.enum(["DNI", "CE"], MENSAJES_USUARIO.tipoDocumento)),
    numeroDocumento: obligatorio(),
    correo,
    telefono,
    contrasena,
  })
  .refine((datos) => datos.tipoDocumento !== "DNI" || DNI.test(datos.numeroDocumento), {
    message: MENSAJES_USUARIO.dni,
    path: ["numeroDocumento"],
    when: numeroDocumentoLleno,
  })
  .refine((datos) => datos.tipoDocumento !== "CE" || CE.test(datos.numeroDocumento), {
    message: MENSAJES_USUARIO.ce,
    path: ["numeroDocumento"],
    when: numeroDocumentoLleno,
  });

export const esquemaEditarRecepcionista = z.object({ nombres, apellidos, telefono, correo });

export const esquemaRestablecerContrasena = z.object({ contrasena });

export type ValoresCrearRecepcionista = z.input<typeof esquemaCrearRecepcionista>;
export type ValoresEditarRecepcionista = z.input<typeof esquemaEditarRecepcionista>;
export type ValoresRestablecerContrasena = z.input<typeof esquemaRestablecerContrasena>;
