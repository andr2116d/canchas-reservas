import {
  NoEncontradoError,
  ReglaInvalidaError,
} from '../../../compartido/dominio/dominio.error';
import { validarCampos } from '../../../compartido/dominio/validar-campos';
import { Celular } from '../dominio/celular.value-object';
import { Correo } from '../dominio/correo.value-object';
import { CuentaYaExisteError } from '../dominio/cuenta-ya-existe.error';
import { type DatoEditable, DATOS_EDITABLES } from '../dominio/datos-editables';
import { Dorsal } from '../dominio/dorsal.value-object';
import { FechaNacimiento } from '../dominio/fecha-nacimiento.value-object';
import {
  LIMITES_DE_CAMBIOS,
  limiteVigente,
} from '../dominio/limites-de-cambios';
import { NombrePersona } from '../dominio/nombre-persona.value-object';
import type { Usuario } from '../dominio/usuario.entity';
import type {
  DatosPropios,
  UsuarioRepository,
} from '../dominio/usuario.repository';
import type { ContextoDeCuentas } from './contexto-de-cuentas';
import { exigirLimite } from './limite-de-cambios';

export type CambiosDeMiCuenta = Partial<Record<DatoEditable, string>>;

/** La sesión desde la que se cambia la cuenta: se conserva si se cierran las demás. */
interface SesionDelCambio {
  usuarioId: number;
  tokenHash: string;
}

/**
 * Cambia los datos de la propia cuenta que permite cada rol. Solo guarda lo que
 * cambió, con límites por hora y por día; un correo nuevo cierra las demás sesiones.
 */
export class ActualizarMiCuentaUseCase {
  constructor(
    private readonly usuarios: Pick<
      UsuarioRepository,
      | 'buscarPorId'
      | 'existeConCorreo'
      | 'aplicarCambioPropio'
      | 'contarAccionesPropias'
    >,
    private readonly contexto: ContextoDeCuentas,
  ) {}

  async ejecutar(
    { usuarioId, tokenHash }: SesionDelCambio,
    enviados: CambiosDeMiCuenta,
  ): Promise<void> {
    // Solo cuentan los datos que llegaron con valor.
    const cambios = Object.fromEntries(
      Object.entries(enviados).filter(([, valor]) => valor !== undefined),
    ) as CambiosDeMiCuenta;
    const usuario = await this.usuarios.buscarPorId(usuarioId);
    if (!usuario) throw new NoEncontradoError('No encontramos la cuenta.');
    exigirEditables(usuario, cambios);
    const ahora = this.contexto.reloj.ahora();
    const nuevos = soloLoQueCambia(
      usuario,
      this.validar(usuario, cambios, ahora),
    );
    if (Object.keys(nuevos).length === 0) return;

    await exigirLimite(
      this.usuarios,
      usuarioId,
      LIMITES_DE_CAMBIOS.datos,
      ahora,
    );
    if (nuevos.correo) {
      await exigirLimite(
        this.usuarios,
        usuarioId,
        LIMITES_DE_CAMBIOS.correo,
        ahora,
      );
      if (await this.usuarios.existeConCorreo(nuevos.correo))
        throw new CuentaYaExisteError(['correo']);
    }
    await this.usuarios.aplicarCambioPropio({
      usuarioId,
      datos: nuevos,
      accion: nuevos.correo ? 'CAMBIO_DE_CORREO' : 'EDICION_PROPIA',
      ocurridoEn: ahora,
      ...(nuevos.correo && { conservarSesion: tokenHash }),
      limites: [
        limiteVigente(LIMITES_DE_CAMBIOS.datos, ahora),
        ...(nuevos.correo
          ? [limiteVigente(LIMITES_DE_CAMBIOS.correo, ahora)]
          : []),
      ],
    });
  }

  private validar(usuario: Usuario, cambios: CambiosDeMiCuenta, ahora: Date) {
    const { correos } = this.contexto;
    const constructores = {
      nombres: () => NombrePersona.crear(cambios.nombres ?? '', 'nombres'),
      apellidos: () =>
        NombrePersona.crear(cambios.apellidos ?? '', 'apellidos'),
      fechaNacimiento: () =>
        FechaNacimiento.crear(cambios.fechaNacimiento ?? '', ahora),
      correo: () =>
        correos.exigirParaRol(usuario.rol, Correo.crear(cambios.correo ?? '')),
      celular: () => Celular.crear(cambios.celular ?? ''),
      dorsal: () => Dorsal.crearOpcional(cambios.dorsal) ?? null,
    };
    const presentes = Object.fromEntries(
      Object.entries(constructores).filter(([campo]) => campo in cambios),
    ) as Partial<typeof constructores>;
    return validarCampos(presentes) as DatosPropios;
  }
}

/** Quita lo que llegó igual a lo guardado, para que guardar lo mismo no deje registro. */
function soloLoQueCambia(usuario: Usuario, datos: DatosPropios): DatosPropios {
  const iguales: Record<keyof DatosPropios, boolean> = {
    nombres: datos.nombres?.texto === usuario.nombres.texto,
    apellidos: datos.apellidos?.texto === usuario.apellidos.texto,
    fechaNacimiento:
      datos.fechaNacimiento?.fecha === usuario.fechaNacimiento?.fecha,
    documento: true,
    correo: datos.correo?.direccion === usuario.correo.direccion,
    celular: datos.celular?.numero === usuario.celular?.numero,
    dorsal: (datos.dorsal?.numero ?? null) === (usuario.dorsal?.numero ?? null),
  };
  return Object.fromEntries(
    Object.entries(datos).filter(
      ([campo]) => !iguales[campo as keyof DatosPropios],
    ),
  ) as DatosPropios;
}

function exigirEditables(usuario: Usuario, cambios: CambiosDeMiCuenta): void {
  const permitidos: string[] = DATOS_EDITABLES[usuario.rol];
  const ajenos = Object.keys(cambios).filter(
    (campo) => !permitidos.includes(campo),
  );
  if (ajenos.length > 0) {
    throw new ReglaInvalidaError(
      Object.fromEntries(
        ajenos.map((campo) => [
          campo,
          'Este dato no se puede cambiar desde la cuenta.',
        ]),
      ),
    );
  }
}
