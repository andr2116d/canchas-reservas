import { redactarCorreo, type Seccion } from './redaccion-de-correos';
import type { Constancia } from './registrar-hoja.use-case';
import {
  fechaParaMostrar,
  fechaYHoraDeLima,
  NOMBRE_DEL_MEDIO,
  NOMBRE_DEL_SERVICIO,
  NOMBRE_DEL_TIPO,
} from './textos-de-la-hoja-para-mostrar';

const PENDIENTE = 'por publicar';

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

/** La copia que se envía al registrar la hoja (DS 011-2011-PCM, art. 4), en texto y en HTML. */
export function redactarCopiaDeLaHoja(constancia: Constancia) {
  return redactarCorreo(
    `Hoja de reclamación N.º ${constancia.numero}`,
    'Registramos tu hoja de reclamación.',
    secciones(constancia),
  );
}
