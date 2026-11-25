import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import {
  RequerirPermiso,
  type SesionValida,
  SesionDeLaSolicitud,
} from '../../../sesiones/api-sesiones';
import {
  AbrirHojaUseCase,
  ClasificarHojaUseCase,
  TramitarComoReclamoUseCase,
} from '../../aplicacion/atender-hoja.use-case';
import { ConsultarHojasUseCase } from '../../aplicacion/consultar-hojas.use-case';
import { ResponderHojaUseCase } from '../../aplicacion/responder-hoja.use-case';
import { VerHojaUseCase } from '../../aplicacion/ver-hoja.use-case';
import type { HojaParaAtender } from '../../aplicacion/vista-para-administracion';
import {
  ClasificacionDto,
  FiltroDeHojasDto,
  RespuestaDto,
} from './atencion.dto';

/** Lista y hojas de administración. Abrir una hoja devuelve cómo quedó. */
@Controller('reclamos')
@RequerirPermiso('reclamos:gestionar')
export class ReclamosController {
  constructor(
    private readonly consultar: ConsultarHojasUseCase,
    private readonly ver: VerHojaUseCase,
    private readonly abrir: AbrirHojaUseCase,
  ) {}

  @Get()
  listar(@Query() filtro: FiltroDeHojasDto) {
    return this.consultar.ejecutar(filtro);
  }

  @Get(':numero')
  hoja(@Param('numero') numero: string): Promise<HojaParaAtender> {
    return this.ver.ejecutar(numero);
  }

  /** Al abrir la hoja en pantalla: la primera vez pasa a «en atención». */
  @Post(':numero/apertura')
  @HttpCode(HttpStatus.OK)
  async abrirHoja(
    @Param('numero') numero: string,
    @SesionDeLaSolicitud() sesion: SesionValida,
  ): Promise<HojaParaAtender> {
    await this.abrir.ejecutar(numero, sesion.usuarioId);
    return this.ver.ejecutar(numero);
  }
}

/** Las acciones que cambian una hoja. Cada una devuelve la hoja como quedó. */
@Controller('reclamos')
@RequerirPermiso('reclamos:gestionar')
export class AtencionDeReclamosController {
  constructor(
    private readonly ver: VerHojaUseCase,
    private readonly clasificar: ClasificarHojaUseCase,
    private readonly tramitar: TramitarComoReclamoUseCase,
    private readonly responder: ResponderHojaUseCase,
  ) {}

  @Put(':numero/motivo')
  async clasificarHoja(
    @Param('numero') numero: string,
    @Body() { motivo }: ClasificacionDto,
    @SesionDeLaSolicitud() sesion: SesionValida,
  ): Promise<HojaParaAtender> {
    await this.clasificar.ejecutar(numero, motivo, sesion.usuarioId);
    return this.ver.ejecutar(numero);
  }

  /** Una queja que describe un problema con el servicio pasa a tramitarse como reclamo. */
  @Post(':numero/tramite-como-reclamo')
  @HttpCode(HttpStatus.OK)
  async tramitarComoReclamo(
    @Param('numero') numero: string,
    @SesionDeLaSolicitud() sesion: SesionValida,
  ): Promise<HojaParaAtender> {
    await this.tramitar.ejecutar(numero, sesion.usuarioId);
    return this.ver.ejecutar(numero);
  }

  @Post(':numero/respuesta')
  @HttpCode(HttpStatus.OK)
  async responderHoja(
    @Param('numero') numero: string,
    @Body() respuesta: RespuestaDto,
    @SesionDeLaSolicitud() sesion: SesionValida,
  ): Promise<HojaParaAtender> {
    await this.responder.ejecutar(numero, respuesta, sesion.usuarioId);
    return this.ver.ejecutar(numero);
  }
}
