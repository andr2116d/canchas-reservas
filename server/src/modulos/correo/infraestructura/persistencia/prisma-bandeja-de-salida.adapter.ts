import { Inject, Injectable } from '@nestjs/common';
import {
  CIFRADOR,
  type Cifrador,
} from '../../../../compartido/aplicacion/cifrador.port';
import {
  RELOJ,
  type Reloj,
} from '../../../../compartido/aplicacion/reloj.port';
import { PrismaService } from '../../../../compartido/infraestructura/prisma/prisma.service';
import {
  type BandejaDeSalida,
  MINUTOS_DE_RESERVA,
} from '../../aplicacion/bandeja-de-salida.port';
import type { Correo, CorreoEnCola } from '../../dominio/correo';

interface FilaTomada {
  id: number;
  intentos: number;
  destinatario_cifrado: string;
  asunto: string;
  texto_cifrado: string;
  html_cifrado: string;
}

/** Bandeja de salida en PostgreSQL, con el destinatario y los cuerpos cifrados. */
@Injectable()
export class PrismaBandejaDeSalidaAdapter implements BandejaDeSalida {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(CIFRADOR) private readonly cifrador: Cifrador,
    @Inject(RELOJ) private readonly reloj: Reloj,
  ) {}

  async encolar(correo: Correo): Promise<void> {
    await this.prisma.correoSaliente.create({
      data: {
        destinatarioCifrado: this.cifrador.cifrar(correo.para),
        asunto: correo.asunto,
        textoCifrado: this.cifrador.cifrar(correo.texto),
        htmlCifrado: this.cifrador.cifrar(correo.html),
        proximoIntentoEn: this.reloj.ahora(),
      },
    });
  }

  /** SKIP LOCKED: si dos procesos reparten a la vez, cada uno se lleva correos distintos. */
  async tomarPendientes(
    ahora: Date,
    cantidad: number,
  ): Promise<CorreoEnCola[]> {
    const reservadoHasta = new Date(
      ahora.getTime() + MINUTOS_DE_RESERVA * 60_000,
    );
    const filas = await this.prisma.$queryRaw<FilaTomada[]>`
      UPDATE correo_saliente
      SET intentos = intentos + 1, proximo_intento_en = ${reservadoHasta}, actualizado_en = ${ahora}
      WHERE id IN (
        SELECT id FROM correo_saliente
        WHERE estado = 'pendiente' AND proximo_intento_en <= ${ahora}
        ORDER BY proximo_intento_en, id
        LIMIT ${cantidad}
        FOR UPDATE SKIP LOCKED
      )
      RETURNING id, intentos, destinatario_cifrado, asunto, texto_cifrado, html_cifrado`;
    return filas
      .sort((a, b) => a.id - b.id)
      .map((fila) => ({
        id: fila.id,
        intentos: fila.intentos,
        para: this.cifrador.descifrar(fila.destinatario_cifrado),
        asunto: fila.asunto,
        texto: this.cifrador.descifrar(fila.texto_cifrado),
        html: this.cifrador.descifrar(fila.html_cifrado),
      }));
  }

  async marcarEnviado(id: number, enviadoEn: Date): Promise<void> {
    await this.prisma.correoSaliente.update({
      where: { id },
      data: { estado: 'ENVIADO', enviadoEn, ultimoError: null },
    });
  }

  async reprogramar(
    id: number,
    proximoIntentoEn: Date,
    error: string,
  ): Promise<void> {
    await this.prisma.correoSaliente.update({
      where: { id },
      data: { proximoIntentoEn, ultimoError: error },
    });
  }

  async marcarFallido(id: number, error: string): Promise<void> {
    await this.prisma.correoSaliente.update({
      where: { id },
      data: { estado: 'FALLIDO', ultimoError: error },
    });
  }
}
