import { Body, Controller, Get, Put } from '@nestjs/common';
import { IsInt, Max, Min } from 'class-validator';
import {
  RequerirPermiso,
  SesionDeLaSolicitud,
  type SesionValida,
} from '../../../sesiones/api-sesiones';
import { VentanaDeLlegadaUseCase } from '../../aplicacion/ventana-de-llegada.use-case';
import type { VentanaDeLlegada } from '../../dominio/ventana-de-llegada';

const MINUTOS = { message: 'Ingresa un número entero de 0 a 120.' };

class DefinirVentanaDeLlegadaDto implements VentanaDeLlegada {
  @IsInt(MINUTOS)
  @Min(0, MINUTOS)
  @Max(120, MINUTOS)
  minutosAntes: number;

  @IsInt(MINUTOS)
  @Min(0, MINUTOS)
  @Max(120, MINUTOS)
  minutosDespues: number;
}

@Controller('ventana-de-llegada')
@RequerirPermiso('ventana-de-llegada:gestionar')
export class VentanaDeLlegadaController {
  constructor(private readonly ventana: VentanaDeLlegadaUseCase) {}

  @Get()
  consultar() {
    return this.ventana.consultar();
  }

  @Put()
  definir(
    @Body() datos: DefinirVentanaDeLlegadaDto,
    @SesionDeLaSolicitud() sesion: SesionValida,
  ) {
    return this.ventana.definir(datos, sesion.usuarioId);
  }
}
