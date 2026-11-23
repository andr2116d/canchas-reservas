import { validarCampos } from '../../../compartido/dominio/validar-campos';
import {
  CuentaYaExisteError,
  MENSAJES_DEL_PERSONAL,
} from '../dominio/cuenta-ya-existe.error';
import { RecepcionistaNoEncontradaError } from '../dominio/recepcionista-no-encontrada.error';
import type { RecepcionistaRepository } from '../dominio/recepcionista.repository';
import { construirDatosPersonales } from './datos-personales';
import type { ContextoDeCuentas } from './contexto-de-cuentas';
import type { DatosDeRecepcionista } from './registrar-recepcionista.use-case';

export type DatosEditados = Omit<DatosDeRecepcionista, 'contrasena'>;

const MENSAJES_DE_OTRA_CUENTA = {
  ...MENSAJES_DEL_PERSONAL,
  numeroDocumento: 'Este documento ya pertenece a otra cuenta de recepción.',
};

/** Cambia los datos personales y el correo de una recepcionista. El rol no cambia. */
export class EditarRecepcionistaUseCase {
  constructor(
    private readonly recepcionistas: Pick<
      RecepcionistaRepository,
      'buscar' | 'buscarCoincidencias' | 'actualizar'
    >,
    private readonly contexto: ContextoDeCuentas,
  ) {}

  async ejecutar(
    id: number,
    datos: DatosEditados,
    administradorId: number,
  ): Promise<void> {
    const { reloj, correos } = this.contexto;
    const { numeroDocumento, ...campos } = validarCampos({
      ...construirDatosPersonales(datos, reloj.ahora()),
      correo: () => correos.institucional(datos.usuarioDeCorreo),
    });
    if (!(await this.recepcionistas.buscar(id))) {
      throw new RecepcionistaNoEncontradaError();
    }
    const ajenas = (
      await this.recepcionistas.buscarCoincidencias(
        numeroDocumento,
        campos.correo,
      )
    ).filter((cuenta) => cuenta.id !== id);
    if (ajenas.length > 0) {
      const repetidos = [...new Set(ajenas.flatMap((c) => c.coincideEn))];
      throw new CuentaYaExisteError(repetidos, MENSAJES_DE_OTRA_CUENTA);
    }

    const editada = await this.recepcionistas.actualizar(
      id,
      { datos: { ...campos, documento: numeroDocumento } },
      {
        accion: 'EDICION',
        ejecutadoPorId: administradorId,
        ocurridoEn: reloj.ahora(),
      },
    );
    if (!editada) throw new RecepcionistaNoEncontradaError();
  }
}
