import type { Provider } from '@nestjs/common';
import { RELOJ, type Reloj } from '../../compartido/aplicacion/reloj.port';
import {
  HASHEADOR_CONTRASENA,
  type HasheadorContrasena,
} from './aplicacion/hasheador-contrasena.port';
import { ConsultarRecepcionistasUseCase } from './aplicacion/consultar-recepcionistas.use-case';
import { RegistrarRecepcionistaUseCase } from './aplicacion/registrar-recepcionista.use-case';
import { SugerirCorreoInstitucionalUseCase } from './aplicacion/sugerir-correo-institucional.use-case';
import {
  USUARIO_REPOSITORY,
  type UsuarioRepository,
} from './dominio/usuario.repository';
import {
  RECEPCIONISTA_REPOSITORY,
  type RecepcionistaRepository,
} from './dominio/recepcionista.repository';
import { ReglasDeCorreo } from './dominio/reglas-de-correo';
import { PrismaRecepcionistaRepository } from './infraestructura/persistencia/prisma-recepcionista.repository';

const CONTEXTO_DEL_PERSONAL = Symbol('CONTEXTO_DEL_PERSONAL');

/** Casos de uso de la gestión de recepcionistas y sus dependencias. */
export const PROVIDERS_DE_RECEPCIONISTAS: Provider[] = [
  {
    provide: RECEPCIONISTA_REPOSITORY,
    useClass: PrismaRecepcionistaRepository,
  },
  {
    provide: CONTEXTO_DEL_PERSONAL,
    useFactory: (reloj: Reloj, correos: ReglasDeCorreo) => ({ reloj, correos }),
    inject: [RELOJ, ReglasDeCorreo],
  },
  {
    provide: RegistrarRecepcionistaUseCase,
    useFactory: (
      recepcionistas: RecepcionistaRepository,
      hasheador: HasheadorContrasena,
      contexto: { reloj: Reloj; correos: ReglasDeCorreo },
    ) => new RegistrarRecepcionistaUseCase(recepcionistas, hasheador, contexto),
    inject: [
      RECEPCIONISTA_REPOSITORY,
      HASHEADOR_CONTRASENA,
      CONTEXTO_DEL_PERSONAL,
    ],
  },
  {
    provide: ConsultarRecepcionistasUseCase,
    useFactory: (recepcionistas: RecepcionistaRepository) =>
      new ConsultarRecepcionistasUseCase(recepcionistas),
    inject: [RECEPCIONISTA_REPOSITORY],
  },
  {
    provide: SugerirCorreoInstitucionalUseCase,
    useFactory: (usuarios: UsuarioRepository, correos: ReglasDeCorreo) =>
      new SugerirCorreoInstitucionalUseCase(usuarios, correos),
    inject: [USUARIO_REPOSITORY, ReglasDeCorreo],
  },
];
