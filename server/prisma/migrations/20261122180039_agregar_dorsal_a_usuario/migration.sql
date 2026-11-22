-- AlterTable
ALTER TABLE "usuario" ADD COLUMN     "dorsal" SMALLINT;

-- El dorsal es opcional, pero si existe va del 1 al 99, como en el formulario.
ALTER TABLE "usuario" ADD CONSTRAINT "usuario_dorsal_check" CHECK ("dorsal" BETWEEN 1 AND 99);
