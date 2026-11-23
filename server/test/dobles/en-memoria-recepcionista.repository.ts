import type { EstadoUsuario } from '../../src/compartido/dominio/rol-usuario';
import type { Correo } from '../../src/modulos/usuarios/dominio/correo.value-object';
import type { DocumentoIdentidad } from '../../src/modulos/usuarios/dominio/documento-identidad.value-object';
import type {
  AccionRegistrada,
  CuentaCoincidente,
  FichaConHistorial,
  FichaDeRecepcionista,
  RecepcionistaRepository,
} from '../../src/modulos/usuarios/dominio/recepcionista.repository';
import { Usuario } from '../../src/modulos/usuarios/dominio/usuario.entity';

/** Copia del usuario con su id y, si se indica, otro estado. */
function guardado(usuario: Usuario, id: number, estado = usuario.estado) {
  return Usuario.restaurar({
    id,
    nombres: usuario.nombres,
    apellidos: usuario.apellidos,
    fechaNacimiento: usuario.fechaNacimiento,
    documento: usuario.documento,
    correo: usuario.correo,
    celular: usuario.celular,
    contrasenaHash: usuario.contrasenaHash,
    rol: usuario.rol,
    estado,
    requiereCambiarContrasena: usuario.requiereCambiarContrasena,
  });
}

function fichaDe(cuenta: Usuario): FichaDeRecepcionista {
  return {
    id: cuenta.id ?? 0,
    nombres: cuenta.nombres.texto,
    apellidos: cuenta.apellidos.texto,
    correo: cuenta.correo.direccion,
    tipoDocumento: cuenta.documento?.tipo ?? '',
    numeroDocumento: cuenta.documento?.numero ?? '',
    fechaNacimiento: cuenta.fechaNacimiento?.fecha ?? '',
    celular: cuenta.celular?.numero ?? '',
    estado: cuenta.estado,
    requiereCambiarContrasena: cuenta.requiereCambiarContrasena,
    creadaEn: new Date(0),
  };
}

/** Repositorio en memoria del personal para probar casos de uso sin base de datos. */
export class EnMemoriaRecepcionistaRepository implements RecepcionistaRepository {
  private readonly cuentas: Usuario[] = [];
  readonly acciones: (AccionRegistrada & { usuarioAfectadoId: number })[] = [];

  /** Guarda una cuenta ya existente, para preparar una prueba. */
  agregar(usuario: Usuario, estado?: EstadoUsuario): number {
    const id = this.cuentas.length + 1;
    this.cuentas.push(guardado(usuario, id, estado));
    return id;
  }

  buscarCoincidencias(
    documento: DocumentoIdentidad,
    correo: Correo,
  ): Promise<CuentaCoincidente[]> {
    const coincidencias = this.cuentas.flatMap((cuenta) => {
      const coincideEn = [
        cuenta.rol === 'RECEPCIONISTA' &&
          cuenta.documento?.identificador() === documento.identificador() &&
          ('numeroDocumento' as const),
        cuenta.correo.direccion === correo.direccion && ('correo' as const),
      ].filter((dato) => dato !== false);
      if (coincideEn.length === 0) return [];
      return [
        {
          id: cuenta.id ?? 0,
          nombres: cuenta.nombres.texto,
          rol: cuenta.rol,
          estado: cuenta.estado,
          coincideEn,
        },
      ];
    });
    return Promise.resolve(coincidencias);
  }

  listar(estado: EstadoUsuario): Promise<FichaDeRecepcionista[]> {
    return Promise.resolve(
      this.cuentas
        .filter((cuenta) => cuenta.rol === 'RECEPCIONISTA')
        .filter((cuenta) => cuenta.estado === estado)
        .map(fichaDe),
    );
  }

  buscar(id: number): Promise<FichaConHistorial | undefined> {
    const cuenta = this.cuentas.find(
      (candidata) => candidata.id === id && candidata.rol === 'RECEPCIONISTA',
    );
    return Promise.resolve(cuenta && { ficha: fichaDe(cuenta), historial: [] });
  }

  crear(recepcionista: Usuario, accion: AccionRegistrada): Promise<number> {
    const id = this.agregar(recepcionista);
    this.acciones.push({ ...accion, usuarioAfectadoId: id });
    return Promise.resolve(id);
  }

  todas(): readonly Usuario[] {
    return this.cuentas;
  }
}
