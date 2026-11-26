import { Reflector } from '@nestjs/core';
import type { Permiso } from '../../dominio/permisos-de-sesion';

export const RequerirPermiso = Reflector.createDecorator<Permiso>();
