import { Controller, Get } from '@nestjs/common';
import { Publico } from '../../../sesiones/api-sesiones';
import {
  type ClubPublico,
  ConsultarElClubUseCase,
} from '../../aplicacion/consultar-el-club.use-case';

/** Lo que cualquiera puede saber del club, sin iniciar sesión. */
@Controller('club')
export class ClubController {
  constructor(private readonly consultar: ConsultarElClubUseCase) {}

  @Get()
  @Publico()
  delClub(): Promise<ClubPublico> {
    return this.consultar.ejecutar();
  }
}
