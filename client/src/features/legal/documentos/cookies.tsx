import type { ApartadoLegal } from "../componentes/documento-legal";

export const VIGENCIA_DE_LAS_COOKIES = "24 de noviembre de 2026";

/** Política de cookies: hoy solo hay cookies necesarias (marco legal §3.3). */
export const APARTADOS_DE_LAS_COOKIES: ApartadoLegal[] = [
  {
    id: "que-son",
    titulo: "¿Qué son las cookies?",
    contenido: <p>Pequeños archivos que la web guarda en tu navegador para recordar algo entre una página y otra, como que ya iniciaste sesión.</p>,
  },
  {
    id: "cuales",
    titulo: "¿Qué cookies usamos?",
    contenido: (
      <div className="documento-legal__desliza">
        <table>
          <thead><tr><th scope="col">Cookie</th><th scope="col">Tipo</th><th scope="col">Para qué</th><th scope="col">Cuánto dura</th></tr></thead>
          <tbody>
            <tr><td><code>sesion</code></td><td>Necesaria</td><td>Mantener tu sesión iniciada de forma segura. No se puede leer desde la página.</td><td>Hasta 8 horas; se cierra tras 15 minutos sin actividad o al salir.</td></tr>
            <tr><td><code>preferencia_de_cookies</code></td><td>Necesaria</td><td>Recordar lo que elegiste en el aviso de cookies.</td><td>180 días.</td></tr>
          </tbody>
        </table>
      </div>
    ),
  },
  {
    id: "medicion",
    titulo: "¿Usan cookies de medición o publicidad?",
    contenido: <p>No. Si algún día las usamos, solo se activarán si las aceptas en el aviso, y lo diremos aquí.</p>,
  },
  {
    id: "terceros",
    titulo: "¿Hay cookies de otras empresas?",
    contenido: <p>No. Todo lo que carga la web se sirve desde La Previa.</p>,
  },
  {
    id: "cambiar",
    titulo: "¿Cómo cambio mi elección?",
    contenido: <p>Con «Preferencias de cookies», al pie de cualquier página. También puedes borrar las cookies desde tu navegador; si borras la de sesión, tendrás que volver a ingresar.</p>,
  },
];
