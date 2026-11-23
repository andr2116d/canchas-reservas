/** Secciones del aviso, en el orden en que se leen. */
const SECCIONES = [
  {
    titulo: "Qué datos usamos",
    texto:
      "Tus nombres y apellidos, tu documento de identidad, tu fecha de nacimiento, tu celular, tu correo institucional y una huella protegida de tu contraseña. También registramos cuándo entras al sistema y las acciones que el administrador hace sobre tu cuenta.",
  },
  {
    titulo: "Para qué los usamos",
    texto:
      "Para identificarte, darte acceso a tu cuenta, comprobar que eres mayor de edad, comunicarnos contigo por tu trabajo y llevar el registro de las operaciones de caja y reservas, que sirve para auditorías.",
  },
  {
    titulo: "Por qué no te pedimos consentimiento",
    texto:
      "Estos datos son necesarios para tu relación de trabajo con La Previa. La Ley 29733 de Protección de Datos Personales, en su artículo 14, numeral 5, permite tratarlos sin consentimiento en ese caso, y su artículo 18 nos obliga a informarte cómo lo hacemos, que es lo que hace este aviso. Si algún día te pedimos un dato que no sea necesario para tu trabajo, te pediremos tu consentimiento.",
  },
  {
    titulo: "Cómo los protegemos",
    texto:
      "Tus datos de identificación y contacto se guardan cifrados y tu contraseña nunca se guarda tal cual. Solo el administrador puede ver y gestionar las cuentas del personal.",
  },
  {
    titulo: "Cuánto tiempo los guardamos",
    texto:
      "Mientras trabajes con nosotros. Si tu cuenta se desactiva, conservamos tus datos y su historial para las auditorías y por si vuelves. Los plazos exactos se precisarán en la versión para publicación.",
  },
  {
    titulo: "Tus derechos",
    texto:
      "Puedes pedir acceder a tus datos, corregirlos, cancelarlos u oponerte a su uso cuando la ley lo permita. Por ahora, pídelo al administrador. Los datos del responsable, el canal formal de atención y la inscripción del banco de datos de trabajadores ante la Autoridad Nacional de Protección de Datos Personales se precisarán en la versión para publicación.",
  },
];

/**
 * Aviso de privacidad para quienes trabajan en La Previa: qué datos se tratan,
 * para qué, con qué base legal, cómo se protegen, cuánto se guardan y cómo
 * ejercer sus derechos (Ley 29733 y su reglamento, DS 016-2024-JUS).
 */
export function AvisoDePrivacidadDelPersonal() {
  return (
    <article className="flex max-w-2xl flex-col gap-7 leading-relaxed text-pretty text-tinta">
      {SECCIONES.map(({ titulo, texto }) => (
        <section key={titulo} className="flex flex-col gap-2">
          <h2 className="font-titular text-2xl font-black text-tinta">{titulo}</h2>
          <p>{texto}</p>
        </section>
      ))}
    </article>
  );
}
