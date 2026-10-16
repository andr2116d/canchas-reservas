import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import { Publico } from '../../common/decorators/publico.decorator';
import { PrismaService } from '../../prisma/prisma.service';

@Publico()
@Controller('salud')
export class SaludController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  vivo() {
    return { estado: 'ok' };
  }

  @Get('listo')
  async listo() {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return { estado: 'ok', baseDeDatos: 'ok' };
    } catch {
      throw new ServiceUnavailableException('La base de datos no responde');
    }
  }
}
