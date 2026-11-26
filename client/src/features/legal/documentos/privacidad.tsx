import Link from "next/link";
import type { ApartadoLegal } from "../componentes/documento-legal";
import { DatoPendiente } from "../componentes/dato-pendiente";

export const VIGENCIA_DE_LA_PRIVACIDAD = "24 de noviembre de 2026";

/** Política de privacidad de los jugadores (Ley 29733 y su reglamento, DS 016-2024-JUS). */
export const APARTADOS_DE_LA_PRIVACIDAD: ApartadoLegal[] = [
  {
    id: "responsable",
    titulo: "¿Quién cuida tus datos?",
    contenido: <p>La Previa es responsable de tus datos personales. Razón social, RUC, dirección y correo de atención: <DatoPendiente />.</p>,
  },
  {
    id: "datos",
    titulo: "¿Qué datos pedimos y por qué?",
    contenido: (
      <div className="documento-legal__desliza">
        <table>
          <thead><tr><th scope="col">Dato</th><th scope="col">Para qué</th></tr></thead>
          <tbody>
            <tr><td>Nombres y apellidos</td><td>Saber quién es el titular de la reserva.</td></tr>
            <tr><td>Tipo y número de documento</td><td>Identificar al titular y emitir el comprobante.</td></tr>
            <tr><td>Fecha de nacimiento</td><td>Comprobar que el titular tiene 18 años cumplidos.</td></tr>
            <tr><td>Correo y contraseña</td><td>Entrar a tu cuenta. De la contraseña solo guardamos una huella protegida.</td></tr>
            <tr><td>Celular</td><td>Contactarte sobre tus reservas.</td></tr>
            <tr><td>Dorsal (opcional)</td><td>Personalizar tu ficha.</td></tr>
          </tbody>
        </table>
      </div>
    ),
  },
  {
    id: "base",
    titulo: "¿Con qué derecho los usamos?",
    contenido: <p>Con tu consentimiento, que das al crear tu cuenta, y porque los necesitamos para darte el servicio que reservas. No los usamos para publicidad sin que lo aceptes aparte.</p>,
  },
  {
    id: "compartir",
    titulo: "¿Con quién los compartimos?",
    contenido: (
      <>
        <p>Solo con quienes nos ayudan a darte el servicio, como la pasarela de pagos y el proveedor de servidores, y con las autoridades que la ley indique. No vendemos tus datos.</p>
        <p>Quiénes son y en qué país guardan los datos: <DatoPendiente texto="se precisa antes de publicar la web" />.</p>
      </>
    ),
  },
  {
    id: "proteccion",
    titulo: "¿Cómo los protegemos?",
    contenido: <p>Tus datos de identificación y contacto se guardan cifrados, la web funciona con conexión segura y solo el personal que lo necesita puede verlos.</p>,
  },
  {
    id: "conservacion",
    titulo: "¿Cuánto tiempo los guardamos?",
    contenido: <p>Mientras tengas tu cuenta. Si la eliminas, conservamos solo las reservas y comprobantes que la ley nos obliga a guardar, por el plazo que indica.</p>,
  },
  {
    id: "derechos",
    titulo: "¿Qué derechos tienes?",
    contenido: (
      <>
        <p>Puedes pedir acceder a tus datos, corregirlos, eliminarlos u oponerte a su uso (derechos ARCO). Escríbenos al correo de atención (<DatoPendiente />) y te respondemos en los plazos de la ley. Si no estás conforme, puedes acudir a la Autoridad Nacional de Protección de Datos Personales.</p>
        <p>Inscripción del banco de datos de clientes ante la autoridad: <DatoPendiente texto="se precisa antes de publicar la web" />.</p>
      </>
    ),
  },
  {
    id: "menores",
    titulo: "¿Y los menores de edad?",
    contenido: <p>No pedimos datos de menores: la cuenta es solo para mayores de 18 años.</p>,
  },
  {
    id: "cookies",
    titulo: "¿Usan cookies?",
    contenido: <p>Solo las necesarias para que la web funcione. Lo explicamos en la <Link href="/legal/cookies">política de cookies</Link>.</p>,
  },
];
