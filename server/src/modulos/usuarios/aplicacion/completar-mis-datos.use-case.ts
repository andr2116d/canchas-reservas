import type { Reloj } from '../../../compartido/aplicacion/reloj.port';
import {
  ConflictoError,
  NoEncontradoError,
} from '../../../compartido/dominio/dominio.error';
import { validarCampos } from '../../../compartido/dominio/validar-campos';
import { Celular } from '../dominio/celular.value-object';
import { CuentaYaExisteError } from '../dominio/cuenta-ya-existe.error';
import { DocumentoIdentidad } from '../../../compartido/dominio/documento-identidad.value-object';
import { exigirMismoDocumento } from '../dominio/documento-fijo';
import { FechaNacimiento } from '../dominio/fecha-nacimiento.value-object';
import { NombrePersona } from '../../../compartido/dominio/nombre-persona.value-object';
import type { UsuarioRepository } from '../dominio/usuario.repository';

/** Datos del primer ingreso; el documento solo lo escribe quien aún no lo tiene. */
export interface DatosParaConfirmar {
  nombres: string;
  apellidos: string;
  /** AAAA-MM-DD. */
  fechaNacimiento: string;
  celular: string;
  tipoDocumento?: string;
  numeroDocumento?: string;
}

/**
 * Primer ingreso del personal: el administrador completa sus datos; la
 * recepcionista confirma o corrige los que cargó administración, menos el
 * documento. Queda en la auditoría y solo se hace una vez.
 */
export class CompletarMisDatosUseCase {
  constructor(
    private readonly usuarios: Pick<
      UsuarioRepository,
      'buscarPorId' | 'existeConDocumento' | 'aplicarCambioPropio'
    >,
    private readonly reloj: Reloj,
  ) {}

  async ejecutar(usuarioId: number, datos: DatosParaConfirmar): Promise<void> {
    const usuario = await this.usuarios.buscarPorId(usuarioId);
    if (!usuario || usuario.rol === 'JUGADOR')
      throw new NoEncontradoError('No encontramos la cuenta.');
    if (usuario.datosConfirmadosEn) throw yaConfirmados();
    const ahora = this.reloj.ahora();
    const leidos = validarCampos({
      nombres: () => NombrePersona.crear(datos.nombres, 'nombres'),
      apellidos: () => NombrePersona.crear(datos.apellidos, 'apellidos'),
      fechaNacimiento: () =>
        FechaNacimiento.crear(datos.fechaNacimiento, ahora),
      celular: () => Celular.crear(datos.celular),
      numeroDocumento: () =>
        usuario.documento ??
        DocumentoIdentidad.crear(
          datos.tipoDocumento ?? '',
          datos.numeroDocumento ?? '',
        ),
    });
    const { numeroDocumento: documento, ...personales } = leidos;
    if (usuario.documento) exigirMismoDocumento(usuario.documento, datos);
    else if (await this.usuarios.existeConDocumento(documento, usuario.rol))
      throw new CuentaYaExisteError(['numeroDocumento']);

    const aplicado = await this.usuarios.aplicarCambioPropio({
      usuarioId,
      datos: { ...personales, documento },
      accion: 'CONFIRMACION_DE_DATOS',
      ocurridoEn: ahora,
      marca: 'DATOS_CONFIRMADOS',
    });
    if (!aplicado) throw yaConfirmados();
  }
}

const yaConfirmados = () =>
  new ConflictoError('Los datos de esta cuenta ya están confirmados.', {});
