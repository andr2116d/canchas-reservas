import type { ClubPublico } from "@/compartido/club/servicios/club";
import { reglaEnPalabras } from "@/compartido/club/utilidades/regla-en-palabras";
import type { ApartadoLegal } from "../componentes/documento-legal";
import { DatoPendiente } from "../componentes/dato-pendiente";

export const VIGENCIA_DE_LAS_CANCELACIONES = "24 de noviembre de 2026";

/** La regla vigente con un ejemplo: por cada S/ 100 de adelanto, el porcentaje es lo que vuelve en soles. */
function TablaDeLaRegla({ cancelacion }: Pick<ClubPublico, "cancelacion">) {
  if (!cancelacion) return <p>La regla de cancelación <DatoPendiente texto="aún no se publica" />.</p>;
  return (
    <div className="documento-legal__desliza">
      <table>
        <thead><tr><th scope="col">Si cancelas</th><th scope="col">Se devuelve</th><th scope="col">Ejemplo con S/ 100 de adelanto</th></tr></thead>
        <tbody>
          {reglaEnPalabras(cancelacion).map((fila) => (
            <tr key={fila.cuando}>
              <td>{fila.cuando}</td>
              <td>{fila.devolucion}</td>
              <td className="tabular-nums">Recibes S/ {fila.porcentaje}.00</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** Política de reservas, cancelación y devoluciones, armada con la regla que guardó administración (marco legal §9). */
export function apartadosDeLasCancelaciones({ cancelacion, adelanto }: Pick<ClubPublico, "cancelacion" | "adelanto">): ApartadoLegal[] {
  return [
    {
      id: "adelanto",
      titulo: "¿Cuánto pago para reservar?",
      contenido: <p>{adelanto ? `El adelanto es el ${adelanto} % del precio del turno` : "El adelanto aún no se publica"}. También puedes pagar el total. La reserva se confirma cuando se confirma el pago; el resto se paga en el local.</p>,
    },
    {
      id: "regla",
      titulo: "¿Cuánto se devuelve si cancelo?",
      contenido: (
        <>
          <p>Depende de cuánto antes del inicio del turno confirmes la cancelación:</p>
          <TablaDeLaRegla cancelacion={cancelacion} />
          <p>El límite exacto cuenta a tu favor: si la regla dice «24 horas antes o más» y cancelas justo 24 horas antes, recibes ese porcentaje.</p>
        </>
      ),
    },
    {
      id: "excedente",
      titulo: "¿Y si pagué el total?",
      contenido: <p>Lo que pagaste por encima del adelanto se devuelve siempre, canceles cuando canceles. La regla solo se aplica al adelanto.</p>,
    },
    {
      id: "credito",
      titulo: "¿Me devuelven dinero o crédito?",
      contenido: <p>Cuando corresponde devolver, el dinero siempre es una opción. Si la regla lo permite, también puedes elegir un crédito para otra reserva. Nunca te lo imponemos.</p>,
    },
    {
      id: "como",
      titulo: "¿Cómo cancelo?",
      contenido: <p>Desde tu cuenta, en «Mis reservas», antes de que empiece el turno. Antes de confirmar ves cuánto se devuelve. Si el turno ya empezó, ya no se cancela por la web.</p>,
    },
    {
      id: "plazo",
      titulo: "¿Cuándo llega mi devolución?",
      contenido: <p>Se procesa al mismo medio con que pagaste, en un plazo de <DatoPendiente texto="días hábiles que se precisan antes de publicar la web" />. Lo que tarde en verse en tu cuenta depende de tu banco.</p>,
    },
    {
      id: "local",
      titulo: "¿Y si el local cancela o la cancha falla?",
      contenido: <p>Si el local no puede darte la cancha, eliges entre la devolución del 100 %, reprogramar sin costo o un crédito. Si el turno se interrumpe a la mitad, se devuelve la parte no jugada.</p>,
    },
    {
      id: "regla-de-tu-reserva",
      titulo: "¿Qué regla se aplica a mi reserva?",
      contenido: <p>La que regía cuando la hiciste. Si la regla cambia después, tu reserva no se ve afectada.</p>,
    },
  ];
}
