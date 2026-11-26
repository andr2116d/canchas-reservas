-- CreateEnum
CREATE TYPE "estado_de_cancha" AS ENUM ('operativa', 'desactivada');

-- CreateEnum
CREATE TYPE "caracteristica_de_cancha" AS ENUM ('techada', 'bancas', 'junto_a_la_pared', 'graderias', 'malla_alta', 'vestuario_cerca');

-- CreateEnum
CREATE TYPE "accion_sobre_cancha" AS ENUM ('alta', 'edicion', 'desactivacion', 'reactivacion', 'eliminacion');

-- CreateTable
CREATE TABLE "cancha" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "nombre_normalizado" TEXT NOT NULL,
    "tipo" "tipo_de_cancha" NOT NULL,
    "tiene_iluminacion" BOOLEAN NOT NULL,
    "caracteristicas" "caracteristica_de_cancha"[],
    "nota" TEXT,
    "estado" "estado_de_cancha" NOT NULL DEFAULT 'operativa',
    "creado_en" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_en" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "cancha_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cambio_de_cancha" (
    "id" SERIAL NOT NULL,
    "cancha_id" INTEGER,
    "nombre_de_la_cancha" TEXT NOT NULL,
    "accion" "accion_sobre_cancha" NOT NULL,
    "detalle" JSONB,
    "ejecutado_por_id" INTEGER NOT NULL,
    "ocurrido_en" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cambio_de_cancha_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "cancha_nombre_normalizado_key" ON "cancha"("nombre_normalizado");

-- CreateIndex
CREATE INDEX "cambio_de_cancha_ocurrido_en_idx" ON "cambio_de_cancha"("ocurrido_en");

-- CreateIndex
CREATE INDEX "cambio_de_cancha_cancha_id_idx" ON "cambio_de_cancha"("cancha_id");

-- AddForeignKey
ALTER TABLE "cambio_de_cancha" ADD CONSTRAINT "cambio_de_cancha_cancha_id_fkey" FOREIGN KEY ("cancha_id") REFERENCES "cancha"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cambio_de_cancha" ADD CONSTRAINT "cambio_de_cancha_ejecutado_por_id_fkey" FOREIGN KEY ("ejecutado_por_id") REFERENCES "usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;


-- Nombre de 1 a 40 caracteres y nota de hasta 200, como valida el dominio.
ALTER TABLE "cancha" ADD CONSTRAINT "cancha_nombre_check" CHECK (char_length("nombre") BETWEEN 1 AND 40);
ALTER TABLE "cancha" ADD CONSTRAINT "cancha_nota_check" CHECK (char_length("nota") <= 200);
