import { Inject, Injectable } from '@nestjs/common';
import {
  CIFRADOR,
  type Cifrador,
} from '../../../../compartido/aplicacion/cifrador.port';
import { PrismaService } from '../../../../compartido/infraestructura/prisma/prisma.service';
import type {
  DatosDelTitular,
  Titulares,
} from '../../aplicacion/titulares.port';

/** Lee de la cuenta solo lo que se comprueba para reservar; descifra la fecha de nacimiento. */
@Injectable()
export class PrismaTitularesAdapter implements Titulares {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(CIFRADOR) private readonly cifrador: Cifrador,
  ) {}

  async datosDe(usuarioId: number): Promise<DatosDelTitular | undefined> {
    const cuenta = await this.prisma.usuario.findUnique({
      where: { id: usuarioId },
      select: { rol: true, estado: true, fechaNacimientoCifrada: true },
    });
    if (!cuenta) return undefined;
    return {
      esJugadorActivo: cuenta.rol === 'JUGADOR' && cuenta.estado === 'ACTIVO',
      fechaNacimiento: cuenta.fechaNacimientoCifrada
        ? this.cifrador.descifrar(cuenta.fechaNacimientoCifrada)
        : null,
    };
  }
}
