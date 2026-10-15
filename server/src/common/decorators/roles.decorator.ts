import { SetMetadata } from '@nestjs/common';
import type { Rol } from '../../generated/prisma/enums';

export const ROLES = 'roles';
export const Roles = (...roles: Rol[]) => SetMetadata(ROLES, roles);
