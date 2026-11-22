import { VERSION_LEGAL_DEL_REGISTRO } from "../servicios/version-legal-del-registro";

const ESTILO_DOCUMENTO = "rounded-lg border border-linea bg-papel px-3.5 text-sm";
const ESTILO_TITULO = "cursor-pointer py-2.5 font-semibold text-botella focus-visible:outline-2 focus-visible:outline-botella";

/** Términos de la cuenta y aviso de privacidad disponibles dentro del formulario. */
export function DocumentosDelRegistro() {
  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm text-grava">Revisa las condiciones de la cuenta y cómo usamos tus datos.</p>
      <details className={ESTILO_DOCUMENTO}>
        <summary className={ESTILO_TITULO}>Términos y condiciones</summary>
        <div className="space-y-2 pb-3 text-tinta">
          <p>Tu cuenta de La Previa identifica a la persona responsable de una reserva de cancha de fútbol 5 o 7.</p>
          <p>El titular de la reserva debe tener 18 años cumplidos. Usa tus propios datos y protege tu contraseña.</p>
          <p>Si haces una reserva, podrás revisar el turno, el precio y las condiciones aplicables antes de pagar.</p>
        </div>
      </details>
      <details className={ESTILO_DOCUMENTO}>
        <summary className={ESTILO_TITULO}>Política de privacidad</summary>
        <div className="space-y-2 pb-3 text-tinta">
          <p>Usamos tus nombres, apellidos y documento para identificar al titular y tu fecha de nacimiento para comprobar que eres mayor de edad.</p>
          <p>Tu correo y contraseña te permiten acceder a la cuenta. Pedimos tu celular para contactarte sobre tus reservas. Puedes elegir un dorsal para tu ficha.</p>
          <p>Protegemos tus datos de identificación y contacto con cifrado y guardamos una huella protegida de tu contraseña.</p>
          <p>Puedes ejercer tus derechos de acceso, rectificación, cancelación y oposición. Los datos del responsable, el canal de atención, los destinatarios y los plazos de conservación se precisarán en la versión para publicación.</p>
        </div>
      </details>
      <p className="text-xs text-grava">Borrador para pruebas · {VERSION_LEGAL_DEL_REGISTRO}</p>
    </div>
  );
}
