import type { Reloj } from '../../../compartido/aplicacion/reloj.port';
import {
  ConflictoError,
  NoEncontradoError,
  ReglaInvalidaError,
} from '../../../compartido/dominio/dominio.error';
import { validarCampos } from '../../../compartido/dominio/validar-campos';
import { CuentaYaExisteError } from '../dominio/cuenta-ya-existe.error';
import { DocumentoIdentidad } from '../dominio/documento-identidad.value-object';
import type { UsuarioRepository } from '../dominio/usuario.repository';

export interface CambioDeTipoDeDocumento {
  tipoDocumento: string;
  numeroDocumento: string;
  /** La persona leyó el aviso legal del cambio. */
  aceptaAviso: boolean;
}

const YA_CAMBIADO =
  'El tipo de documento ya se cambió una vez. Para otro cambio, habla con administración.';

/**
 * El personal pasa de DNI a carné de extranjería, o al revés, con su número
 * nuevo. Solo una vez en la vida de la cuenta y tras aceptar el aviso legal.
 */
export class CambiarMiTipoDeDocumentoUseCase {
  constructor(
    private readonly usuarios: Pick<
      UsuarioRepository,
      'buscarPorId' | 'existeConDocumento' | 'aplicarCambioPropio'
    >,
    private readonly reloj: Reloj,
  ) {}

  async ejecutar(
    usuarioId: number,
    pedido: CambioDeTipoDeDocumento,
  ): Promise<void> {
    const usuario = await this.usuarios.buscarPorId(usuarioId);
    if (!usuario) throw new NoEncontradoError('No encontramos la cuenta.');
    if (usuario.rol === 'JUGADOR' || !usuario.documento)
      throw new ReglaInvalidaError({
        tipoDocumento: 'Este dato no se puede cambiar desde la cuenta.',
      });
    if (usuario.documentoCambiadoEn) throw new ConflictoError(YA_CAMBIADO, {});
    if (!pedido.aceptaAviso)
      throw new ReglaInvalidaError({
        aceptaAviso:
          'Confirma que leíste el aviso antes de cambiar el tipo de documento.',
      });
    if (pedido.tipoDocumento === usuario.documento.tipo)
      throw new ReglaInvalidaError({
        tipoDocumento: 'Elige un tipo de documento distinto al actual.',
      });
    const { numeroDocumento: documento } = validarCampos({
      numeroDocumento: () =>
        DocumentoIdentidad.crear(pedido.tipoDocumento, pedido.numeroDocumento),
    });
    if (await this.usuarios.existeConDocumento(documento, usuario.rol))
      throw new CuentaYaExisteError(['numeroDocumento']);

    const aplicado = await this.usuarios.aplicarCambioPropio({
      usuarioId,
      datos: { documento },
      accion: 'CAMBIO_DE_DOCUMENTO',
      ocurridoEn: this.reloj.ahora(),
      marca: 'DOCUMENTO_CAMBIADO',
    });
    if (!aplicado) throw new ConflictoError(YA_CAMBIADO, {});
  }
}
