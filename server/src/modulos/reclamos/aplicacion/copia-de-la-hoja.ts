import type { Constancia } from './registrar-hoja.use-case';
import {
  fechaParaMostrar,
  fechaYHoraDeLima,
  NOMBRE_DEL_MEDIO,
  NOMBRE_DEL_SERVICIO,
  NOMBRE_DEL_TIPO,
} from './textos-de-la-hoja-para-mostrar';

const PENDIENTE = 'por publicar';
const AVISO_LEGAL =
  'La formulación del reclamo no impide acudir a otras vías de solución de controversias ni es ' +
  'requisito previo para interponer una denuncia ante el Indecopi.';

/** Secciones de la copia: un título y sus líneas, que se escriben igual en texto y en HTML. */
type Seccion = [titulo: string, lineas: string[]];
type Hoja = Constancia['hoja'];

function seccionDeLaHoja({
  numero,
  codigo,
  registradaEn,
  fechaLimite,
  hoja,
}: Constancia): Seccion {
  const { fecha, hora } = fechaYHoraDeLima(registradaEn);
  const medio = NOMBRE_DEL_MEDIO[hoja.medioDeRespuesta];
  return [
    'Tu hoja',
    [
      `Hoja N.º ${numero}`,
      `Código de seguimiento: ${codigo}`,
      `Registrada el ${fecha} a las ${hora}`,
      `Te responderemos a más tardar el ${fechaParaMostrar(fechaLimite)}, ${medio}.`,
    ],
  ];
}

function seccionDelProveedor({ proveedor }: Constancia): Seccion {
  return [
    'Proveedor',
    [
      `Razón social: ${proveedor.razonSocial ?? PENDIENTE}`,
      `RUC: ${proveedor.ruc ?? PENDIENTE}`,
      `Dirección: ${proveedor.direccion ?? PENDIENTE}`,
    ],
  ];
}

function seccionDelConsumidor({
  consumidor: c,
  representante: r,
}: Hoja): Seccion {
  const documento = c.documento.tipo === 'DNI' ? 'DNI' : 'Carné de extranjería';
  return [
    '1. Consumidor',
    [
      `${c.nombres} ${c.apellidos} · ${documento} ${c.documento.numero}`,
      `Domicilio: ${c.domicilio}`,
      `Teléfono: ${c.telefono} · Correo: ${c.correo}`,
      ...(r
        ? [
            `Menor de edad, representado por ${r.nombre} (${r.telefono}, ${r.correo}, ${r.domicilio})`,
          ]
        : []),
    ],
  ];
}

function seccionDelServicio({ servicio: s }: Hoja): Seccion {
  return [
    '2. Servicio contratado',
    [
      NOMBRE_DEL_SERVICIO[s.servicio],
      ...(s.montoReclamado ? [`Monto reclamado: S/ ${s.montoReclamado}`] : []),
      ...(s.descripcion ? [s.descripcion] : []),
    ],
  ];
}

function secciones(constancia: Constancia): Seccion[] {
  const { hoja } = constancia;
  return [
    seccionDeLaHoja(constancia),
    seccionDelProveedor(constancia),
    seccionDelConsumidor(hoja),
    seccionDelServicio(hoja),
    [
      `3. ${NOMBRE_DEL_TIPO[hoja.tipo]}`,
      [`Detalle: ${hoja.detalle}`, `Pedido: ${hoja.pedido}`],
    ],
  ];
}

function escaparHtml(texto: string): string {
  return texto
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function comoTexto(partes: Seccion[]): string {
  const cuerpo = partes.map(([titulo, lineas]) =>
    [titulo, ...lineas].join('\n'),
  );
  return ['Registramos tu hoja de reclamación.', ...cuerpo, AVISO_LEGAL].join(
    '\n\n',
  );
}

function comoHtml(partes: Seccion[]): string {
  const cuerpo = partes
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
    '<p>Registramos tu hoja de reclamación.</p>' +
    cuerpo +
    `<p style="margin-top:20px;color:#56655d;font-size:13px">${escaparHtml(AVISO_LEGAL)}</p></div>`
  );
}

/** La copia que se envía al registrar la hoja (DS 011-2011-PCM, art. 4), en texto y en HTML. */
export function redactarCopiaDeLaHoja(constancia: Constancia) {
  const partes = secciones(constancia);
  return {
    asunto: `Hoja de reclamación N.º ${constancia.numero}`,
    texto: comoTexto(partes),
    html: comoHtml(partes),
  };
}
