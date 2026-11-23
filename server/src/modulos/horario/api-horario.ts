export {
  DIAS_DE_LA_SEMANA,
  type DiaDeLaSemana,
  esDiaDeLaSemana,
} from './dominio/dia-de-la-semana';
export {
  HORARIO_REPOSITORY,
  type HorarioRepository,
} from './dominio/horario.repository';
export {
  generarTurnos,
  type Rango,
  type Turno,
} from './dominio/turnos-del-dia';
export {
  construirHorario,
  type DatosDelHorario,
} from './aplicacion/construir-horario';
export type { HorarioSemanal } from './dominio/horario-semanal';
export { HorarioModule } from './horario.module';
