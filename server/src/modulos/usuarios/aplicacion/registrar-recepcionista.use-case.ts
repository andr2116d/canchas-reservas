import type { Reloj } from '../../../compartido/aplicacion/reloj.port';
import { validarCampos } from '../../../compartido/dominio/validar-campos';
import { Contrasena } from '../dominio/contrasena.value-object';
import {
  CuentaYaExisteError,
  MENSAJES_DEL_PERSONAL,
} from '../dominio/cuenta-ya-existe.error';
import { ReactivacionDisponibleError } from '../dominio/reactivacion-disponible.error';
import type {
  CuentaCoincidente,
  RecepcionistaRepository,
} from '../dominio/recepcionista.repository';
import type { ReglasDeCorreo } from '../dominio/reglas-de-correo';
import { Usuario } from '../dominio/usuario.entity';
import {
  construirDatosPersonales,
  type DatosPersonalesEscritos,
} from './datos-personales';
import type { HasheadorContrasena } from './hasheador-contrasena.port';

/** Datos que escribe el administrador al crear una recepcionista. */
export interface DatosDeRecepcionista extends DatosPersonalesEscritos {
  /** Lo que va antes de la @ del correo institucional. */
  usuarioDeCorreo: string;
  /** Contraseña temporal que la recepcionista cambia al entrar. */
  contrasena: string;
}

export interface ContextoDelPersonal {
  reloj: Reloj;
  correos: ReglasDeCorreo;
}

/**
 * Da de alta a una recepcionista con correo institucional y contraseña
 * temporal. Si sus datos coinciden con una cuenta desactivada, ofrece
 * reactivarla en vez de crear otra.
 */
export class RegistrarRecepcionistaUseCase {
  constructor(
    private readonly recepcionistas: RecepcionistaRepository,
    private readonly hasheador: HasheadorContrasena,
    private readonly contexto: ContextoDelPersonal,
  ) {}

  async ejecutar(
    datos: DatosDeRecepcionista,
    administradorId: number,
  ): Promise<{ id: number }> {
    const { reloj, correos } = this.contexto;
    const { contrasena, numeroDocumento, ...campos } = validarCampos({
      ...construirDatosPersonales(datos, reloj.ahora()),
      correo: () => correos.institucional(datos.usuarioDeCorreo),
      contrasena: () => Contrasena.crear(datos.contrasena),
    });
    exigirDatosLibres(
      await this.recepcionistas.buscarCoincidencias(
        numeroDocumento,
        campos.correo,
      ),
    );

    const recepcionista = Usuario.registrarRecepcionista({
      ...campos,
      documento: numeroDocumento,
      contrasenaHash: await this.hasheador.hashear(contrasena),
    });
    const id = await this.recepcionistas.crear(recepcionista, {
      accion: 'ALTA',
      ejecutadoPorId: administradorId,
      ocurridoEn: reloj.ahora(),
    });
    return { id };
  }
}

/** Rechaza datos de cuentas activas; si solo coincide una desactivada, ofrece reactivarla. */
function exigirDatosLibres(coincidencias: CuentaCoincidente[]): void {
  const activas = coincidencias.filter((cuenta) => cuenta.estado === 'ACTIVO');
  const desactivada = coincidencias.find(
    (cuenta) => cuenta.rol === 'RECEPCIONISTA' && cuenta.estado !== 'ACTIVO',
  );
  if (activas.length === 0 && desactivada) {
    throw new ReactivacionDisponibleError({
      id: desactivada.id,
      nombres: desactivada.nombres,
    });
  }
  if (coincidencias.length > 0) {
    const culpables = activas.length > 0 ? activas : coincidencias;
    const repetidos = [...new Set(culpables.flatMap((c) => c.coincideEn))];
    throw new CuentaYaExisteError(repetidos, MENSAJES_DEL_PERSONAL);
  }
}
