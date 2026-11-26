-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "accion_auditada" ADD VALUE 'confirmacion_de_datos';
ALTER TYPE "accion_auditada" ADD VALUE 'edicion_propia';
ALTER TYPE "accion_auditada" ADD VALUE 'cambio_de_contrasena';
ALTER TYPE "accion_auditada" ADD VALUE 'cambio_de_correo';
ALTER TYPE "accion_auditada" ADD VALUE 'cambio_de_documento';

-- AlterTable
ALTER TABLE "sesion" ADD COLUMN     "dispositivo" TEXT;

-- AlterTable
ALTER TABLE "usuario" ADD COLUMN     "datos_confirmados_en" TIMESTAMPTZ(3),
ADD COLUMN     "documento_cambiado_en" TIMESTAMPTZ(3);

-- El dispositivo es un resumen corto del navegador, como «Chrome en Windows».
ALTER TABLE "sesion" ADD CONSTRAINT "sesion_dispositivo_check" CHECK (char_length("dispositivo") <= 60);
