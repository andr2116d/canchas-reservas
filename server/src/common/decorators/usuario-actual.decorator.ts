import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { PeticionConUsuario } from '../sesion/usuario-sesion';

export const UsuarioActual = createParamDecorator(
  (_dato: unknown, contexto: ExecutionContext) =>
    contexto.switchToHttp().getRequest<PeticionConUsuario>().usuario,
);
