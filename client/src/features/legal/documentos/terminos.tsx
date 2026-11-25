import Link from "next/link";
import type { ApartadoLegal } from "../componentes/documento-legal";
import { DatoPendiente } from "../componentes/dato-pendiente";

export const VIGENCIA_DE_LOS_TERMINOS = "24 de noviembre de 2026";

/** Términos y condiciones de uso de la web y de las reservas (marco legal §8 y §9). */
export const APARTADOS_DE_LOS_TERMINOS: ApartadoLegal[] = [
  {
    id: "quien",
    titulo: "¿Quién presta el servicio?",
    contenido: (
      <>
        <p>La Previa alquila canchas de fútbol 5 y 7 en Trujillo, La Libertad. La razón social, el RUC y la dirección del local: <DatoPendiente />.</p>
        <p>Al crear tu cuenta o reservar aceptas estos términos. Si no estás de acuerdo con algo, no reserves y escríbenos antes.</p>
      </>
    ),
  },
  {
    id: "cuenta",
    titulo: "¿Quién puede tener una cuenta?",
    contenido: (
      <>
        <p>La cuenta de jugador es de la persona que reserva y paga, que debe tener 18 años cumplidos. Tu equipo puede ser de cualquier edad.</p>
        <p>Usa tus propios datos y cuida tu contraseña: lo que se haga con tu cuenta se entiende hecho por ti. Si crees que alguien más la usa, avísanos.</p>
      </>
    ),
  },
  {
    id: "reservar",
    titulo: "¿Cómo se reserva?",
    contenido: (
      <ul>
        <li>Eliges la fecha, la hora y la cancha. Ves el precio final del turno, con IGV, antes de pagar; no se agregan cargos al final.</li>
        <li>Pagas el adelanto que se indica o el total. El resto se paga en el local.</li>
        <li>La reserva se confirma cuando el pago se confirma, no antes.</li>
        <li>Un turno que empieza de día y termina de noche se cobra en proporción a cada franja.</li>
      </ul>
    ),
  },
  {
    id: "cancelar",
    titulo: "¿Puedo cancelar?",
    contenido: (
      <p>Sí. Lo que se devuelve depende de con cuánta anticipación canceles y está en la <Link href="/legal/cancelaciones">política de cancelaciones y devoluciones</Link>. Cada reserva conserva la regla que regía al crearla.</p>
    ),
  },
  {
    id: "local",
    titulo: "¿Y si el local no puede cumplir?",
    contenido: <p>Si el local no puede darte la cancha (una emergencia, mantenimiento imprevisto o un error), eliges entre la devolución del 100 %, reprogramar sin costo o un crédito. Si el turno se interrumpe a la mitad, se devuelve la parte no jugada.</p>,
  },
  {
    id: "en-la-cancha",
    titulo: "¿Qué se espera en la cancha?",
    contenido: (
      <ul>
        <li>Llega a tu hora: el turno empieza y termina a la hora reservada.</li>
        <li>Respeta las indicaciones del personal y cuida las instalaciones.</li>
        <li>El material que el local presta (pelota, chalecos) se devuelve al terminar. Si se pierde o se rompe, se cobra el precio por unidad que se muestra antes de reservar, con evidencia y después de que lo aceptes. Nunca se cobra solo a tu tarjeta.</li>
      </ul>
    ),
  },
  {
    id: "responsabilidad",
    titulo: "¿De qué responde cada uno?",
    contenido: <p>El local responde por darte la cancha en buen estado y a la hora reservada. Quien reserva responde por su equipo y por los daños que este cause. Nada de esto limita tus derechos como consumidor (Ley 29571).</p>,
  },
  {
    id: "reclamos",
    titulo: "¿Cómo hago un reclamo?",
    contenido: <p>Puedes registrar un reclamo o una queja en el <Link href="/libro-de-reclamaciones">Libro de Reclamaciones</Link>. Te respondemos en un máximo de 15 días hábiles. Registrar un reclamo no es requisito para acudir a Indecopi.</p>,
  },
  {
    id: "cambios",
    titulo: "¿Pueden cambiar estos términos?",
    contenido: <p>Sí. Publicaremos la nueva versión con su fecha. Los cambios rigen para las reservas nuevas: las que ya hiciste conservan las condiciones con que las hiciste.</p>,
  },
  {
    id: "ley",
    titulo: "¿Qué ley se aplica?",
    contenido: <p>Las leyes del Perú. Cualquier controversia se resuelve ante las autoridades de Trujillo, sin perjuicio de que acudas a Indecopi.</p>,
  },
];
