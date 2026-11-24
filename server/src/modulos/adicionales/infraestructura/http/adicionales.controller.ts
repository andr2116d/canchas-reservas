import { Body, Controller, Get, Param, Post, Put } from '@nestjs/common';
import {
  RequerirPermiso,
  SesionDeLaSolicitud,
  type SesionValida,
} from '../../../sesiones/api-sesiones';
import { ConsultarAdicionalesUseCase } from '../../aplicacion/consultar-adicionales.use-case';
import { EditarAdicionalUseCase } from '../../aplicacion/editar-adicional.use-case';
import { RegistrarAdicionalUseCase } from '../../aplicacion/registrar-adicional.use-case';
import type {
  VistaDeAdicional,
  VistaDeCambio,
} from '../../aplicacion/vista-de-adicional';
import { AdicionalDto } from './adicional.dto';
import { ID_DE_ADICIONAL } from './id-de-adicional.pipe';

/** Catálogo de adicionales: solo administración lo consulta, lo amplía y lo edita. */
@Controller('adicionales')
@RequerirPermiso('adicionales:gestionar')
export class AdicionalesController {
  constructor(
    private readonly consultar: ConsultarAdicionalesUseCase,
    private readonly registrar: RegistrarAdicionalUseCase,
    private readonly editar: EditarAdicionalUseCase,
  ) {}

  @Get()
  listar(): Promise<VistaDeAdicional[]> {
    return this.consultar.listar();
  }

  @Get('cambios')
  cambios(): Promise<VistaDeCambio[]> {
    return this.consultar.cambios();
  }

  @Post()
  crear(
    @Body() datos: AdicionalDto,
    @SesionDeLaSolicitud() sesion: SesionValida,
  ): Promise<VistaDeAdicional> {
    return this.registrar.ejecutar(datos, sesion.usuarioId);
  }

  @Put(':id')
  actualizar(
    @Param('id', ID_DE_ADICIONAL) id: number,
    @Body() datos: AdicionalDto,
    @SesionDeLaSolicitud() sesion: SesionValida,
  ): Promise<VistaDeAdicional> {
    return this.editar.ejecutar(id, datos, sesion.usuarioId);
  }
}
