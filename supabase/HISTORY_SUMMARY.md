# Activación del resumen de historial

La web consulta `get_reading_history_summary` para recibir como máximo 240 lecturas originales del período seleccionado. No modifica ni elimina mediciones.

## Cambio preparado

Migración: [20261110000000_history_summary.sql](migrations/20261110000000_history_summary.sql).

- Divide el período con datos en 24 intervalos temporales.
- Conserva la primera y última lectura, y las lecturas de mínimo y máximo de temperatura, humedad, ruido y aire de cada intervalo.
- Devuelve hasta 10 lecturas por intervalo (240 en total), junto con la cantidad total de mediciones. Las coincidencias se devuelven una sola vez.
- Si hay hasta 240 mediciones, devuelve todas.
- Usa las fechas originales y conserva las políticas RLS del usuario. Sólo usuarios autenticados activos y autorizados para la estación pueden ejecutar la función.

El límite reduce transferencia y memoria del navegador. La base sigue procesando las mediciones del período; debe medirse su tiempo con el volumen real antes de un despliegue amplio.

## Estado y siguiente paso

La migración está preparada, **no aplicada**. Las pruebas automatizadas verifican el cliente con respuestas simuladas; no se ejecutó PostgreSQL en esta sesión.

Antes de activar en producción, aplicar únicamente esta migración en un entorno de prueba con las migraciones anteriores ya instaladas. Puede ejecutarse su contenido en el editor SQL de ese entorno mediante el procedimiento habitual del proyecto. No aplicar indiscriminadamente migraciones pendientes de otros cambios.

Verificar allí:

1. Una estación con menos de 240 filas devuelve todas, en orden temporal.
2. Una estación con miles de filas devuelve como máximo 240 y el total correcto; picos conocidos de cada variable permanecen dentro de sus intervalos.
3. Fechas iguales, período vacío y límites de fecha producen resultados válidos.
4. Un usuario de otra estación y un visitante sin sesión no pueden leer el resumen.
5. Cambiar estación/período durante la carga no muestra respuestas anteriores.
6. Medir el tiempo de «30 días» y «Todo» con el volumen esperado.

Hasta aplicar la migración, la web detecta que falta la función y muestra **una vista parcial de las últimas 240 lecturas**, con aviso visible. Esa vista no garantiza conservar los extremos de todo el período. Los errores de permisos no activan esta alternativa.

Después de validar el entorno de prueba, revisar con el responsable del proyecto la activación en producción como un paso separado.
