import { ConflictException, Injectable } from '@nestjs/common';
import { EstadoCancha } from '../../generated/prisma/enums';
import { PrismaService } from '../../prisma/prisma.service';
import { CrearCanchaDto } from './dto/crear-cancha.dto';

@Injectable()
export class CanchasService {
  constructor(private readonly prisma: PrismaService) { }

  async crear(datos: CrearCanchaDto) {
    try {
      return await this.prisma.cancha.create({
        data: {
          nombre: datos.nombre,
          tamano: datos.tamano,
          iluminacion: datos.iluminacion,
          estado: datos.estado ?? EstadoCancha.OPERATIVA,
          activa: true,
        },
      });
    } catch (error) {
      if (
        typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        (error as { code?: unknown }).code === 'P2002'
      ) {
        throw new ConflictException('Ya existe una cancha con ese nombre');
      }
      throw error;
    }
  }
}
