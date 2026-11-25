/** Un título y sus líneas: se escriben igual en el texto y en el HTML del correo. */
export type Seccion = [titulo: string, lineas: string[]];

export const AVISO_LEGAL =
  'La formulación del reclamo no impide acudir a otras vías de solución de controversias ni es ' +
  'requisito previo para interponer una denuncia ante el Indecopi.';

function escaparHtml(texto: string): string {
  return texto
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function comoTexto(intro: string, secciones: Seccion[]): string {
  const cuerpo = secciones.map(([titulo, lineas]) =>
    [titulo, ...lineas].join('\n'),
  );
  return [intro, ...cuerpo, AVISO_LEGAL].join('\n\n');
}

function comoHtml(intro: string, secciones: Seccion[]): string {
  const cuerpo = secciones
    .map(
      ([titulo, lineas]) =>
        `<h2 style="font-size:16px;margin:20px 0 6px">${escaparHtml(titulo)}</h2>` +
        lineas
          .map((l) => `<p style="margin:0 0 4px">${escaparHtml(l)}</p>`)
          .join(''),
    )
    .join('');
  return (
    '<div style="font-family:Arial,sans-serif;color:#13261e;line-height:1.5">' +
    `<p>${escaparHtml(intro)}</p>${cuerpo}` +
    `<p style="margin-top:20px;color:#56655d;font-size:13px">${escaparHtml(AVISO_LEGAL)}</p></div>`
  );
}

/** Arma un correo del libro con su asunto, en texto y en HTML; lo escrito por la persona se escapa. */
export function redactarCorreo(
  asunto: string,
  intro: string,
  secciones: Seccion[],
) {
  return {
    asunto,
    texto: comoTexto(intro, secciones),
    html: comoHtml(intro, secciones),
  };
}
