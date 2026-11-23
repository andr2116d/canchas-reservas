import { consultarHorario } from "@/compartido/horario/horario.servidor";
import { FormularioDeHorario } from "./formulario-de-horario";

/** Horario de atención guardado, listo para editar. */
export async function HorarioDelLocal() {
  return <FormularioDeHorario consultado={await consultarHorario()} />;
}
