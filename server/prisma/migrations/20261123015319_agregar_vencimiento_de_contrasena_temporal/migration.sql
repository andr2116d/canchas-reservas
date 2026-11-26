-- AlterTable
ALTER TABLE "usuario" ADD COLUMN     "contrasena_temporal_vence_en" TIMESTAMPTZ(3);


-- Las contraseñas temporales que ya existían vencen a los 7 días de esta migración.
UPDATE "usuario"
SET "contrasena_temporal_vence_en" = CURRENT_TIMESTAMP + INTERVAL '7 days'
WHERE "requiere_cambiar_contrasena";
