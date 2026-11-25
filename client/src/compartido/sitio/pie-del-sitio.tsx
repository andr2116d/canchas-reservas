import Link from "next/link";
import { RUTA_DE_ACCESO } from "@/compartido/sesion/destino-de-sesion";
import { MonogramaLaPrevia } from "@/compartido/ui/monograma-la-previa";
import { BotonDePreferencias } from "./boton-de-preferencias";
import { InsigniaDelLibro } from "./insignia-del-libro";
import { PAGINAS_LEGALES, SECCIONES_DE_LA_PORTADA } from "./rutas-del-sitio";

const CUENTA = [
  { ruta: RUTA_DE_ACCESO, texto: "Ingresar" },
  { ruta: "/registro", texto: "Crear cuenta" },
  { ruta: RUTA_DE_ACCESO, texto: "Acceso del personal" },
];

function Columna({ id, titulo, enlaces, children }: { id: string; titulo: string; enlaces: readonly { ruta: string; texto: string }[]; children?: React.ReactNode }) {
  return (
    <nav aria-labelledby={id}>
      <h2 id={id} className="pie-del-sitio__titulo">{titulo}</h2>
      <ul className="flex flex-col gap-2">
        {enlaces.map((enlace) => (
          <li key={enlace.texto}><Link href={enlace.ruta} className="pie-del-sitio__enlace">{enlace.texto}</Link></li>
        ))}
        {children}
      </ul>
    </nav>
  );
}

/**
 * Pie de las páginas públicas: el club, la cuenta, las páginas legales, el Libro de
 * Reclamaciones y los datos del proveedor, que se configuran en administración.
 */
export function PieDelSitio() {
  return (
    <footer className="pie-del-sitio">
      <div className="pie-del-sitio__columnas envoltura-del-sitio">
        <div className="flex flex-col gap-4">
          <Link href="/" className="flex w-fit items-center gap-2.5" aria-label="La Previa, inicio">
            <MonogramaLaPrevia className="h-10 w-auto" aria-hidden="true" />
            <span className="font-titular text-3xl leading-none font-black text-papel">La Previa</span>
          </Link>
          <p className="max-w-[22rem]">Canchas de fútbol 5 y 7 en Trujillo, La Libertad. Reserva en línea con el precio final a la vista.</p>
          <InsigniaDelLibro />
        </div>
        <Columna id="pie-club" titulo="El club" enlaces={SECCIONES_DE_LA_PORTADA.filter((s) => s.texto !== "Preguntas")} />
        <Columna id="pie-cuenta" titulo="Tu cuenta" enlaces={CUENTA} />
        <Columna id="pie-legal" titulo="Legal" enlaces={PAGINAS_LEGALES}>
          <li><BotonDePreferencias className="pie-del-sitio__enlace text-left" /></li>
        </Columna>
      </div>
      <div className="pie-del-sitio__proveedor envoltura-del-sitio">
        <address className="not-italic">
          La Previa · <span className="dato-por-configurar">Razón social, RUC y dirección: se configuran en administración</span>
        </address>
        <p>© 2026 La Previa. Precios en soles, con IGV incluido.</p>
      </div>
    </footer>
  );
}
