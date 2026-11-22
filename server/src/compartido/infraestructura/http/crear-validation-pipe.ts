import {
  BadRequestException,
  ValidationPipe,
  type ValidationError,
} from '@nestjs/common';
import type { ErroresPorCampo } from '../../dominio/dominio.error';

// class-validator marca con esta restricción los campos que no están en el DTO.
const RESTRICCION_CAMPO_NO_PERMITIDO = 'whitelistValidation';

function mensajeDelCampo(error: ValidationError): string {
  const restricciones = error.constraints ?? {};
  if (RESTRICCION_CAMPO_NO_PERMITIDO in restricciones) {
    return 'Este campo no está permitido.';
  }
  return Object.values(restricciones)[0] ?? 'Este dato no es válido.';
}

/**
 * Valida cada cuerpo contra su DTO: rechaza campos no declarados (evita, por
 * ejemplo, que alguien envíe su propio rol) y responde en español por campo.
 */
export function crearValidationPipe(): ValidationPipe {
  return new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    exceptionFactory: (errores: ValidationError[]) => {
      const porCampo: ErroresPorCampo = {};
      for (const error of errores) {
        porCampo[error.property] = mensajeDelCampo(error);
      }
      return new BadRequestException({
        mensaje: 'Revisa los datos marcados.',
        errores: porCampo,
      });
    },
  });
}
