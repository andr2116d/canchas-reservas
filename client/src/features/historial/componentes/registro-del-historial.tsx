import { type Registro, TEXTO_DE_CATEGORIA } from "../servicios/historial";
import { fraseDelRegistro } from "../utilidades/frase-del-registro";

const HORA_EN_LIMA = new Intl.DateTimeFormat("es-PE", { timeZone: "America/Lima", hour: "2-digit", minute: "2-digit", hourCycle: "h23" });

const iniciales = (nombre: string) =>
  nombre
    .split(/\s+/)
    .slice(0, 2)
    .map((parte) => parte.charAt(0))
    .join("");

/** El antes y el después de cada dato que cambió; en un alta solo hay «después». */
function DetalleDelRegistro({ detalle }: Pick<Registro, "detalle">) {
  return (
    <details className="detalle-del-registro">
      <summary>Ver qué cambió</summary>
      <table>
        <thead className="sr-only">
          <tr><th scope="col">Dato</th><th scope="col">Antes</th><th scope="col">Después</th></tr>
        </thead>
        <tbody>
          {detalle.map((linea) => (
            <tr key={linea.campo}>
              <th scope="row">{linea.campo}</th>
              <td className="detalle-del-registro__antes">{linea.antes}</td>
              <td className="detalle-del-registro__despues" data-con-antes={linea.antes !== null || undefined}>{linea.despues ?? "Sin valor"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </details>
  );
}

/** Una línea del historial: hora, quién, qué hizo, sobre qué, su categoría y si es importante. */
export function RegistroDelHistorial({ registro }: { registro: Registro }) {
  const { verbo, sujeto } = fraseDelRegistro(registro);
  return (
    <li className="registro-del-historial" data-importante={registro.importante || undefined}>
      <time dateTime={registro.ocurridoEn} className="registro-del-historial__hora">{HORA_EN_LIMA.format(new Date(registro.ocurridoEn))}</time>
      <span aria-hidden="true" data-iniciales={iniciales(registro.autor.nombre)} className="registro-del-historial__autor" />
      <div className="min-w-0 flex-1">
        <p className="flex flex-wrap items-center gap-x-1.5 gap-y-1 pt-1 text-sm text-tinta">
          <span className="mr-1">
            <b>{registro.autor.nombre}</b> {verbo}
            {sujeto && <> <b>{sujeto}</b></>}
          </span>
          <span className="chip-del-historial" data-categoria={registro.categoria}>{TEXTO_DE_CATEGORIA[registro.categoria]}</span>
          {registro.importante && <span className="chip-del-historial chip-del-historial--importante">Importante</span>}
        </p>
        {registro.detalle.length > 0 && <DetalleDelRegistro detalle={registro.detalle} />}
      </div>
    </li>
  );
}
