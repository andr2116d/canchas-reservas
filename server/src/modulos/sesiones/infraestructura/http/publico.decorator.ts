import { SetMetadata } from '@nestjs/common';

export const ES_RUTA_PUBLICA = 'esRutaPublica';

/** Marca una ruta que no exige sesión. Todas las demás son privadas por defecto. */
export const Publico = () => SetMetadata(ES_RUTA_PUBLICA, true);
