/** Lee los correos que recibió Mailpit, el servidor de correo de prueba de Docker. */
const API_DE_MAILPIT = `http://localhost:${process.env.CORREO_WEB_PUERTO ?? '8025'}/api/v1`;

export interface CorreoRecibido {
  de: string;
  para: string[];
  asunto: string;
  texto: string;
  html: string;
}

interface Resumen {
  ID: string;
}

interface Mensaje {
  From: { Address: string; Name: string };
  To: { Address: string }[];
  Subject: string;
  Text: string;
  HTML: string;
}

async function leerJson<T>(ruta: string): Promise<T> {
  const respuesta = await fetch(`${API_DE_MAILPIT}${ruta}`);
  if (!respuesta.ok) throw new Error(`Mailpit respondió ${respuesta.status}.`);
  return (await respuesta.json()) as T;
}

/** Los correos que llegaron a una dirección, del más reciente al más antiguo. */
export async function correosRecibidosPor(
  direccion: string,
): Promise<CorreoRecibido[]> {
  const busqueda = encodeURIComponent(`to:"${direccion}"`);
  const { messages } = await leerJson<{ messages: Resumen[] }>(
    `/search?query=${busqueda}`,
  );
  return Promise.all(
    messages.map(async ({ ID }) => {
      const m = await leerJson<Mensaje>(`/message/${ID}`);
      return {
        de: `${m.From.Name} <${m.From.Address}>`,
        para: m.To.map((t) => t.Address),
        asunto: m.Subject,
        texto: m.Text.trim(),
        html: m.HTML,
      };
    }),
  );
}
