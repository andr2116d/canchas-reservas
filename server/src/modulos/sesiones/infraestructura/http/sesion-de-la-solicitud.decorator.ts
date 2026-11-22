import { createParamDecorator, type ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';
import type { SesionValida } from '../../aplicacion/validar-sesion.use-case';

/** Solicitud a la que el guard de sesión ya le adjuntó la sesión válida. */
export interface SolicitudConSesion extends Request {
  sesion?: SesionValida;
}

/** Inyecta en el controlador la sesión validada por el guard. */
export const SesionDeLaSolicitud = createParamDecorator(
  (_: unknown, contexto: ExecutionContext): SesionValida | undefined =>
    contexto.switchToHttp().getRequest<SolicitudConSesion>().sesion,
);
