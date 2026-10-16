import type { UsuarioActividad } from "../api";
import { ROLES } from "../formato";

export function CeldaUsuario({ usuario, vacio }: { usuario: UsuarioActividad | null; vacio: string }) {
  if (!usuario) return <span className="text-texto-suave">{vacio}</span>;
  return (
    <div className="flex flex-col">
      <span>{usuario.nombre}</span>
      <span className="text-xs text-texto-suave">{ROLES[usuario.rol] ?? usuario.rol}</span>
    </div>
  );
}
