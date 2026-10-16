import { applyDecorators } from '@nestjs/common';
import { Transform } from 'class-transformer';
import { isEmail, ValidateBy, ValidateIf } from 'class-validator';

export const MENSAJE_OBLIGATORIO = 'Este campo es obligatorio';
export const MENSAJES_USUARIO = {
  nombres: 'Ingresa los nombres',
  apellidos: 'Ingresa los apellidos',
  tipoDocumento: 'Elige el tipo de documento',
  dni: 'El DNI debe tener 8 dígitos',
  ce: 'El CE debe tener entre 9 y 12 caracteres alfanuméricos',
  correo: 'Ingresa un correo válido',
  telefono: 'Ingresa un celular de 9 dígitos',
  contrasena: 'La contraseña debe tener al menos 8 caracteres',
};

const SOLO_LETRAS = /^[\p{L} ]{2,60}$/u;
const DNI = /^\d{8}$/;
const CE = /^[A-Za-z0-9]{9,12}$/;
const CELULAR = /^9\d{8}$/;

function estaVacio(valor: unknown) {
  return (
    valor === undefined ||
    valor === null ||
    (typeof valor === 'string' && valor.trim() === '')
  );
}

function campo(
  nombre: string,
  esValido: (valor: unknown, objeto: Record<string, unknown>) => boolean,
  mensaje: (objeto: Record<string, unknown>) => string,
) {
  return ValidateBy({
    name: nombre,
    validator: {
      validate: (valor, args) =>
        !estaVacio(valor) &&
        esValido(valor, (args?.object ?? {}) as Record<string, unknown>),
      defaultMessage: (args) =>
        estaVacio(args?.value)
          ? MENSAJE_OBLIGATORIO
          : mensaje((args?.object ?? {}) as Record<string, unknown>),
    },
  });
}

const recortar = Transform(({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value,
);

const esTexto = (regla: RegExp) => (valor: unknown) =>
  typeof valor === 'string' && regla.test(valor);

export const SoloSiViene = () =>
  ValidateIf((_objeto, valor: unknown) => valor !== undefined);

export const CampoNombres = () =>
  applyDecorators(
    recortar,
    campo('nombres', esTexto(SOLO_LETRAS), () => MENSAJES_USUARIO.nombres),
  );

export const CampoApellidos = () =>
  applyDecorators(
    recortar,
    campo('apellidos', esTexto(SOLO_LETRAS), () => MENSAJES_USUARIO.apellidos),
  );

export const CampoTipoDocumento = () =>
  campo(
    'tipoDocumento',
    (valor) => valor === 'DNI' || valor === 'CE',
    () => MENSAJES_USUARIO.tipoDocumento,
  );

export const CampoNumeroDocumento = () =>
  applyDecorators(
    recortar,
    campo(
      'numeroDocumento',
      (valor, objeto) => {
        if (objeto.tipoDocumento === 'DNI') return esTexto(DNI)(valor);
        if (objeto.tipoDocumento === 'CE') return esTexto(CE)(valor);
        return true;
      },
      (objeto) =>
        objeto.tipoDocumento === 'CE'
          ? MENSAJES_USUARIO.ce
          : MENSAJES_USUARIO.dni,
    ),
  );

export const CampoCorreo = () =>
  applyDecorators(
    Transform(({ value }: { value: unknown }) =>
      typeof value === 'string' ? value.trim().toLowerCase() : value,
    ),
    campo(
      'correo',
      (valor) => typeof valor === 'string' && isEmail(valor),
      () => MENSAJES_USUARIO.correo,
    ),
  );

export const CampoTelefono = () =>
  applyDecorators(
    recortar,
    campo('telefono', esTexto(CELULAR), () => MENSAJES_USUARIO.telefono),
  );

export const CampoContrasena = () =>
  campo(
    'contrasena',
    (valor) => typeof valor === 'string' && valor.length >= 8,
    () => MENSAJES_USUARIO.contrasena,
  );
