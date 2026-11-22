import { VERSION_LEGAL_DEL_REGISTRO } from "../servicios/version-legal-del-registro";

/** Tarjeta de términos y privacidad que se abre junto a la casilla de aceptación. */
export function DocumentosDelRegistro() {
  return (
    <details className="px-3.5">
      <summary className="cursor-pointer py-3 font-semibold text-botella focus-visible:outline-2 focus-visible:outline-botella">
        Leer términos y privacidad
      </summary>
      <div className="mb-3 space-y-4 rounded-lg border border-linea bg-tiza p-4 text-tinta">
        <section className="space-y-2">
          <h2 className="font-semibold">Términos y condiciones</h2>
          <p>Tu cuenta de La Previa identifica a la persona responsable de una reserva de cancha de fútbol 5 o 7.</p>
          <p>El titular de la reserva debe tener 18 años cumplidos. Usa tus propios datos y protege tu contraseña.</p>
          <p>Si haces una reserva, podrás revisar el turno, el precio y las condiciones aplicables antes de pagar.</p>
        </section>
        <section className="space-y-2">
          <h2 className="font-semibold">Política de privacidad</h2>
          <p>Usamos tus nombres, apellidos y documento para identificar al titular y tu fecha de nacimiento para comprobar que eres mayor de edad.</p>
          <p>Tu correo y contraseña te permiten acceder a la cuenta. Pedimos tu celular para contactarte sobre tus reservas. Puedes elegir un dorsal para tu ficha.</p>
          <p>Protegemos tus datos de identificación y contacto con cifrado y guardamos una huella protegida de tu contraseña.</p>
          <p>Puedes ejercer tus derechos de acceso, rectificación, cancelación y oposición. Los datos del responsable, el canal de atención, los destinatarios y los plazos de conservación se precisarán en la versión para publicación.</p>
        </section>
        <p className="text-xs text-grava">Versión {VERSION_LEGAL_DEL_REGISTRO}</p>
      </div>
    </details>
  );
}
