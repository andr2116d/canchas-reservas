import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { hash } from 'bcryptjs';
import { PrismaClient } from '../src/generated/prisma/client';

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL ?? '' }),
});

type DatosUsuario = {
  nombres: string;
  apellidos: string;
  numeroDocumento: string;
  correo: string;
  telefono: string;
  contrasena: string;
  rol: 'ADMINISTRADOR' | 'RECEPCIONISTA' | 'JUGADOR';
};

async function usuario(datos: DatosUsuario) {
  const { contrasena, ...resto } = datos;
  return prisma.usuario.upsert({
    where: { correo: datos.correo },
    update: {},
    create: { ...resto, tipoDocumento: 'DNI', passwordHash: await hash(contrasena, 10) },
  });
}

async function base() {
  const correo = process.env.ADMIN_CORREO;
  const contrasena = process.env.ADMIN_CONTRASENA;
  if (!correo || !contrasena) {
    throw new Error('Faltan ADMIN_CORREO o ADMIN_CONTRASENA en server/.env');
  }

  const admin = await usuario({
    nombres: 'Administrador',
    apellidos: 'La Previa',
    numeroDocumento: '00000001',
    correo,
    telefono: '900000001',
    contrasena,
    rol: 'ADMINISTRADOR',
  });

  await prisma.configuracion.upsert({ where: { id: 1 }, update: {}, create: { id: 1 } });
  await prisma.reglaCancelacion.upsert({ where: { id: 1 }, update: {}, create: { id: 1 } });

  return admin;
}

async function horario(abierto: boolean) {
  for (let dia = 1; dia <= 7; dia++) {
    await prisma.horarioDia.upsert({
      where: { diaSemana: dia },
      update: {},
      create: abierto
        ? { diaSemana: dia, abierto: true, apertura: '08:00', cierre: '23:00' }
        : { diaSemana: dia, abierto: false },
    });
  }
}

async function demo(adminId: number) {
  await usuario({
    nombres: 'Rosa',
    apellidos: 'Quispe Mendoza',
    numeroDocumento: '00000002',
    correo: 'recepcion@laprevia.pe',
    telefono: '900000002',
    contrasena: 'Recepcion123',
    rol: 'RECEPCIONISTA',
  });
  await usuario({
    nombres: 'Luis',
    apellidos: 'Ramirez Torres',
    numeroDocumento: '70000001',
    correo: 'jugador1@laprevia.pe',
    telefono: '987000001',
    contrasena: 'Jugador123',
    rol: 'JUGADOR',
  });
  await usuario({
    nombres: 'Carla',
    apellidos: 'Vega Salazar',
    numeroDocumento: '70000002',
    correo: 'jugador2@laprevia.pe',
    telefono: '987000002',
    contrasena: 'Jugador123',
    rol: 'JUGADOR',
  });

  const canchas = [
    { nombre: 'Cancha 1', tamano: 'FUTBOL_5', iluminacion: true, dia: 60, noche: 80 },
    { nombre: 'Cancha 2', tamano: 'FUTBOL_5', iluminacion: true, dia: 60, noche: 80 },
    { nombre: 'Cancha 3', tamano: 'FUTBOL_7', iluminacion: true, dia: 90, noche: 120 },
    { nombre: 'Cancha 4', tamano: 'FUTBOL_7', iluminacion: false, dia: 90, noche: 120 },
  ] as const;

  for (const c of canchas) {
    const cancha =
      (await prisma.cancha.findFirst({ where: { nombre: c.nombre } })) ??
      (await prisma.cancha.create({
        data: { nombre: c.nombre, tamano: c.tamano, iluminacion: c.iluminacion },
      }));

    for (const [franja, valor] of [['DIA', c.dia], ['NOCHE', c.noche]] as const) {
      const vigente = await prisma.tarifa.findFirst({
        where: { canchaId: cancha.id, franja, vigenteHasta: null },
      });
      if (!vigente) {
        await prisma.tarifa.create({
          data: { canchaId: cancha.id, franja, valor, creadoPorId: adminId },
        });
      }
    }
  }

  const adicionales = [
    { nombre: 'Balón', precio: 5 },
    { nombre: 'Chalecos', precio: 10 },
    { nombre: 'Agua', precio: 2.5 },
  ];
  for (const a of adicionales) {
    const existe = await prisma.adicional.findFirst({ where: { nombre: a.nombre } });
    if (!existe) await prisma.adicional.create({ data: a });
  }
}

async function main() {
  const modo = process.env.SEED_MODO === 'produccion' ? 'produccion' : 'demo';
  const admin = await base();
  await horario(modo === 'demo');

  if (modo === 'demo') {
    await demo(admin.id);
  }

  console.log(`\nSeed listo (modo ${modo}).`);
  console.log(`  Administrador   ${admin.correo}`);
  if (modo === 'demo') {
    console.log('  Recepcionista   recepcion@laprevia.pe / Recepcion123');
    console.log('  Jugador         jugador1@laprevia.pe / Jugador123');
    console.log('  Jugador         jugador2@laprevia.pe / Jugador123\n');
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
