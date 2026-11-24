import { z } from "zod";
import { reglaDeMonto } from "@/compartido/formulario/regla-de-monto";
import { campoCon, type Regla } from "@/compartido/formulario/reglas-de-datos-personales";

export const LARGO_MAXIMO_DEL_NOMBRE = 40;
export const LARGO_MAXIMO_DE_LA_DESCRIPCION = 200;

const reglaDeNombre: Regla = (valor) => {
  if (!valor.trim()) return "Escribe el nombre del adicional.";
  if (valor.trim().length > LARGO_MAXIMO_DEL_NOMBRE) return `Usa como máximo ${LARGO_MAXIMO_DEL_NOMBRE} caracteres.`;
};

const reglaDeDescripcion: Regla = (valor) => {
  if (valor.trim().length > LARGO_MAXIMO_DE_LA_DESCRIPCION) return `Usa como máximo ${LARGO_MAXIMO_DE_LA_DESCRIPCION} caracteres.`;
};

/** Revisa el formato antes de enviar; el nombre repetido y los signos permitidos los revisa el server. */
export const esquemaDeAdicional = z.object({
  nombre: campoCon(reglaDeNombre),
  descripcion: campoCon(reglaDeDescripcion),
  precio: campoCon(reglaDeMonto),
});
