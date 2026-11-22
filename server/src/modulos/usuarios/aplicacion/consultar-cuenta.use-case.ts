import type { UsuarioRepository } from '../dominio/usuario.repository';

/** Lo que la persona ve de su propia cuenta. */
export interface Cuenta {
  nombres: string;
}

/** Datos de la cuenta del usuario con sesión iniciada. */
export class ConsultarCuentaUseCase {
  constructor(private readonly usuarios: UsuarioRepository) {}

  async ejecutar(usuarioId: number): Promise<Cuenta | undefined> {
    const usuario = await this.usuarios.buscarPorId(usuarioId);
    return usuario ? { nombres: usuario.nombres.texto } : undefined;
  }
}
