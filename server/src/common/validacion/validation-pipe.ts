import {
  BadRequestException,
  ValidationError,
  ValidationPipe,
} from '@nestjs/common';

function mensajeDe(campo: string, constraints: Record<string, string>) {
  if (constraints.whitelistValidation)
    return `El campo ${campo} no está permitido`;
  return Object.values(constraints)[0];
}

export function aplanarErrores(
  errores: ValidationError[],
  prefijo = '',
): Record<string, string> {
  const resultado: Record<string, string> = {};
  for (const error of errores) {
    const campo = prefijo ? `${prefijo}.${error.property}` : error.property;
    if (error.constraints && Object.keys(error.constraints).length > 0)
      resultado[campo] = mensajeDe(campo, error.constraints);
    if (error.children?.length)
      Object.assign(resultado, aplanarErrores(error.children, campo));
  }
  return resultado;
}

export function crearValidationPipe() {
  return new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
    exceptionFactory: (errores) => {
      const porCampo = aplanarErrores(errores);
      return new BadRequestException({
        statusCode: 400,
        message: Object.values(porCampo)[0] ?? 'Datos inválidos',
        errores: porCampo,
      });
    },
  });
}
