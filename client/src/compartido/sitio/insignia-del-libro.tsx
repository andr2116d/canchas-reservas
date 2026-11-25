import Link from "next/link";
import { RUTA_DEL_LIBRO_DE_RECLAMACIONES } from "./rutas-del-sitio";

/** Enlace permanente y visible al Libro de Reclamaciones, con la imagen de un libro abierto. */
export function InsigniaDelLibro() {
  return (
    <Link href={RUTA_DEL_LIBRO_DE_RECLAMACIONES} className="insignia-del-libro">
      <svg viewBox="0 0 48 34" aria-hidden="true" focusable="false">
        <path d="M24 6C18 2 9 2 3 4v26c6-2 15-2 21 2 6-4 15-4 21-2V4c-6-2-15-2-21 2z" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinejoin="round" />
        <path d="M24 6v26" stroke="currentColor" strokeWidth="2.5" />
      </svg>
      <span>
        Libro de Reclamaciones
        <small>Registra un reclamo o una queja</small>
      </span>
    </Link>
  );
}
