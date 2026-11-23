import Link from "next/link";
import { BOTON_PRINCIPAL, BOTON_SECUNDARIO, TARJETA } from "./estilos";

interface CredencialesEntregablesProps {
  id: number;
  correo: string;
  contrasena: string;
  alCrearOtra: () => void;
}

/** Lo que el administrador entrega a la recepcionista: su correo y su contraseña temporal. */
export function CredencialesEntregables({ id, correo, contrasena, alCrearOtra }: CredencialesEntregablesProps) {
  return (
    <section role="status" aria-labelledby="titulo-creada" className={TARJETA}>
      <h2 id="titulo-creada" className="font-titular text-4xl font-black text-tinta">Cuenta creada</h2>
      <p className="mt-2 text-grava">Entrégale estos datos en persona. Al entrar, se le pedirá cambiar la contraseña.</p>
      <dl className="mt-5 grid gap-3 rounded-xl bg-tiza p-4 sm:grid-cols-[auto_1fr] sm:gap-x-6">
        <dt className="text-sm font-semibold text-grava">Correo</dt>
        <dd className="font-bold break-all text-tinta">{correo}</dd>
        <dt className="text-sm font-semibold text-grava">Contraseña temporal</dt>
        <dd className="font-mono text-lg font-bold tracking-wide text-tinta">{contrasena}</dd>
      </dl>
      <div className="mt-5 flex flex-wrap gap-3">
        <Link href={`/administracion/recepcionistas/${id}`} className={BOTON_PRINCIPAL}>Ver su ficha</Link>
        <button type="button" onClick={alCrearOtra} className={BOTON_SECUNDARIO}>Crear otra cuenta</button>
      </div>
    </section>
  );
}
