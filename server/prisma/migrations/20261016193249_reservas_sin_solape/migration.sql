DO $$
DECLARE
  total integer;
  ejemplos text;
BEGIN
  WITH pares AS (
    SELECT a.id AS a_id, b.id AS b_id,
           format('%s y %s (cancha %s, %s, %s-%s y %s-%s)',
                  a.id, b.id, a.cancha_id, a.fecha,
                  a.hora_inicio, a.hora_fin, b.hora_inicio, b.hora_fin) AS par
      FROM reserva a
      JOIN reserva b
        ON b.cancha_id = a.cancha_id
       AND b.id > a.id
       AND tsrange(a.inicio_en, a.fin_en, '[)') && tsrange(b.inicio_en, b.fin_en, '[)')
     WHERE a.estado IN ('PENDIENTE_PAGO', 'PENDIENTE_VALIDACION', 'CONFIRMADA', 'EN_JUEGO', 'FINALIZADA')
       AND b.estado IN ('PENDIENTE_PAGO', 'PENDIENTE_VALIDACION', 'CONFIRMADA', 'EN_JUEGO', 'FINALIZADA')
  )
  SELECT (SELECT count(*) FROM pares),
         (SELECT string_agg(par, '; ') FROM (SELECT par FROM pares ORDER BY a_id, b_id LIMIT 20) p)
    INTO total, ejemplos;

  IF total > 0 THEN
    RAISE EXCEPTION 'No se puede crear reserva_sin_solape: hay % pares de reservas activas solapadas en la misma cancha: %', total, ejemplos
      USING HINT = 'Cancela o mueve una reserva de cada par y vuelve a desplegar.';
  END IF;
END $$;

CREATE EXTENSION IF NOT EXISTS btree_gist;

ALTER TABLE reserva ADD CONSTRAINT reserva_sin_solape
  EXCLUDE USING gist (
    cancha_id WITH =,
    tsrange(inicio_en, fin_en, '[)') WITH &&
  )
  WHERE (estado IN ('PENDIENTE_PAGO', 'PENDIENTE_VALIDACION', 'CONFIRMADA', 'EN_JUEGO', 'FINALIZADA'));
