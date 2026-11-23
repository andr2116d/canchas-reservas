import type { Reloj } from '../../../compartido/aplicacion/reloj.port';
import type { RolUsuario } from '../../../compartido/dominio/rol-usuario';
import { vencimientoDeTemporal } from '../dominio/contrasena-temporal';
import { validarCampos } from '../../../compartido/dominio/validar-campos';
import { Contrasena } from '../dominio/contrasena.value-object';
import { Correo } from '../dominio/correo.value-object';
import { NombrePersona } from '../dominio/nombre-persona.value-object';
import type { ReglasDeCorreo } from '../dominio/reglas-de-correo';
import { Usuario } from '../dominio/usuario.entity';
import type { UsuarioRepository } from '../dominio/usuario.repository';
import type { HasheadorContrasena } from './hasheador-contrasena.port';

export interface DatosDelPersonal {
  nombres: string;
  apellidos: string;
  correo: string;
  contrasena: string;
}

/** Da de alta al personal con una contraseña de un solo uso para el primer acceso. */
export class RegistrarPersonalUseCase {
  constructor(
    private readonly usuarios: UsuarioRepository,
    private readonly hasheador: HasheadorContrasena,
    private readonly correos: ReglasDeCorreo,
    private readonly reloj: Reloj,
  ) {}

  async ejecutar(
    datos: DatosDelPersonal,
    rol: Exclude<RolUsuario, 'JUGADOR'>,
  ): Promise<void> {
    const { contrasena, ...identidad } = validarCampos({
      nombres: () => NombrePersona.crear(datos.nombres, 'nombres'),
      apellidos: () => NombrePersona.crear(datos.apellidos, 'apellidos'),
      correo: () => this.correos.exigirParaRol(rol, Correo.crear(datos.correo)),
      contrasena: () => Contrasena.crear(datos.contrasena),
    });
    const contrasenaHash = await this.hasheador.hashear(contrasena);
    await this.usuarios.crearPersonal(
      Usuario.registrarPersonal(
        { ...identidad, contrasenaHash },
        rol,
        vencimientoDeTemporal(this.reloj.ahora()),
      ),
    );
  }
}
