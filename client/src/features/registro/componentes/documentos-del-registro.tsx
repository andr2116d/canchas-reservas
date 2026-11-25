import Link from "next/link";
import type { ReactNode } from "react";

/** Abre el documento completo en otra pestaña para no perder lo escrito en el formulario. */
function EnlaceAlDocumento({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link href={href} target="_blank" rel="noopener noreferrer" className="font-semibold text-botella underline underline-offset-2 focus-visible:outline-2 focus-visible:outline-botella">
      {children}
      <span className="sr-only"> (se abre en otra pestaña)</span>
    </Link>
  );
}

/** Tarjeta de términos y privacidad que se abre junto a la casilla de aceptación. */
export function DocumentosDelRegistro() {
  return (
    <details className="px-3.5">
      <summary className="cursor-pointer py-3 font-semibold text-botella focus-visible:outline-2 focus-visible:outline-botella">
        Leer términos y privacidad
      </summary>
      <div className="mb-3 divide-y divide-linea rounded-lg border border-linea bg-tiza p-4 leading-relaxed text-pretty text-tinta">
        <section className="space-y-2 pb-4">
          <h2 className="font-semibold text-balance">Términos y condiciones</h2>
          <p>Tu cuenta de La Previa identifica a la persona responsable de una reserva de cancha de fútbol 5 o 7.</p>
          <p>El titular de la reserva debe tener 18 años cumplidos. Usa tus propios datos y protege tu contraseña.</p>
          <p>Si haces una reserva, podrás revisar el turno, el precio y las condiciones aplicables antes de pagar.</p>
        </section>
        <section className="space-y-2 pt-4">
          <h2 className="font-semibold text-balance">Política de privacidad</h2>
          <p>Usamos tus nombres, apellidos y documento para identificar al titular y tu fecha de nacimiento para comprobar que eres mayor de edad.</p>
          <p>Tu correo y contraseña te permiten acceder a la cuenta. Pedimos tu celular para contactarte sobre tus reservas. Puedes elegir un dorsal para tu ficha.</p>
          <p>Protegemos tus datos de identificación y contacto con cifrado y guardamos una huella protegida de tu contraseña.</p>
          <p>Puedes ejercer tus derechos de acceso, rectificación, cancelación y oposición.</p>
        </section>
        <p className="flex flex-wrap gap-x-4 gap-y-1 pt-4">
          <EnlaceAlDocumento href="/legal/terminos">Leer los términos completos</EnlaceAlDocumento>
          <EnlaceAlDocumento href="/legal/privacidad">Leer la política de privacidad completa</EnlaceAlDocumento>
        </p>
      </div>
    </details>
  );
}
