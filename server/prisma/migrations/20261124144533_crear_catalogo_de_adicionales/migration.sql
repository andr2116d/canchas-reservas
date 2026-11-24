-- CreateEnum
CREATE TYPE "estado_de_adicional" AS ENUM ('activo', 'desactivado');

-- CreateEnum
CREATE TYPE "accion_sobre_adicional" AS ENUM ('alta', 'edicion', 'desactivacion', 'reactivacion', 'eliminacion');

-- CreateTable
CREATE TABLE "adicional" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "nombre_normalizado" TEXT NOT NULL,
    "descripcion" TEXT,
    "precio" DECIMAL(10,2) NOT NULL,
    "estado" "estado_de_adicional" NOT NULL DEFAULT 'activo',
    "creado_en" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_en" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "adicional_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cambio_de_adicional" (
    "id" SERIAL NOT NULL,
    "adicional_id" INTEGER,
    "nombre_del_adicional" TEXT NOT NULL,
    "accion" "accion_sobre_adicional" NOT NULL,
    "detalle" JSONB,
    "ejecutado_por_id" INTEGER NOT NULL,
    "ocurrido_en" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cambio_de_adicional_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "adicional_nombre_normalizado_key" ON "adicional"("nombre_normalizado");

-- CreateIndex
CREATE INDEX "cambio_de_adicional_ocurrido_en_idx" ON "cambio_de_adicional"("ocurrido_en");

-- CreateIndex
CREATE INDEX "cambio_de_adicional_adicional_id_idx" ON "cambio_de_adicional"("adicional_id");

-- AddForeignKey
ALTER TABLE "cambio_de_adicional" ADD CONSTRAINT "cambio_de_adicional_adicional_id_fkey" FOREIGN KEY ("adicional_id") REFERENCES "adicional"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cambio_de_adicional" ADD CONSTRAINT "cambio_de_adicional_ejecutado_por_id_fkey" FOREIGN KEY ("ejecutado_por_id") REFERENCES "usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Nombre de 1 a 40 caracteres, descripción de hasta 200 y precio mayor que cero, como valida el dominio.
ALTER TABLE "adicional" ADD CONSTRAINT "adicional_nombre_check" CHECK (char_length("nombre") BETWEEN 1 AND 40);
ALTER TABLE "adicional" ADD CONSTRAINT "adicional_descripcion_check" CHECK (char_length("descripcion") <= 200);
ALTER TABLE "adicional" ADD CONSTRAINT "adicional_precio_check" CHECK ("precio" > 0);
