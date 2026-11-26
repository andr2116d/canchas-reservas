import { Body, Controller, Get, Param, Post, Put } from '@nestjs/common';
import {
  RequerirPermiso,
  SesionDeLaSolicitud,
  type SesionValida,
} from '../../../sesiones/api-sesiones';
import {
  type CanchaEnLaLista,
  ConsultarCanchasUseCase,
} from '../../aplicacion/consultar-canchas.use-case';
import { EditarCanchaUseCase } from '../../aplicacion/editar-cancha.use-case';
import { RegistrarCanchasUseCase } from '../../aplicacion/registrar-canchas.use-case';
import type {
  VistaDeCambio,
  VistaDeCancha,
} from '../../aplicacion/vista-de-cancha';
import { CanchaDto, RegistrarCanchasDto } from './cancha.dto';
import { ID_DE_CANCHA } from './id-de-cancha.pipe';

/** Canchas del local: solo administración las consulta, las registra y las edita. */
@Controller('canchas')
@RequerirPermiso('canchas:gestionar')
export class CanchasController {
  constructor(
    private readonly consultar: ConsultarCanchasUseCase,
    private readonly registrar: RegistrarCanchasUseCase,
    private readonly editar: EditarCanchaUseCase,
  ) {}

  @Get()
  listar(): Promise<CanchaEnLaLista[]> {
    return this.consultar.listar();
  }

  @Get('cambios')
  cambios(): Promise<VistaDeCambio[]> {
    return this.consultar.cambios();
  }

  @Post()
  crear(
    @Body() { canchas }: RegistrarCanchasDto,
    @SesionDeLaSolicitud() sesion: SesionValida,
  ): Promise<VistaDeCancha[]> {
    return this.registrar.ejecutar(canchas, sesion.usuarioId);
  }

  @Put(':id')
  actualizar(
    @Param('id', ID_DE_CANCHA) id: number,
    @Body() datos: CanchaDto,
    @SesionDeLaSolicitud() sesion: SesionValida,
  ): Promise<VistaDeCancha> {
    return this.editar.ejecutar(id, datos, sesion.usuarioId);
  }
}
