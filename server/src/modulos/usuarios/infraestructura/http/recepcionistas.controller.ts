import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ReglaInvalidaError } from '../../../../compartido/dominio/dominio.error';
import {
  RequerirPermiso,
  SesionDeLaSolicitud,
  type SesionValida,
} from '../../../sesiones/api-sesiones';
import { RegistrarRecepcionistaUseCase } from '../../aplicacion/registrar-recepcionista.use-case';
import { SugerirCorreoInstitucionalUseCase } from '../../aplicacion/sugerir-correo-institucional.use-case';
import { ConsultarRecepcionistasUseCase } from '../../aplicacion/consultar-recepcionistas.use-case';
import { EditarRecepcionistaUseCase } from '../../aplicacion/editar-recepcionista.use-case';
import { EditarRecepcionistaDto } from './editar-recepcionista.dto';
import type {
  FichaConHistorial,
  FichaDeRecepcionista,
} from '../../dominio/recepcionista.repository';
import { CorreoSugeridoDto } from './correo-sugerido.dto';
import { ID_DE_RECEPCIONISTA } from './id-de-recepcionista.pipe';
import {
  ESTADOS_DEL_LISTADO,
  ListarRecepcionistasDto,
} from './listar-recepcionistas.dto';
import { RegistrarRecepcionistaDto } from './registrar-recepcionista.dto';

/** Gestión de las cuentas de recepción. Solo para el administrador. */
@Controller('recepcionistas')
@RequerirPermiso('personal:gestionar-recepcionistas')
export class RecepcionistasController {
  constructor(
    private readonly registrar: RegistrarRecepcionistaUseCase,
    private readonly sugerirCorreo: SugerirCorreoInstitucionalUseCase,
    private readonly consultar: ConsultarRecepcionistasUseCase,
    private readonly editar: EditarRecepcionistaUseCase,
  ) {}

  @Get()
  listar(
    @Query() { estado }: ListarRecepcionistasDto,
  ): Promise<FichaDeRecepcionista[]> {
    return this.consultar.listar(ESTADOS_DEL_LISTADO[estado]);
  }

  @Get('correo-sugerido')
  async sugerir(
    @Query() { nombres, apellidos }: CorreoSugeridoDto,
  ): Promise<{ usuarioDeCorreo: string }> {
    const sugerencia = await this.sugerirCorreo.ejecutar(nombres, apellidos);
    if (!sugerencia) {
      throw new ReglaInvalidaError({
        correo: 'Escribe los nombres y apellidos para generar el correo.',
      });
    }
    return sugerencia;
  }

  @Get(':id')
  ficha(
    @Param('id', ID_DE_RECEPCIONISTA) id: number,
  ): Promise<FichaConHistorial> {
    return this.consultar.ficha(id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  crear(
    @Body() datos: RegistrarRecepcionistaDto,
    @SesionDeLaSolicitud() sesion: SesionValida,
  ): Promise<{ id: number }> {
    return this.registrar.ejecutar(datos, sesion.usuarioId);
  }

  @Patch(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  actualizar(
    @Param('id', ID_DE_RECEPCIONISTA) id: number,
    @Body() datos: EditarRecepcionistaDto,
    @SesionDeLaSolicitud() sesion: SesionValida,
  ): Promise<void> {
    return this.editar.ejecutar(id, datos, sesion.usuarioId);
  }
}
