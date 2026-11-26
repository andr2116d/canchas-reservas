import type { ReactNode } from "react";
import type { Rol } from "../sesion/destino-de-sesion";
import { BarraDeNavegacion } from "./barra-de-navegacion";

interface MarcoInternoProps {
  rol: Rol;
  venceEn: string;
  conSecciones?: boolean;
  /** Aviso que va antes del contenido, como el de la contraseña temporal. */
  aviso?: ReactNode;
  children: ReactNode;
}

/** Fondo, barra de vidrio y contenido comunes a todas las pantallas con sesión. */
export function MarcoInterno({ rol, venceEn, conSecciones, aviso, children }: MarcoInternoProps) {
  return (
    <div className="marco-interno" data-rol={rol}>
      <a href="#contenido" className="saltar-al-contenido">Saltar al contenido</a>
      <BarraDeNavegacion rol={rol} venceEn={venceEn} conSecciones={conSecciones} />
      <main id="contenido" tabIndex={-1} className="contenido-interno">
        {aviso}
        {children}
      </main>
    </div>
  );
}
