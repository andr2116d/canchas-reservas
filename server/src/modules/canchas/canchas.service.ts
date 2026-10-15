import { ConflictException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CrearCanchaDto } from './dto/crear-cancha.dto';

export const MENSAJE_NOMBRE_DUPLICADO = 'Ya existe una cancha con ese nombre';

function esNombreDuplicado(error: unknown) {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    error.code === 'P2002'
  );
}

@Injectable()
export class CanchasService {
  constructor(private readonly prisma: PrismaService) {}

  async crear(datos: CrearCanchaDto) {
    try {
      return await this.prisma.cancha.create({
        data: {
          nombre: datos.nombre,
          tamano: datos.tamano,
          iluminacion: datos.iluminacion,
        },
      });
    } catch (error) {
      if (esNombreDuplicado(error)) {
        throw new ConflictException({
          statusCode: 409,
          message: MENSAJE_NOMBRE_DUPLICADO,
          errores: { nombre: MENSAJE_NOMBRE_DUPLICADO },
        });
      }
      throw error;
    }
  }
}
