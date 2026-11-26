import { sugerirUsuarioDeCorreo } from '../dominio/correo-institucional';
import type { ReglasDeCorreo } from '../dominio/reglas-de-correo';
import type { UsuarioRepository } from '../dominio/usuario.repository';

// Tope de intentos para no recorrer sin fin si todo está ocupado.
const INTENTOS_MAXIMOS = 99;

/** Sugiere un correo institucional libre a partir de los nombres y apellidos. */
export class SugerirCorreoInstitucionalUseCase {
  constructor(
    private readonly usuarios: Pick<UsuarioRepository, 'existeConCorreo'>,
    private readonly correos: ReglasDeCorreo,
  ) {}

  async ejecutar(
    nombres: string,
    apellidos: string,
  ): Promise<{ usuarioDeCorreo: string } | undefined> {
    for (let intento = 1; intento <= INTENTOS_MAXIMOS; intento++) {
      const usuarioDeCorreo = sugerirUsuarioDeCorreo(
        nombres,
        apellidos,
        intento,
      );
      if (!usuarioDeCorreo) return undefined;
      const correo = this.correos.institucional(usuarioDeCorreo);
      if (!(await this.usuarios.existeConCorreo(correo))) {
        return { usuarioDeCorreo };
      }
    }
    return undefined;
  }
}
