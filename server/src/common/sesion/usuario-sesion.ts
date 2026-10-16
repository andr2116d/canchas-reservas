import type { Request } from 'express';
import type { Rol } from '../../generated/prisma/enums';

export interface UsuarioSesion {
  id: number;
  nombres: string;
  apellidos: string | null;
  correo: string | null;
  rol: Rol;
}

export type PeticionConUsuario = Request & { usuario?: UsuarioSesion };
