"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent, useTransition } from "react";
import { ESTADOS_DEL_FILTRO, type EstadoDelFiltro, NOMBRE_DEL_FILTRO, NOMBRE_DEL_MOTIVO } from "../servicios/reclamos";
import { aDireccion, type FiltrosDeReclamos, ORDENES, PERIODOS } from "../utilidades/filtros";

const SELECTOR = "min-w-0 rounded-xl border border-linea bg-papel px-3 py-2 text-sm font-semibold text-tinta focus-visible:outline-2 focus-visible:outline-botella";

function Estados({ filtros, conteos }: { filtros: FiltrosDeReclamos; conteos: Record<EstadoDelFiltro, number> }) {
  return (
    <nav aria-label="Estado" className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1">
      {ESTADOS_DEL_FILTRO.map((estado) => {
        const actual = filtros.estado === estado;
        const alerta = estado === "VENCIDAS" && conteos.VENCIDAS > 0;
        return (
          <Link
            key={estado}
            href={aDireccion({ ...filtros, estado, pagina: 1 })}
            aria-current={actual ? "page" : undefined}
            className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm font-semibold ${actual ? "border-cancha bg-cancha text-papel" : "border-linea bg-papel text-tinta"}`}
          >
            {NOMBRE_DEL_FILTRO[estado]}
            <b className={`tabular-nums ${actual ? "text-capitan" : alerta ? "text-error" : "text-grava"}`}>{conteos[estado]}</b>
          </Link>
        );
      })}
    </nav>
  );
}

/** Estados con su conteo y, en una sola fila, tipo, motivo, período, orden y búsqueda por número. */
export function FiltrosDeReclamos({ filtros, conteos }: { filtros: FiltrosDeReclamos; conteos: Record<EstadoDelFiltro, number> }) {
  const router = useRouter();
  const [, iniciar] = useTransition();
  const ir = (cambios: Partial<FiltrosDeReclamos>) => iniciar(() => router.push(aDireccion({ ...filtros, ...cambios, pagina: 1 }), { scroll: false }));
  const elegir = (clave: keyof FiltrosDeReclamos) => (evento: React.ChangeEvent<HTMLSelectElement>) => ir({ [clave]: evento.target.value || undefined });
  function buscar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    const numero = new FormData(evento.currentTarget).get("numero")?.toString().trim();
    ir({ numero: numero || undefined, estado: numero ? "TODAS" : filtros.estado });
  }

  return (
    <div className="vidrio-claro flex flex-col gap-3 rounded-2xl p-4">
      <Estados filtros={filtros} conteos={conteos} />
      <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center">
        <select aria-label="Tipo" value={filtros.tipo ?? ""} onChange={elegir("tipo")} className={SELECTOR}>
          <option value="">Reclamos y quejas</option>
          <option value="RECLAMO">Solo reclamos</option>
          <option value="QUEJA">Solo quejas</option>
        </select>
        <select aria-label="Motivo" value={filtros.motivo ?? ""} onChange={elegir("motivo")} className={SELECTOR}>
          <option value="">Todos los motivos</option>
          <option value="SIN_MOTIVO">Sin clasificar</option>
          {Object.entries(NOMBRE_DEL_MOTIVO).map(([valor, texto]) => <option key={valor} value={valor}>{texto}</option>)}
        </select>
        <select aria-label="Período" value={filtros.periodo} onChange={elegir("periodo")} className={SELECTOR}>
          {PERIODOS.map(([valor, texto]) => <option key={valor} value={valor}>{texto}</option>)}
        </select>
        <select aria-label="Orden" value={filtros.orden} onChange={elegir("orden")} className={SELECTOR}>
          {Object.entries(ORDENES).map(([valor, texto]) => <option key={valor} value={valor}>{texto}</option>)}
        </select>
        <form role="search" onSubmit={buscar} className="col-span-2 flex items-center gap-1.5 sm:ml-auto">
          <input name="numero" defaultValue={filtros.numero ?? ""} aria-label="Número de hoja" placeholder="000014-2026" inputMode="numeric" className={`${SELECTOR} w-full font-normal sm:w-36`} />
          <button type="submit" className={SELECTOR}>Buscar</button>
        </form>
      </div>
    </div>
  );
}
