import type { Reloj } from '../../../compartido/aplicacion/reloj.port';
import type { Correo } from '../../correo/dominio/correo';
import {
  type DatosDeLaHoja,
  HojaDeReclamacion,
} from '../dominio/hoja-de-reclamacion.entity';
import type { HojaRepository } from '../dominio/hoja.repository';
import { formatearCodigo } from '../dominio/codigo-de-seguimiento';
import { redactarCopiaDeLaHoja } from './copia-de-la-hoja';
import type { DatosDelProveedor, Proveedor } from './datos-del-proveedor.port';
import type { GeneradorDeCodigo } from './generador-de-codigo.port';
import { verHoja, type VistaDeLaHoja } from './vista-de-la-hoja';

/** Lo que el caso de uso necesita de otros módulos y de la infraestructura. */
export interface DependenciasDelRegistro {
  hojas: HojaRepository;
  generador: GeneradorDeCodigo;
  proveedor: DatosDelProveedor;
  correos: { ejecutar(correo: Correo): Promise<void> };
  reloj: Reloj;
}

/** La constancia que ve y recibe quien reclama al registrar su hoja. */
export interface Constancia {
  numero: string;
  codigo: string;
  registradaEn: Date;
  fechaLimite: string;
  proveedor: Proveedor;
  hoja: VistaDeLaHoja;
}

/**
 * Registra una hoja sin pedir cuenta ni pago (DS 011-2011-PCM, art. 6): le da número y código de
 * seguimiento y envía la copia al correo de quien reclama y, si es menor de edad, de quien lo representa.
 */
export class RegistrarHojaUseCase {
  constructor(private readonly d: DependenciasDelRegistro) {}

  async ejecutar(
    datos: DatosDeLaHoja,
    titularId: number | null,
  ): Promise<Constancia> {
    const hoja = HojaDeReclamacion.registrar(datos, this.d.reloj.ahora());
    const codigo = this.d.generador.generar();
    const numero = await this.d.hojas.registrar(hoja, { codigo, titularId });
    const constancia: Constancia = {
      numero: numero.texto,
      codigo: formatearCodigo(codigo),
      registradaEn: hoja.registradaEn,
      fechaLimite: hoja.fechaLimite,
      proveedor: await this.d.proveedor.consultar(),
      hoja: verHoja(hoja),
    };
    await this.enviarCopias(constancia);
    return constancia;
  }

  private async enviarCopias(constancia: Constancia): Promise<void> {
    const copia = redactarCopiaDeLaHoja(constancia);
    const { consumidor, representante } = constancia.hoja;
    const destinatarios = new Set([consumidor.correo, representante?.correo]);
    for (const para of destinatarios) {
      if (para) await this.d.correos.ejecutar({ para, ...copia });
    }
  }
}
