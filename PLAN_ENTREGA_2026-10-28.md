# Plan de entrega AirSense — 28/10/2026

## Prioridad académica

La entrega debe cubrir la consigna del profesor con documentación aplicada específicamente a AirSense:

1. Documentación técnica de arquitectura, tecnologías, despliegue y mantenimiento.
2. Diagramas UML: casos de uso, clases y secuencia.
3. Manual de usuario visual y paso a paso.
4. Manual de operación: despliegue, copias de seguridad, restauración y permisos.
5. Modelo Entidad-Relación, normalización, restricciones y roles.
6. Problema de grafos/redes aplicado a AirSense, con definición y resolución mediante Dijkstra.
7. Modelo de optimización aplicado a la asignación de sensores/espacios, con función objetivo, restricciones y ejemplo resuelto.
8. Documento final integrado y material listo para presentar.

## Estado técnico comprobado

- Frontend Vue/Vite implementado.
- Autenticación, perfiles y administración de usuarios integrados con Supabase.
- Migraciones y Edge Functions desplegadas.
- Pruebas de validación y compilación aprobadas.
- Proyecto preparado para Vercel mediante `vercel.json`.

## Correo SMTP

- La configuración con el Gmail personal fue cancelada y no debe utilizarse.
- El código SMTP está implementado, pero la configuración productiva queda pendiente.
- Debe configurarse exclusivamente con la cuenta oficial/dedicada de AirSense.
- No almacenar contraseñas ni tokens en el repositorio.

## Orden al retomar

Cuando el usuario diga **“continuá”**:

1. Inspeccionar el PDF de documentación y el sistema actual para reutilizar contenido real.
2. Crear la documentación académica completa y los diagramas.
3. Incorporar el material al repositorio y, si corresponde, a la sección Documentación del sitio.
4. Verificar build, pruebas y coherencia entre documentación y sistema.
5. Entregar instrucciones mínimas de publicación y una lista clara de lo que todavía requiera credenciales externas.

