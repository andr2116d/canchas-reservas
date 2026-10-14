import {
  BadRequestException,
  ValidationError,
  ValidationPipe,
} from '@nestjs/common';

export function aplanarErrores(
  errores: ValidationError[],
  prefijo = '',
): Record<string, string> {
  const resultado: Record<string, string> = {};
  for (const error of errores) {
    const campo = prefijo ? `${prefijo}.${error.property}` : error.property;
    const mensajes = Object.values(error.constraints ?? {});
    if (mensajes.length > 0) resultado[campo] = mensajes[0];
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
