-- El historial del horario dice qué reservas por jugar dejó fuera; esa versión es importante porque
-- afecta a clientes. Las demás fuentes no cambian.
CREATE OR REPLACE VIEW "historial_de_cambios" AS
WITH tarifas AS (
  SELECT t.id, t.guardada_en, t.guardada_por_id, t.tipo_de_cancha,
    jsonb_build_object(
      'precioDia', t.precio_dia::text,
      'precioNoche', t.precio_noche::text,
      'duracion', t.duracion_del_turno_horas,
      'turnoCorto', t.ofrece_turno_corto
    ) AS version
  FROM "tarifa_de_cancha" t
),
horarios AS (
  SELECT h.id, h.guardado_en, h.guardado_por_id, h.reservas_fuera_de_horario AS fuera,
    jsonb_build_object(
      'noche', h.minuto_de_inicio_de_la_noche,
      'dias', COALESCE((
        SELECT jsonb_agg(jsonb_build_object(
          'dia', upper(d.dia::text),
          'apertura', d.minuto_de_apertura,
          'cierre', d.minuto_de_cierre,
          'noche', d.minuto_de_inicio_de_la_noche
        ) ORDER BY d.dia)
        FROM "horario_del_dia" d WHERE d.horario_id = h.id
      ), '[]'::jsonb)
    ) AS version
  FROM "horario_de_atencion" h
),
reglas AS (
  SELECT r.id, r.guardada_en, r.guardada_por_id,
    COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'desdeHoras', x.desde_horas,
        'porcentaje', x.porcentaje,
        'ofreceCredito', x.ofrece_credito
      ) ORDER BY x.desde_horas)
      FROM "rango_de_cancelacion" x WHERE x.regla_id = r.id
    ), '[]'::jsonb) AS version
  FROM "regla_de_cancelacion" r
),
adelantos AS (
  SELECT a.id, a.guardado_en, a.guardado_por_id,
    jsonb_build_object('porcentaje', a.porcentaje) AS version
  FROM "adelanto_minimo" a
),
plazos AS (
  SELECT p.id, p.guardado_en, p.guardado_por_id,
    jsonb_build_object('minutos', p.minutos) AS version
  FROM "plazo_de_pago" p
)
SELECT 'cuenta-' || ra.id AS id, ra.ocurrido_en, ra.ejecutado_por_id,
  'CUENTAS'::text AS categoria, upper(ra.accion::text) AS accion,
  NULL::text AS sujeto, ra.usuario_afectado_id AS sujeto_usuario_id, NULL::jsonb AS detalle,
  ra.accion IN (
    'desactivacion', 'restablecimiento_de_contrasena',
    'cambio_de_contrasena', 'cambio_de_correo', 'cambio_de_documento'
  ) AS importante
FROM "registro_auditoria" ra
-- Los cambios que un jugador hace en su propia cuenta no son cambios del local.
JOIN "usuario" afectado ON afectado.id = ra.usuario_afectado_id
WHERE afectado.rol <> 'jugador'
UNION ALL
SELECT 'tarifa-' || id, guardada_en, guardada_por_id, 'TARIFAS',
  CASE WHEN anterior IS NULL THEN 'ALTA' ELSE 'EDICION' END,
  upper(tipo_de_cancha::text), NULL, jsonb_build_object('antes', anterior, 'despues', version), true
FROM (
  SELECT *, LAG(version) OVER (PARTITION BY tipo_de_cancha ORDER BY guardada_en, id) AS anterior
  FROM tarifas
) t
UNION ALL
SELECT 'horario-' || id, guardado_en, guardado_por_id, 'HORARIO',
  CASE WHEN anterior IS NULL THEN 'ALTA' ELSE 'EDICION' END,
  NULL, NULL,
  jsonb_build_object(
    'antes', anterior,
    'despues', version,
    'reservasFueraDeHorario', to_jsonb(COALESCE(fuera, '{}'))
  ),
  COALESCE(cardinality(fuera), 0) > 0
FROM (SELECT *, LAG(version) OVER (ORDER BY guardado_en, id) AS anterior FROM horarios) h
UNION ALL
SELECT 'regla-' || id, guardada_en, guardada_por_id, 'CANCELACION',
  CASE WHEN anterior IS NULL THEN 'ALTA' ELSE 'EDICION' END,
  NULL, NULL, jsonb_build_object('antes', anterior, 'despues', version), true
FROM (SELECT *, LAG(version) OVER (ORDER BY guardada_en, id) AS anterior FROM reglas) r
UNION ALL
-- El adelanto toca dinero: cada versión es importante.
SELECT 'adelanto-' || id, guardado_en, guardado_por_id, 'ADELANTO',
  CASE WHEN anterior IS NULL THEN 'ALTA' ELSE 'EDICION' END,
  NULL, NULL, jsonb_build_object('antes', anterior, 'despues', version), true
FROM (SELECT *, LAG(version) OVER (ORDER BY guardado_en, id) AS anterior FROM adelantos) a
UNION ALL
-- El plazo no mueve dinero: sus versiones no son importantes.
SELECT 'plazo-' || id, guardado_en, guardado_por_id, 'PLAZO_DE_PAGO',
  CASE WHEN anterior IS NULL THEN 'ALTA' ELSE 'EDICION' END,
  NULL, NULL, jsonb_build_object('antes', anterior, 'despues', version), false
FROM (SELECT *, LAG(version) OVER (ORDER BY guardado_en, id) AS anterior FROM plazos) p
UNION ALL
SELECT 'cancha-' || c.id, c.ocurrido_en, c.ejecutado_por_id,
  CASE WHEN c.accion IN ('bloqueo', 'liberacion_de_bloqueo', 'retiro_de_bloqueo')
    THEN 'MANTENIMIENTO' ELSE 'CANCHAS' END,
  upper(c.accion::text), c.nombre_de_la_cancha, NULL, c.detalle,
  c.accion IN ('desactivacion', 'eliminacion')
    OR (c.accion = 'bloqueo' AND c.detalle ->> 'tipo' = 'EMERGENCIA')
FROM "cambio_de_cancha" c
UNION ALL
SELECT 'adicional-' || a.id, a.ocurrido_en, a.ejecutado_por_id, 'ADICIONALES',
  upper(a.accion::text), a.nombre_del_adicional, NULL, a.detalle,
  a.accion IN ('desactivacion', 'eliminacion') OR (a.accion = 'edicion' AND a.detalle ? 'precio')
FROM "cambio_de_adicional" a
UNION ALL
-- Solo los inicios de sesión del personal: los de jugadores no son cambios del local.
SELECT 'acceso-' || ac.id, ac.ocurrido_en, ac.usuario_id, 'ACCESOS',
  'INICIO_DE_SESION', NULL, NULL, NULL, false
FROM "registro_acceso" ac
JOIN "usuario" u ON u.id = ac.usuario_id
WHERE u.rol <> 'jugador'
UNION ALL
-- La respuesta a una hoja tiene plazo legal: es importante. El sujeto es su número.
SELECT 'hoja-' || ch.id, ch.ocurrido_en, ch.ejecutado_por_id, 'RECLAMOS',
  upper(ch.accion::text),
  'Hoja ' || lpad(h.correlativo::text, 6, '0') || '-' || h.anio, NULL, ch.detalle,
  ch.accion = 'respuesta'
FROM "cambio_de_hoja" ch
JOIN "hoja_de_reclamacion" h ON h.id = ch.hoja_id
UNION ALL
-- Separar una reserva compromete un turno y un adelanto: es importante. El sujeto es su código.
SELECT 'reserva-' || r.id, r.creado_en, r.creada_por_id, 'RESERVAS',
  'SEPARACION', 'Reserva ' || r.codigo, NULL,
  jsonb_build_object(
    'cancha', c.nombre,
    'inicio', r.inicio,
    'fin', r.fin,
    'precio', r.precio::text,
    'adelanto', r.adelanto::text,
    'canal', r.canal::text
  ),
  true
FROM "reserva" r
JOIN "cancha" c ON c.id = r.cancha_id
UNION ALL
-- Una reserva vence sola, sin que nadie la toque: el autor es el sistema.
SELECT 'vencimiento-' || r.id, r.expirada_en, NULL::int, 'RESERVAS',
  'EXPIRACION', 'Reserva ' || r.codigo, NULL,
  jsonb_build_object('cancha', c.nombre, 'inicio', r.inicio, 'fin', r.fin),
  false
FROM "reserva" r
JOIN "cancha" c ON c.id = r.cancha_id
WHERE r.expirada_en IS NOT NULL;
