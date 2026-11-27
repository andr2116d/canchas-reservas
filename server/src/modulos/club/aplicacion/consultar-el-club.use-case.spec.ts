import { EnMemoriaAdelantoRepository } from '../../../../test/adelanto/dobles/en-memoria-adelanto.repository';
import { EnMemoriaReglaDeCancelacionRepository } from '../../../../test/cancelacion/dobles/en-memoria-regla-de-cancelacion.repository';
import { CatalogoDePrueba } from '../../../../test/club/dobles/catalogo-de-prueba';
import { EnMemoriaHorarioRepository } from '../../../../test/horario/dobles/en-memoria-horario.repository';
import { EnMemoriaTarifaRepository } from '../../../../test/tarifas/dobles/en-memoria-tarifa.repository';
import { PorcentajeDeAdelanto } from '../../adelanto/api-adelanto';
import { ReglaDeCancelacion } from '../../cancelacion/api-cancelacion';
import { construirHorario } from '../../horario/api-horario';
import { construirTarifa } from '../../tarifas/api-tarifas';
import { ConsultarElClubUseCase } from './consultar-el-club.use-case';

const GUARDADA = { guardadaEn: new Date(0), guardadaPor: 'Valeria León' };
const GUARDADO = { guardadoEn: new Date(0), guardadoPor: 'Valeria León' };

function preparar() {
  const tarifas = new EnMemoriaTarifaRepository();
  const horarios = new EnMemoriaHorarioRepository();
  const adelantos = new EnMemoriaAdelantoRepository();
  const reglas = new EnMemoriaReglaDeCancelacionRepository();
  const catalogo = new CatalogoDePrueba();
  const consultar = new ConsultarElClubUseCase({
    tarifas,
    horarios,
    adelantos,
    reglas,
    catalogo,
  });
  return { consultar, tarifas, horarios, adelantos, reglas, catalogo };
}

describe('Consultar lo que se muestra del club', () => {
  it('sin nada guardado no inventa precios, horario, adelanto ni regla', async () => {
    const { consultar } = preparar();

    await expect(consultar.ejecutar()).resolves.toEqual({
      canchas: [],
      tarifas: [],
      horario: null,
      adelanto: null,
      cancelacion: null,
      adicionales: [],
    });
  });

  it('muestra las canchas operativas y los adicionales activos tal como los da el catálogo', async () => {
    const { consultar, catalogo } = preparar();
    catalogo.canchas.push({
      id: 1,
      nombre: 'Cancha 1',
      tipo: 'FUTBOL_5',
      tieneIluminacion: true,
      caracteristicas: ['BANCAS'],
      nota: null,
    });
    catalogo.adicionales.push({
      nombre: 'Balón',
      descripcion: null,
      precio: '45.00',
    });

    const club = await consultar.ejecutar();

    expect(club.canchas[0].nombre).toBe('Cancha 1');
    expect(club.adicionales).toEqual([
      { nombre: 'Balón', descripcion: null, precio: '45.00' },
    ]);
  });

  it('da la tarifa vigente de cada tipo que la tiene', async () => {
    const { consultar, tarifas } = preparar();
    tarifas.versiones.push({
      ...GUARDADA,
      tarifa: construirTarifa('FUTBOL_7', {
        precioDia: '120',
        precioNoche: '150',
        duracionDelTurno: '2',
        ofreceTurnoCorto: false,
      }),
    });

    const { tarifas: vigentes } = await consultar.ejecutar();

    expect(vigentes).toEqual([
      {
        tipo: 'FUTBOL_7',
        precioDia: '120.00',
        precioNoche: '150.00',
        duracionDelTurnoHoras: 2,
      },
    ]);
  });

  it('da el horario de los días que abre, con su hora de noche', async () => {
    const { consultar, horarios } = preparar();
    horarios.versiones.push({
      ...GUARDADO,
      horario: construirHorario({
        inicioDeLaNoche: '18:00',
        dias: [
          { dia: 'LUNES', abierto: true, abre: '08:00', cierra: '23:00' },
          {
            dia: 'SABADO',
            abierto: true,
            abre: '07:00',
            cierra: '24:00',
            inicioDeLaNoche: '17:30',
          },
          ...['MARTES', 'MIERCOLES', 'JUEVES', 'VIERNES', 'DOMINGO'].map(
            (dia) => ({ dia, abierto: false }),
          ),
        ],
      }),
    });

    const { horario } = await consultar.ejecutar();

    expect(horario).toEqual({
      dias: [
        {
          dia: 'LUNES',
          abre: '08:00',
          cierra: '23:00',
          inicioDeLaNoche: '18:00',
        },
        {
          dia: 'SABADO',
          abre: '07:00',
          cierra: '24:00',
          inicioDeLaNoche: '17:30',
        },
      ],
    });
  });

  it('da el adelanto y la regla de cancelación vigentes', async () => {
    const { consultar, adelantos, reglas } = preparar();
    adelantos.versiones.push({
      ...GUARDADO,
      porcentaje: PorcentajeDeAdelanto.crear('50'),
    });
    reglas.versiones.push({
      ...GUARDADA,
      id: 1,
      regla: ReglaDeCancelacion.crear([
        { desdeHoras: '24', porcentaje: '100', ofreceCredito: true },
        { desdeHoras: '0', porcentaje: '0', ofreceCredito: false },
      ]),
    });

    const club = await consultar.ejecutar();

    expect(club.adelanto).toBe(50);
    expect(club.cancelacion).toEqual([
      { desdeHoras: 24, porcentaje: 100, ofreceCredito: true },
      { desdeHoras: 0, porcentaje: 0, ofreceCredito: false },
    ]);
  });
});
