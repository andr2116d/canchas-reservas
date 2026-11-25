import Link from "next/link";
import type { ClubPublico } from "@/compartido/club/servicios/club";
import { reglaEnPalabras } from "@/compartido/club/utilidades/regla-en-palabras";

function Pregunta({ titulo, abierta, children }: { titulo: string; abierta?: boolean; children: React.ReactNode }) {
  return (
    <details open={abierta} className="pregunta-frecuente">
      <summary>{titulo}</summary>
      <div className="flex flex-col gap-3 px-5 pb-5 text-grava">{children}</div>
    </details>
  );
}

function Cancelar({ cancelacion }: Pick<ClubPublico, "cancelacion">) {
  if (!cancelacion) return <p>Sí, desde tu cuenta. Pronto publicaremos cuánto se devuelve según la anticipación.</p>;
  return (
    <>
      <p>Sí, desde tu cuenta, hasta que empiece el turno. Lo que se devuelve del adelanto depende de cuánto antes canceles:</p>
      <table className="tabla-de-la-regla">
        <thead><tr><th scope="col">Si cancelas</th><th scope="col">Se devuelve</th></tr></thead>
        <tbody>{reglaEnPalabras(cancelacion).map((fila) => <tr key={fila.cuando}><td>{fila.cuando}</td><td>{fila.devolucion}</td></tr>)}</tbody>
      </table>
      <p>Lo que pagaste por encima del adelanto se devuelve siempre. <Link href="/legal/cancelaciones" className="font-bold text-botella underline">Ver la política completa</Link></p>
    </>
  );
}

/** Lo que se suele preguntar antes de reservar, respondido con las reglas que guardó administración. */
export function PreguntasFrecuentes({ cancelacion, adicionales }: Pick<ClubPublico, "cancelacion" | "adicionales">) {
  return (
    <div className="flex flex-col gap-2.5">
      <Pregunta titulo="¿Puedo cancelar mi reserva?" abierta><Cancelar cancelacion={cancelacion} /></Pregunta>
      <Pregunta titulo="¿Y si la cancha no se puede usar?">
        <p>Si el local cierra una cancha por una emergencia, eliges entre la devolución del 100 %, reprogramar sin costo o un crédito.</p>
      </Pregunta>
      <Pregunta titulo="¿Prestan pelota y chalecos?">
        {adicionales.length === 0 ? (
          <p>Pregunta en recepción qué material hay disponible.</p>
        ) : (
          <>
            <p>Sí. Avísalo al reservar y recepción lo tendrá listo. Solo se cobra si se pierde o se rompe, por unidad:</p>
            <ul className="flex flex-col gap-1">{adicionales.map((a) => <li key={a.nombre}><strong className="text-tinta">{a.nombre}</strong> · S/ {a.precio}{a.descripcion ? ` · ${a.descripcion}` : ""}</li>)}</ul>
          </>
        )}
      </Pregunta>
      <Pregunta titulo="¿Necesito una cuenta para ver los turnos?">
        <p>No. Cualquiera ve los turnos libres. La cuenta se pide para reservar y pagar.</p>
      </Pregunta>
      <Pregunta titulo="¿Quién puede reservar?">
        <p>La persona que reserva y paga debe tener 18 años cumplidos. Tu equipo puede ser de cualquier edad.</p>
      </Pregunta>
    </div>
  );
}
