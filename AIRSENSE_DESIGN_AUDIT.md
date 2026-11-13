# AirSense — Auditoría integral de producto digital

Fecha: 10 de noviembre de 2026. Objetivo: preparación para una exposición tecnológica y un lanzamiento público creíble.

Seguimiento de implementación — primer paso del dashboard (10 de noviembre de 2026): se protegieron las respuestas de lecturas e historial por estación, se cancelan consultas históricas anteriores, se corrigen nulos en clasificación/alertas, se unificó la vigencia en 30 segundos y se recargan lecturas al reconectar. La IA se vincula a una lectura con fecha visible, descarta respuestas de otra estación y caduca; los umbrales inteligentes también verifican su contexto. IA e informes requieren sesión y se bloquean en demo. Se añadieron pruebas de regresión con transporte simulado. Los hallazgos siguientes conservan el diagnóstico original; estos cambios aún requieren validación visual y con dispositivos reales. Quedan pendientes la demo pública completa, gráficos temporales, presupuesto/agregación del historial y los demás pasos de la hoja de ruta.

## 1. Resumen ejecutivo

Actualización del historial: se incorporó la escala temporal real y se reemplazó la descarga paginada completa por una consulta de resumen de hasta 240 puntos. La migración de agregación está preparada, pendiente de aplicación y validación en Supabase. Mientras falta, se muestra una vista parcial acotada con aviso explícito. Procedimiento y límites: [supabase/HISTORY_SUMMARY.md](supabase/HISTORY_SUMMARY.md). A13 continúa pendiente de validación del servidor y del rendimiento con datos reales.

AirSense tiene una identidad reconocible, un producto físico identificable y una landing con una intención editorial clara. Sin embargo, todavía no hay evidencia suficiente para considerarlo listo para un lanzamiento premium. El mayor impedimento es la confianza: el recorrido público termina en un dashboard que requiere datos autorizados, hay problemas de sincronización entre estaciones y parte del discurso comercial promete más de lo que permite verificar el repositorio.

La prioridad es asegurar que cada pantalla diga la verdad sobre el dispositivo, la procedencia de los datos, su antigüedad y el estado de las funciones. Agregar transparencias o animaciones antes de resolver esto aportaría poco valor.

**Resultado provisional de inspección: 5,64/10.** No es una calificación visual final ni una certificación de accesibilidad. Se explica y desglosa en la sección 3. No se comprobó ningún P0 explotable o bloqueo universal; sí se identificaron P1 que deben resolverse antes de una demostración pública confiable.

Los cinco frentes prioritarios son:

1. Separar la demostración pública del espacio privado y evitar acciones de IA/correo que el visitante no puede completar.
2. Aislar correctamente el historial, las lecturas y las recomendaciones por estación, incluyendo solicitudes simultáneas.
3. Corregir el tratamiento de valores nulos y de lecturas antiguas.
4. Revisar las afirmaciones comerciales y el contenido visual que contradice la limitación del MQ-135.
5. Completar la accesibilidad de los diálogos y el control del video automático.

### Método, alcance y límites

Se inspeccionaron las rutas, las nueve vistas actuales, los quince componentes compartidos, los composables y utilidades, las tres hojas de estilos, las migraciones de seguridad/telemetría, las cinco Edge Functions y su módulo compartido, las configuraciones de hosting y las dos suites de pruebas.

Se realizaron estas verificaciones sin instalar dependencias ni escribir en servicios externos:

| Verificación | Resultado y límite |
| --- | --- |
| `npm.cmd test` | 7 pruebas aprobadas, 0 fallidas. Cubren validación de autenticación y funciones de presentación; no cubren recorridos completos. |
| `npm.cmd run build -- --configLoader runner` | Compilación correcta, 121 módulos transformados. Se utilizó el cargador alternativo por la restricción de acceso de esbuild detectada en la sesión previa. |
| Reproducción con Node de reglas ambientales | Una lectura con cuatro valores `null` produce clasificación `danger` y recomendaciones de calefacción/humidificación. |
| Cálculo de contraste sRGB de colores opacos | Resultados reproducibles en la sección 10. No representan contraste sobre fotografías o blur. |
| Tamaños de archivos | Galería con JPEG de hasta 6,46 MB y PNG de ruido de 1,83 MB. Tamaños sin comprimir en disco, expresados en MB decimales. |
| Patrones de secretos | 54 archivos de fuente/compilado examinados para patrones concretos de claves privadas, `sb_secret_` y claves Groq; no hubo coincidencias. No equivale a una auditoría exhaustiva del historial o de secretos. |
| Inspección de imágenes locales | Se visualizaron los cinco WebP de espacios de 768 px, el recorte principal del dispositivo y `Fotos/galeria general/20260820_101650.jpg`. |

**No se dispuso de una herramienta de navegador ni de Playwright/Puppeteer instalados; tampoco se localizaron Chrome/Edge en las ubicaciones convencionales comprobadas.** No se ejecutaron interacciones en una página renderizada, capturas, Lighthouse, axe ni mediciones LCP/INP/CLS. Tampoco se probaron credenciales, correos, autenticación, dispositivos físicos, APK o proveedores de IA/clima en producción. Los anchos solicitados quedan explícitamente pendientes de validación visual.

Las modificaciones de eliminación de Tecnología existentes al comenzar esta auditoría forman parte del estado auditado. Esta etapa agrega únicamente este documento: no implementa correcciones, no instala paquetes, no cambia la base de datos ni realiza commits. La compilación regenera la salida ignorada `dist`.

## 2. Evaluación general

### Inventario de rutas y alcance real

Referencia: [src/router.js](src/router.js#L14). La ruta retirada `/documentacion/` ya no existe y cae en la redirección general a Inicio. No se recomienda restaurarla como parte de esta auditoría.

| Ruta | Implementación real | Diagnóstico |
| --- | --- | --- |
| `/` | `ProductView`: video hero → problemas ambientales → dispositivo interactivo → dato de ruido → espacios | Narrativa y recursos propios; faltan cierre de conversión y encuesta. |
| `/dashboard/` | Métricas, selección de estación, recomendaciones locales/IA, correo e historial | Pública en web; requiere sesión en plataforma nativa. Datos reales condicionados por RLS. |
| `/hardware/`, alias `/clasico/` | `ClassicView`: ficha, despliegue, comparación y cotización | Discurso Enterprise/Pro más ambicioso que la landing y la evidencia disponible. |
| `/instalaciones/`, alias `/galeria/` | `GalleryView`: 12 fotos y lightbox | Recursos auténticos útiles, pero al menos un pie no coincide con la foto. |
| `/cuenta/ingresar/` | Login y recuperación mediante cambio de modo | Formularios con errores/feedback; el enlace de recuperación del footer no abre directamente la solicitud de correo. |
| `/cuenta/registro/` | Registro, validación de contraseña y confirmación | Implementado; no comprobado contra servicio real. |
| `/cuenta/recuperar/` | Elección de contraseña nueva | El texto asume que el enlace validó la identidad incluso si se visita directamente. |
| `/cuenta/verificar-2fa/` | Desafío TOTP | Implementado; falta evaluar recuperación y salida ante fallo de factores. |
| `/panel/` | Perfil, email, contraseña, cierre de sesión | Requiere usuario activo; no presenta enlaces a configuración/MFA/admin. |
| `/configuracion/` | Dispositivos, región, MFA, notificaciones y aprovisionamiento | Mezcla web y Android; algunas instrucciones y acciones sólo sirven en APK. |
| `/admin/usuarios/` | Búsqueda, filtros, paginación, edición y eliminación | Protegida por rol; diálogo incompleto para teclado. No se ejecutaron mutaciones. |
| Cualquier ruta desconocida | Redirección a Inicio | Evita una pantalla rota, pero oculta enlaces erróneos y rutas retiradas. |

### Funcionalidades presentes y ausentes

| Funcionalidad | Estado comprobado en código |
| --- | --- |
| Métricas ambientales | Cuatro variables y tendencias entre dos muestras válidas. |
| AirScore | No se encontró implementación ni fórmula; la tarjeta de entorno no es un índice. |
| Tiempo real | Suscripción a INSERT por `device_id`, con carga inicial de 60 filas. |
| Historial | Cinco períodos, paginación de 1.000 filas y reducción visual a 240 puntos. |
| IA | Botón y Edge Function con Groq + WeatherAPI, autenticación y fallback local. Existencia de código, no disponibilidad desplegada. |
| Informes | Envío manual de una lectura por correo; alertas automáticas por ingesta. No se encontró generador de informe histórico completo o exportación CSV/PDF en la UI actual. |
| Gestión de estaciones | Listado, selección y renombrado RPC. No se encontró un flujo web completo de reclamación/asignación de propiedad de una estación nueva. |
| Alertas | Locales durante proceso activo; el componente comunica esta limitación. No hay evidencia de push con la app cerrada. |
| Instagram | Enlaces oficiales en header y footer con `noopener noreferrer`. No se comprobó la disponibilidad externa de la cuenta. |
| Encuesta | No se encontró enlace, formulario ni CTA en `src`/`public`. |
| Datos de impacto | Porcentaje fijo de ruido 72,7 %, con aclaración de pruebas del proyecto. Falta trazabilidad del conjunto de datos. |

## 3. Tabla de puntuaciones

Método: cada categoría tiene cinco controles, cada uno con 0, 1 o 2 puntos: **0 = brecha observable; 1 = soporte parcial, fragmentado o sin verificación suficiente; 2 = soporte explícito y coherente en el material inspeccionado**. La puntuación es la suma del vector, con máximo 10. Un 2 no declara validación visual cuando ésta no existe. Las categorías tienen igual peso, 1/14: no hay datos de usuarios que justifiquen otra ponderación. Resultado: 79/140 × 10 = **5,64/10**.

Las puntuaciones visuales son hipótesis de preparación basadas en CSS y recursos locales, no evaluaciones de pantallas renderizadas. Las métricas reales y una prueba presencial pueden cambiar el resultado.

| Categoría | Controles en orden | Vector | Nota | Evidencia principal / alcance |
| --- | --- | --- | --- | --- |
| Diseño visual | Paleta, producto, jerarquía, superficies, pantalla validada | 2/2/1/1/1 | 7 | Tokens y componentes propios; blur acumulado; sin render. |
| Tipografía | Familias, escala, interlineado, secundarios, consistencia SO | 2/2/2/0/1 | 7 | Variables y `clamp`; secundarios de 10–11 px y familias distintas en dashboard. |
| Composición y espaciado | Contención, grillas, separación, densidad, validación | 2/2/1/1/1 | 7 | Contenedores explícitos; 1.040/1.180/1.200/1.280/1.376 px sin sistema común. |
| Identidad de marca | Paleta, logotipo, vocabulario, recursos, continuidad | 2/2/1/1/1 | 7 | Marca constante; AirSense/Pro/Enterprise y estética del dashboard divergentes. |
| UX | Descubrimiento, navegación, acciones, feedback, recuperación | 1/1/0/2/1 | 5 | Buen feedback en formularios; recorrido demo sin resolver y recuperación ambigua. |
| Responsive | Fluidez, breakpoints, táctil, tablas, matriz validada | 2/2/1/1/0 | 6 | CSS adaptable; matriz de ocho tamaños no ejecutada. |
| Accesibilidad | Semántica, etiquetas, teclado, contraste, movimiento | 2/1/1/0/1 | 5 | Etiquetas y ARIA presentes; contraste marginal y diálogos incompletos. |
| Animaciones | Propósito, duración, cleanup, preferencias, video | 2/1/2/1/0 | 6 | Observers con cleanup; falta pausa/reducción del video. |
| Rendimiento | Build, división, medios, consultas, métricas medidas | 2/2/0/1/0 | 5 | Build y rutas diferidas; medios pesados y descarga histórica sin límite. |
| Marketing y storytelling | Atención, problema, solución, prueba, acción | 2/1/1/0/0 | 4 | Hero y problemas claros; afirmaciones sin evidencia y cierre ausente. |
| Calidad del código | Separación, reutilización, estilos, asincronía, pruebas | 2/2/0/1/1 | 6 | Composables útiles; CSS por sobreescritura y pruebas de alcance reducido. |
| Dashboard y datos | Métricas, estados, aislamiento, historia, recomendaciones | 2/1/0/1/0 | 4 | Faltan control de carreras, vigencia de IA y manejo consistente de nulos. |
| Coherencia entre páginas | Marca, tipos, controles, tono, estados | 2/1/1/0/1 | 5 | Misma paleta; landing humana y hardware/formularios corporativos. |
| Percepción premium | Foco, claridad, detalle, credibilidad, fluidez validada | 2/1/1/0/1 | 5 | Recursos propios; foto/claims y fiabilidad impiden validar confianza premium. |

## 4. Fortalezas del proyecto

- La frase «Hacemos visible lo invisible» tiene una relación clara con la categoría del producto. El texto siguiente explica monitoreo ambiental, evitando depender sólo del eslogan.
- Existe producto físico y documentación fotográfica propia: una base de credibilidad más valiosa que otra capa de efectos.
- La landing tiene componentes especializados, no una única vista monolítica. Los espacios usan `srcset`, WebP, dimensiones explícitas, lazy loading y mensajes de error.
- El header tiene nombres accesibles, Escape, cierre por cambio de ruta, foco exterior y fallback de transparencias. Instagram conserva un área de 44 × 44 px.
- El dashboard diferencia «Demostración», «Esperando datos», «Error» y «Estación desconectada» con un reloj reactivo de cinco segundos, en lugar de un rótulo fijo «En vivo».
- `isMeasurement` preserva el cero válido y evita mostrar nulos como cero en las tarjetas; hay pruebas para esta función y las tendencias.
- Los gráficos permiten explorar con flechas/Home/End y anuncian el punto mediante `aria-live`.
- Hay políticas RLS de dispositivos, comprobación de usuario activo en funciones sensibles, límites de peticiones y validación de cuerpos. Las credenciales privadas se leen en servidor.
- Se declara la limitación del MQ-135 en el dashboard y se distingue IA de reglas locales. El componente de alertas explica que no funciona como push persistente.

Estas fortalezas deben conservarse: no se justifica reemplazar la identidad ni reconstruir todo el frontend.

## 5. Problemas críticos

**P0 confirmados: ninguno en las verificaciones realizadas.** Esto no certifica seguridad, disponibilidad ni políticas desplegadas.

Los P1 de mayor impacto son A01–A12 en la sección 14. Tres merecen atención previa a cualquier refinamiento estético:

- **Contaminación de contexto:** el historial puede cargar estaciones agregadas antes de la selección y las respuestas antiguas pueden sobrescribir la estación activa. Es un fallo de presentación y aislamiento de contexto; RLS sigue siendo la barrera de autorización, por lo que no se afirma una filtración entre usuarios.
- **Recomendaciones incorrectas:** cuatro valores nulos se interpretan como ceros en la clasificación; la IA conserva resultados de otra estación o lectura.
- **Expectativa pública incumplida:** el dashboard web está abierto, pero las políticas de dispositivos sólo autorizan usuarios autenticados. IA y correo requieren `requireUser`. El visitante no tiene una demostración pública completa garantizada por el código actual.

## 6. Auditoría visual

### Tipografía y legibilidad

`main.css:36` define Segoe UI Variable para cuerpo y títulos; `dashboard.css:11` usa una pila que comienza en `-apple-system`. En Windows la diferencia puede ser pequeña; en macOS/iOS el dashboard se resolverá con tipografía del sistema y las páginas públicas pueden llegar a Arial. No es evidencia de un problema tipográfico de Apple; es una inconsistencia entre superficies que debe decidirse explícitamente.

Quedan numerosas declaraciones `Space Grotesk` sobreescritas al final de la hoja; no se encontró una carga efectiva de esa familia. La cascada determina el resultado, dificultando mantenimiento y predicción. No se observó uso intencional de serif en las páginas actuales.

Los titulares de landing usan pesos 600, `clamp`, interlineados 1,04–1,08 y tracking cercano a −0,045em. Es una base editorial razonable. El hardware conserva interlineados muy compactos y algunos estilos antiguos llegan a −0,065em: revisar títulos multilínea y zoom, sin declarar recortes no vistos.

El problema más verificable es la jerarquía secundaria del dashboard: etiquetas de sensor de 10 px, subtítulos de 11 px y kickers de 10 px. El dato principal es grande, pero la procedencia, unidad contextual y antigüedad compiten en tamaño reducido. El tamaño por sí solo no viola WCAG; sí genera riesgo de lectura en una exposición y en móviles.

### Composición y ruido

Los componentes recientes tienen buen control de longitud de línea: 48ch en hero, 65ch en problemas y 57ch en la explicación del ruido. Hay un esfuerzo real por separar ideas.

Conviven anchos máximos de 1.040 px en footer, 1.180 en contenido general/espacios, 1.200 en dashboard, 1.280 en header/problemas y 1.376 en dispositivo. Una composición editorial puede usar anchos distintos, pero faltan tokens que documenten la relación. El salto al footer debe comprobarse en 1.440/1.920 px.

`DeviceDetailSection` reserva 440 px para la lista y 540 px en móvil; junto con un bloque de imagen de 400 px puede alargar mucho la sección. La lista completa, más controles anterior/siguiente, agrega dos maneras de realizar la misma tarea. No es un error funcional; es una oportunidad de reducir densidad y recorrido.

La landing tiene dos cierres conceptuales sobre comprender el entorno, además de las explicaciones del dispositivo y del dato de ruido. Su extensión no termina en una acción de exposición. El espacio negativo será útil si conduce a una secuencia clara, no sólo si aumenta la altura total.

### Color, superficies y geometría

La paleta solicitada se conserva en sus colores principales. El negro global es `#000000`, mientras el dashboard usa `#111827`. Hay derivados navy/ice útiles y colores semánticos para alertas; no corresponde eliminarlos sólo para reducir el número de colores. Sí corresponde documentar roles y contrastes.

El header emplea una superficie SVG calculada con `ResizeObserver`, clip path, blur y reflejos. El código declara continuidad geométrica G2 mediante segmentos cúbicos; eso no demuestra continuidad paramétrica C2 y esta auditoría no la atribuye. El resto usa `border-radius`, círculos, píldoras y `corner-shape: squircle` como mejora progresiva: tampoco equivalen a C2.

El vidrio aparece en header, botón del hero, tarjetas de características, flechas, selector de espacios y controles públicos. El dashboard reserva superficies sólidas para datos, una buena decisión. En la sección del dispositivo hay blur en contenedor y controles superpuestos: verificar coste de composición y contraste con cada fondo. No se puede afirmar fluidez o saturación visual sin render.

Existen `@supports` y `prefers-reduced-transparency` en componentes importantes, además de fallbacks compartidos al final de `main.css`. Deben verificarse las prioridades cuando coinciden selectores scoped y globales. El resultado actual es un tratamiento de vidrio inspirado en materiales; no reproduce el comportamiento óptico completo de un sistema nativo Liquid Glass.

### Fotografías y recursos

Se inspeccionaron directamente los cinco espacios de 768 px. Comparten luz natural cálida, madera clara, vegetación, dispositivo blanco y pantallas de baja densidad. Forman una serie visual bastante coherente. Hogar y dormitorio tienen una iluminación más cálida que oficina/educación/escritorio, una variación compatible con su contexto.

El dispositivo ocupa poco espacio en hogar/oficina; educación y escritorio lo vuelven más protagonista. Los recortes móviles `4 / 3` con `object-position` entre 55 % y 65 % necesitan prueba para asegurar que no desaparezca la relación entre persona, estación y pantalla.

Las escenas tienen aspecto de visualizaciones conceptuales y pantallas muy uniformes. **No se puede probar su origen en IA sólo observando el archivo**; no se encontró una declaración de procedencia junto a estos recursos. Etiquetarlas como conceptuales una vez confirmado su origen y separarlas de pruebas reales.

El recorte `airsense-device-detail.png` muestra literalmente «CO2: 18 ppm», mientras el dashboard explica que MQ-135 no ofrece una medición verificada de CO₂. La imagen contradice el mensaje de cautela aunque la UI esté bien redactada. No se infiere calibración ni exactitud a partir de ese número.

La primera foto de galería, `20260820_101650.jpg`, muestra un prototipo junto a una notebook y una maceta, en un entorno educativo. Su pie en `GalleryView.vue` es «Ensamblaje de estaciones AirSense Pro». El desacuerdo es observable. La página lo presenta bajo «Implementaciones reales. Resultados medibles» y «entornos corporativos»: hay que describir el ensayo real, no convertirlo en una línea de fabricación.

No se visualizaron todas las fotos de galería, todas las variantes de características ni los fotogramas del MP4; no se extiende el juicio de procedencia/composición a esos archivos. Los nombres de archivo no prueban su contenido.

## 7. Auditoría UX

### Primeros cinco segundos

El eslogan atrae, pero la explicación debería decir con más precisión «un dispositivo que mide temperatura, humedad, ruido y cambios en el aire». La redacción actual puede interpretarse como plataforma genérica. No se realizó un test de comprensión con personas; esto es una hipótesis derivada del copy.

El producto tiene tres oportunidades de protagonismo: video, sección interactiva e imágenes de espacios. Sin poster, el primer contacto depende de la reproducción y carga del MP4. El visitante que prefiere reducir movimiento carece de una alternativa estática explícita.

### Navegación y recorridos

- **Hero → hardware:** un clic con «Conocer más». Destino funcional en router, aunque el texto es genérico y desemboca en una oferta corporativa distinta del tono inicial.
- **Hero → dashboard:** un clic desde header. No hay CTA contextual de demostración ni explicación previa de acceso/datos. En móvil primero hay que abrir el menú.
- **Hero → Instagram:** acceso directo mediante icono en header y texto en footer. El icono está etiquetado; falta comunicar que abre otra pestaña como sí hace el footer.
- **Hero → encuesta:** recorrido inexistente.
- **Landing completa → siguiente acción:** termina en espacios y luego footer. No hay invitación concreta a probar, responder o seguir el proyecto.
- **Footer → recuperar acceso:** enlaza `/cuenta/recuperar/`, cuyo componente pide una contraseña nueva. La solicitud del enlace sólo aparece dentro del login mediante `forgotMode`; la intención y el destino no coinciden.
- **Cuenta → configuración/MFA:** existe `/configuracion/`, pero `/panel/` no ofrece un acceso directo; el header sólo muestra Inicio/Dashboard. El administrador tampoco encuentra allí la gestión de usuarios.

El registro y la recuperación muestran «Mínimo 10 caracteres, con mayúscula, minúscula y número», mientras `minlength`, `authValidation.js` y la configuración de Supabase exigen 12 y un símbolo. Es una contradicción verificable entre instrucción y validación. En administración, el servidor exige AAL2 incluso si la cuenta admin todavía no tiene factor configurado; la UI debe guiar el alta de MFA antes de ofrecer gestión de usuarios.

### Feedback y estados

Hay mensajes de envío, errores con `role="alert"`, estados de conexión con `role="status"`, botones deshabilitados durante acciones y placeholders de historial. Son puntos fuertes.

En el selector de espacios se espera la imagen antes de confirmar la selección, evitando fotos incompletas; no hay estado de carga de la selección. En una red lenta el clic puede parecer ignorado aunque finalmente funcione. El error sí se anuncia y permite reintento.

Los errores de Supabase se presentan varias veces como mensajes internos. «Edge Function», «telemetría» y «credenciales de Supabase» no ayudan al visitante a decidir qué hacer. Deben convertirse en acciones comprensibles, dejando el detalle técnico para diagnóstico.

## 8. Auditoría de marketing

### Secuencia de exposición

| Momento | Estado actual | Ajuste recomendado |
| --- | --- | --- |
| Atención | Eslogan y video | Mantener y acompañar con categoría concreta. |
| Problema | Carrusel de cuatro condiciones ambientales | Bien alineado con vida cotidiana; evitar exigir ver todo el carrusel. |
| Relevancia | Bienestar y cifra de ruido | Publicar método de la prueba y sus límites. |
| Solución | Dispositivo y funciones | Separar medir, estimar, interpretar y actuar. |
| Demostración | Dashboard en menú | Preparar demo pública explícita y consistente. |
| Interés | Espacios de uso | Añadir una pregunta o invitación adecuada para visitantes. |
| Acción | Footer/Instagram/cotización en otras rutas | Falta encuesta y CTA final de exposición. |

`NoiseInsightSection.vue:84` aclara que el 72,7 % proviene de pruebas propias, lo cual evita presentarlo como estadística poblacional. No incluye cantidad de muestras, fechas, duración, sitio, umbral de ruido, instrumento de referencia ni procedimiento de calibración. El número no puede validarse con lo inspeccionado. No se propone sustituirlo por otra cifra inventada.

En `ClassicView.vue`, revisar «Precisión de laboratorio», «WPA2/WPA3 Enterprise», «calibración digital de fábrica», frecuencia «configurable desde la consola», «SLA contratado» y disponibilidad de despliegues corporativos. No se encontró un control de frecuencia en la consola web ni evidencia de esos compromisos comerciales. Algunas capacidades podrían existir en firmware o documentación externa: la falta de evidencia no demuestra falsedad, pero impide publicarlas como verificadas.

La comparación dice «historial centralizado y exportable» e «informes ejecutivos automáticos». La UI actual comparte una lectura por correo y muestra historial; no ofrece exportación histórica. El formulario exige empresa y utiliza lenguaje de ventas Enterprise, dejando fuera a estudiantes, familias y visitantes interesados en el proyecto.

La promesa de contacto en menos de 24 horas hábiles aparece en modal y correo de cotización. Requiere un proceso real de atención antes de considerarse una garantía de marca.

La metadata de `index.html:8` sigue hablando de AirSense Enterprise; no hay Open Graph/Twitter cards ni contenido específico por ruta fuera del título. Para difusión por QR y redes, la vista previa debería explicar el proyecto y mostrar el producto real. No se verificó indexación en buscadores.

## 9. Auditoría responsive

**Estado: revisión estática, sin aprobación visual de ningún viewport.** Se inspeccionaron `responsive.css`, `dashboard.css` y media queries scoped. No hay evidencia para afirmar que existen o no desbordamientos en ejecución.

| Ancho solicitado | Soporte que aparece en código | Prueba visual pendiente |
| --- | --- | --- |
| 320 px | Header compacto, métricas en una columna, scroll horizontal de espacios | Menú, largo de ID de estación, cinco períodos, modal, controles de carrusel. |
| 375 px | Mismos ajustes compactos | Hero sin recorte de CTA, teclado virtual en formularios, selector táctil. |
| 390 px | Escala fluida y gutters menores | Tipografía, cartas, alertas y cierre de diálogos. |
| 430 px | Métricas pasan a dos columnas al superar 420 px | Densidad de unidades/etiquetas de sensores y tendencias. |
| 768 px | Transición de dispositivo a dos columnas sobre 760 px; espacios vuelve a relación panorámica sobre 767 px | Salto de composición alrededor de 760–768 y controles del header. |
| 1024 px | Menú móvil hasta 1120 px; grillas intermedias | Header, tabla de hardware, historial y orientación horizontal. |
| 1440 px | Contenedores máximos múltiples | Ritmo entre secciones y alineación con footer; balance producto/texto. |
| 1920 px | Contenido limitado; video a ancho completo | Recorte de video y fotos, legibilidad a distancia y áreas vacías. |

Los breakpoints de 420/480/560/700/760/767/820/1100/1120/1280 px no son incorrectos por existir, pero amplían la matriz de regresión. En particular, 768 px cambia a la vez la presentación del dispositivo y el recorte de espacios.

Las tablas técnicas tienen contenedores horizontales y mínimos de 580 px. Eso es una estrategia válida para información bidimensional; deben ser descubribles y operables con teclado. No se exige colapsar toda tabla a tarjetas.

La guía de validación pendiente debe incluir zoom al 200 %, reflow equivalente a 320 CSS px, landscape, texto largo y estados vacíos/error en cada superficie. No basta con una captura del Inicio.

## 10. Auditoría de accesibilidad

Referencia: [WCAG 2.2](https://www.w3.org/TR/WCAG22/). Se utiliza AA como objetivo, no como declaración de conformidad.

### Hallazgos comprobables en código

1. **Diálogos sin gestión completa del foco.** Cotización enfoca el primer control y permite Escape, pero no limita Tab/Shift+Tab al diálogo ni restaura explícitamente el foco al disparador; el fondo no se vuelve `inert`. El lightbox y el editor admin tampoco implementan el ciclo completo. Escape está presente en galería, no en el editor. Son carencias de interacción modal; los efectos exactos sobre lectura y orden requieren navegador. Referencias: `QuoteModal.vue:76`, `GalleryView.vue` y `AdminUsersView.vue`.
2. **Video automático sin control visible de pausa.** `ProductView.vue:17` declara autoplay/loop y no controles ni botón equivalente. Si el movimiento se mantiene por más de cinco segundos junto al contenido, se aplica 2.2.2 Pausar, detener, ocultar (A). Se debe confirmar duración y reproducción efectiva; el control falta en el código. `prefers-reduced-motion` cambia transiciones CSS pero no detiene el video.
3. **Recuperación de contraseña: instrucciones que asumen un estado no confirmado.** La ruta directa afirma que la identidad fue validada. Una visita desde el footer no contiene necesariamente un token. El problema es de orientación y prevención de errores, no se afirma acceso indebido al backend.

### Contraste calculado

| Combinación opaca | Relación | Lectura correcta |
| --- | --- | --- |
| `#088395` / `#FFFFFF` | 4,48:1 | Queda ligeramente debajo de 4,5:1 para texto normal; no redondear para aprobar. El botón «Enviar informe» usa esta combinación (`dashboard.css`). |
| `#7AB2B2` / `#FFFFFF` | 2,38:1 | No sirve para texto informativo normal ni para un control cuya identificación dependa sólo de ese contraste. Puede servir como decoración. No todos los usos de mist son incumplimientos. |
| `#4F7480` / `#EBF4F6` | 4,54:1 | Pasa para texto normal en esos colores exactos; tiene poco margen si se agrega transparencia. |

Los cálculos se hicieron con luminancia relativa sRGB de los valores declarados. El contraste sobre vidrio/fotografía debe evaluarse con el fondo real. El foco global usa un outline al 32 % de opacidad; su visibilidad merece medición específica. No se atribuye un incumplimiento automático a todo outline translúcido.

### Mejoras y pruebas pendientes

- Añadir acceso «Saltar al contenido» y gestión de foco al cambiar rutas. El landmark `main` existe, por lo que la ausencia de skip link por sí sola no prueba que no haya mecanismos alternativos de navegación.
- Verificar lectores de pantalla en SVG interactivos, anuncios de estado, títulos de diálogos y cambios de ruta.
- Los botones con flechas de paginación admin tienen texto visible «←/→», pero conviene nombrarlos «Página anterior/siguiente».
- Revisar autocompletado de datos personales en cotización y perfil; no confundir placeholder con label. La mayoría de campos sí tienen labels asociados.
- Mantener el mínimo AA de 24 × 24 CSS px o su excepción de espaciado; 44 × 44 es un objetivo táctil recomendable, no un mínimo universal de WCAG 2.2 AA. Muchos controles ya lo alcanzan.
- El carrusel de problemas tiene pausa explícita, pausa por foco/interacción y estado de pestaña. Con reducción de movimiento, no anima el desplazamiento pero sigue rotando automáticamente: mejorar esa preferencia sin presentarlo como ausencia total de accesibilidad.
- No se probaron VoiceOver, NVDA, TalkBack, alto contraste ni orientación bloqueada. Se requiere una auditoría asistiva antes de declarar cumplimiento.

## 11. Auditoría técnica

### Arquitectura y mantenimiento

Vue 3 + Vite + Vue Router, con Supabase para autenticación/lecturas y Capacitor para diferencias nativas. Los composables de auth, dispositivos, lecturas y alertas son una separación útil. Las rutas secundarias se importan de forma diferida.

`main.css` supera mil líneas e incluye estilos antiguos de landing, pricing, estándares y header `.site-header`; el header actual es `.airsense-header` scoped. Parte de esos selectores no corresponde a componentes actuales. `dashboard.css` vuelve a definir geometría, tipos y controles después de las hojas anteriores. La dependencia del orden y la acumulación de sobreescrituras elevan el coste de cambio. Identificar selectores vivos antes de retirar estilos; no borrar utilidades compartidas por similitud de nombre.

Hay lógica de vigencia repartida: 30 segundos en presentación y `useReadings`, 45 segundos en `DeviceSwitcher`. El computed `stationOnline` de `useReadings` usa `Date.now()` sin reloj reactivo; el dashboard principal sí dispone de reloj. Los criterios deben centralizarse, incluyendo timestamps inválidos o futuros.

### Rendimiento medido y riesgos

La compilación produjo un chunk inicial de **377,31 kB / 116,90 kB gzip**, CSS de **113,94 kB / 21,84 kB gzip** y un chunk de dashboard de **25,30 kB / 7,88 kB gzip**. Son tamaños de build, no tiempo de carga, LCP o INP. El chunk inicial incluye el recorrido público y dependencias compartidas; no se ejecutó un analizador de composición.

Riesgos concretos:

- `DeviceDetailSection.vue:24` precarga cinco imágenes al montar, aunque la sección esté fuera de viewport. El `saveData` se respeta si está disponible, pero no garantiza evitar competencia con hero en todos los navegadores.
- Galería sirve JPEG originales de entre aproximadamente 2,9 y 6,46 MB en las diez fotos grandes inspeccionadas por tamaño. Usa lazy loading, pero no variantes responsivas. Generar derivados para miniatura y reservar original para lightbox.
- `airsense-noise.png` pesa 1,83 MB. Evaluar WebP/AVIF sin alterar la identidad ni convertir un recurso con transparencia sin comprobarla.
- El video hero pesa 1,01 MB; el peso es moderado frente a las fotos grandes, pero falta poster y estrategia para datos reducidos/autoplay bloqueado.
- La reducción del historial a 240 puntos ocurre después de descargar todas las filas del período. «Todo» no tiene presupuesto de descarga ni cancelación. A cinco segundos por lectura, el volumen crece con rapidez; esto es una estimación de escala, no una medición del servidor.
- El carrusel actualiza progreso con `requestAnimationFrame` y usa blur en sus controles. Se pausa al salir de viewport/pestaña: buen control; medir coste real antes de llamarlo lento.

**Core Web Vitals sin medir.** Según [Web Vitals](https://web.dev/articles/vitals), los objetivos de referencia son LCP ≤ 2,5 s, INP ≤ 200 ms y CLS ≤ 0,1, evaluados al percentil 75 con segmentación móvil/escritorio. No se asignan resultados AirSense a esos indicadores. Medir laboratorio para diagnóstico y campo para aprobación cuando haya tráfico.

### Seguridad y privacidad frontend

- `src/lib/supabase.js` expone URL y anon key como configuración pública del cliente. Esto es parte del modelo Supabase; no es por sí mismo una fuga. La autorización depende de RLS y funciones.
- Las migraciones de propiedad aplican selección por dueño/membresía/admin y las funciones de IA/correo llaman a `requireUser`. Confirmar aplicación efectiva de migraciones en el entorno de lanzamiento; no se consultó producción.
- Las claves Groq, SMTP y service role se leen con `Deno.env` en servidor. No se observaron esos secretos en los patrones examinados del frontend/build.
- `vercel.json` y `nginx.conf.template` incluyen CSP, HSTS y otras cabeceras. Su presencia no demuestra que el hosting efectivo las esté sirviendo. La directiva de estilos admite inline, compatible con estilos dinámicos actuales; reducir permisos exige revisar primero la arquitectura.
- Nginx aplica 30 días a `/assets/`. Los recursos públicos conservan nombres estables, a diferencia de los bundles hash de Vite: prever versionado/invalidation al reemplazar una imagen para no prolongar contenido obsoleto.
- `secureStorage.js` usa almacenamiento seguro nativo y localStorage en web. No hay evidencia suficiente para afirmar XSS; mantener sanitización y CSP y probar el plugin en APK.
- La ingesta utiliza una clave compartida y acepta `device_id` del cuerpo. Quien tenga esa clave puede enviar otro identificador; antes de ampliar despliegues conviene credencial por estación vinculada a identidad en servidor. Es un riesgo de arquitectura condicionado a posesión de la clave, no una vulnerabilidad anónima demostrada.
- Cotización recoge nombre, empresa, correo y teléfono sin enlace visible a un aviso de privacidad. La ubicación se guarda localmente y se transmite al proveedor meteorológico mediante servidor al solicitar análisis; explicar esa finalidad. Esta observación es de transparencia de producto, no un dictamen legal.

No se ejecutaron `npm audit`, pruebas de penetración ni revisión completa de firmware/historial Git; no se declara que las dependencias estén libres de vulnerabilidades.

## 12. Auditoría funcional del dashboard

### Estado de conexión y vigencia

`DashboardView.vue` utiliza `connectionStatus` con hora reactiva cada cinco segundos. Una lectura deja de marcar «Conectado» al superar 30 s; timestamps inválidos/futuros no se consideran frescos. Esto es correcto en esa superficie.

No se utiliza `realtimeConnected` para distinguir canal perdido de estación sin publicar. `navigator.onLine` sólo informa conectividad de red general, no acceso efectivo a Supabase. Al volver online se actualiza el rótulo, pero no hay recarga explícita para recuperar las filas perdidas durante la desconexión. La librería puede reintentar la suscripción; eso no demuestra recuperación del hueco histórico.

`DeviceSwitcher.online` usa 45 s y `Date.now()` en render sin temporizador propio. Una estación puede seguir con punto verde mientras el panel principal la llama desconectada; además, la antigüedad de las métricas no cambia sus badges «Normal/Óptima». Son muestras guardadas, no una evaluación actual garantizada.

En configuración, `DeviceTechnicalStatus` se monta sin prop `connection`, de modo que muestra por defecto «Esperando datos» aunque ya disponga de firmware/señal. La ausencia de batería se presenta como «Sensor no instalado», una conclusión más fuerte que «dato no disponible».

### Lecturas y cambios de estación

`useReadings.load` captura un ID pero no comprueba si sigue activo al resolver la consulta. Si A tarda y B responde primero, A puede reemplazar B. El watcher asíncrono también llama a `subscribe` después de esperar `load`; cambios rápidos pueden crear suscripciones duplicadas o dejar alguna fuera de la referencia de cleanup. Añadir cancelación/versión de solicitud y cerrar canales de forma determinista.

La carga inicial y la suscripción son secuenciales, por lo que hay una ventana entre snapshot y canal. El callback concatena INSERT sin deduplicar ni ordenar por timestamp. Evaluar huecos y duplicados en reconexión con fixtures; no se reprodujeron contra un servidor real.

### Historial y gráficos

`HistoricalDashboard.vue:83` carga al montar. En `:63` sólo filtra si hay `deviceId`; durante la búsqueda inicial de estaciones puede pedir todo lo autorizado por RLS. El watcher sólo recarga si el nuevo ID es verdadero, por lo que al quedar sin estación no limpia explícitamente el historial. Además, cada página de una consulta lee `props.deviceId` vivo: un cambio entre páginas puede mezclar estaciones en la misma colección. Debe capturarse el contexto completo de la petición.

Los períodos no cancelan cargas anteriores ni asocian resultados a un token de petición. El historial no se alimenta del stream de últimas lecturas ni se refresca por intervalo; por tanto no es «en tiempo real», aunque la cabecera del dashboard lo sea. «Hoy» usa medianoche del navegador, una decisión a documentar si la estación está en otra zona horaria.

`SparkChart.vue` ubica X por índice, no por `recorded_at`. Dos muestras separadas por segundos y por horas reciben igual distancia si son consecutivas. El tooltip informa fecha, pero no corrige esa distorsión visual. La línea de referencia no tiene leyenda contextual visible y el eje horizontal carece de etiquetas temporales. Un único punto produce una polyline sin segmento, sin marcador explícito.

El downsampling uniforme a 240 puntos preserva extremos del período, pero puede omitir picos intermedios. Para alertas e interpretación de ruido/aire no debe presentarse como representación completa de máximos. Especificar agregación y conservar extremos por intervalo.

### Datos faltantes, interpretación e IA

Las tarjetas usan `isMeasurement` y muestran «—» para nulos. Las reglas de `environment.js` usan `Number(null)`, que es cero. La reproducción local de cuatro valores nulos devolvió `danger`, calefacción y humidificación. Esa contradicción puede aparecer aunque la tarjeta diga «Sin datos».

El dashboard no muestra AirScore ni una fórmula de salubridad. No se debe rebautizar la clasificación actual como índice. La estimación MQ-135 debe conservar un vocabulario de indicador; las reglas y el asunto de correo «ambiente no saludable» transmiten un grado de certeza mayor que la limitación descrita en pantalla.

`SmartRecommendations.vue:8` guarda `aiTips` y meteorología sin watcher que los invalide al cambiar `reading`/estación. La prioridad del array sobre reglas locales en `:12` conserva recomendaciones antiguas indefinidamente. Tampoco se muestra timestamp de análisis, ID de lectura ni caducidad. Una respuesta de A que llegue después de seleccionar B sigue aceptándose.

El cliente permite «Actualizar con IA» si hay lectura, aunque no verifica sesión. La Edge Function sí exige usuario activo; hay que convertir la discrepancia en un flujo explícito de acceso. WeatherAPI/Groq tienen timeout y fallback local, pero no se verificaron claves, cuotas ni disponibilidad. La región se lee de localStorage al montar y no está vinculada a la estación ni es reactiva a un cambio en otra pantalla.

### Informes, estaciones y alertas

El envío manual usa el ID de la última lectura y el servidor consulta con JWT del usuario, respetando RLS. Es una buena barrera. En demo, el ID es `demo-N`, que el servidor rechaza por no ser UUID; el botón no ofrece una variante de demostración. Sin sesión también falla. Evitar acciones que parecen disponibles pero no se pueden completar.

La configuración de un dispositivo nuevo abre ajustes Wi-Fi y portal local; no asigna `owner_id`. La ingesta crea IDs nuevos sin dueño y la política indica acceso de administrador para no asignados. Conectar Wi-Fi no basta para que el dispositivo aparezca en «Mis estaciones». Falta una etapa verificable de asociación de cuenta, o una explicación del proceso administrativo si ése es el modelo elegido.

Las notificaciones locales sólo se disparan al cambiar de no crítico a crítico y el primer dato se usa para inicializar estado. Esta política evita spam, pero puede ocultar una condición crítica ya existente al iniciar; requiere criterio de producto. El componente sí aclara la limitación con app cerrada. No se probaron permisos ni recepción real.

`useLocalAlerts.js` mantiene configuración activa y una promesa de actualización inteligente a nivel de módulo. El cambio de estación sustituye el objeto reactivo mientras una respuesta meteorológica anterior puede seguir pendiente. Debe vincularse también esa respuesta a estación/región antes de aplicarla. La función `finite` de alertas comparte el problema de conversión de `null` a cero: la corrección de faltantes debe abarcar este módulo, no sólo la tarjeta.

## 13. Benchmark de principios de diseño Apple

Se consultó el índice oficial de [Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines) y su [versión textual](https://developer.apple.com/design/human-interface-guidelines.md). No se inspeccionaron visualmente las versiones actuales de Apple.com, Watch, Health, Home o Weather; la comparación siguiente es conceptual, no una comparación de pantallas actuales.

| Principio de referencia | Situación AirSense | Aplicación original recomendada |
| --- | --- | --- |
| Jerarquía tipográfica y claridad | Buen titular principal; pequeños datos contextuales | Priorizar valor, unidad, vigencia y explicación del sensor. |
| Producto protagonista | Hero audiovisual y dispositivo propio | Una imagen real coherente, con etiqueta de estado del prototipo, antes de claims de precisión. |
| Composición y continuidad | Secciones amplias con contenedores distintos | Definir anchos editoriales y una escala de separación común. |
| Materiales como jerarquía | Blur en numerosas capas | Reservar material translúcido para navegación/controles y dejar lectura de datos sólida. |
| Información comprensible | Recomendaciones y badges | Mostrar incertidumbre, origen y antigüedad con el mismo cuidado que el número principal. |
| Acción directa y feedback | Selectores cuidados; CTA final ausente | Una demo accesible y una participación clara después de conocer el producto. |
| Adaptación y accesibilidad | Breakpoints, teclado y preferencias parciales | Validación con personas, zoom y tecnologías asistivas antes de añadir efectos. |

Health/Weather pueden inspirar el orden «estado → explicación → tendencia», y Home la organización por espacio/dispositivo, sin copiar sus gráficos o iconos ni trasladar su autoridad clínica a sensores sin validación equivalente. La calidad percibida depende de información confiable y comportamiento predecible, además de materiales y fotografía.

## 14. Hallazgos priorizados

Prioridad: P0 bloquea uso o seguridad de forma crítica comprobada; P1 afecta confianza/uso principal; P2 es mejora relevante; P3 es pulido. Esfuerzo bajo: ajuste localizado y verificación; medio: varios componentes/estados; alto: frontend más contrato backend/hardware o investigación. Son estimaciones de alcance, no compromisos de calendario.

Cada entrada incluye evidencia, impacto, solución propuesta y aceptación. Las hipótesis visuales están identificadas como pendientes; no se convierten en errores confirmados.

### P1 — Alto

**A01 · Demo pública y acciones con permisos incompatibles.** Página: dashboard público. Evidencia: `src/router.js:16` sólo exige auth en nativo; políticas de `supabase/migrations/20261104001000_device_ownership.sql` restringen datos a usuarios autorizados; IA/correo llaman `requireUser`. Impacto: el visitante llega a estados vacíos o a funciones que no puede completar. Solución: definir demo pública segura, aislada y etiquetada, o pedir acceso antes de entrar al espacio privado; ajustar CTAs. Esfuerzo: medio. Aceptación: visitante sin cuenta completa una demostración sin acceder a datos privados ni recibir errores de permisos al pulsar acciones ofrecidas. Estado: discrepancia comprobada por código, despliegue pendiente.

**A02 · Historial sin contexto de estación garantizado.** Página: historial. Evidencia: `HistoricalDashboard.vue:48`, `:63`, `:83`; consulta sin ID, watcher no limpia ID vacío y paginación usa prop mutable. Impacto: datos agregados o mezcla de estaciones autorizadas bajo una estación seleccionada. Solución: no consultar sin ID, capturar ID/período, limpiar al perder selección y descartar respuestas antiguas. Esfuerzo: medio. Aceptación: con dos estaciones y latencias invertidas, todos los puntos pertenecen al ID/período actual; sin selección hay cero consultas y cero puntos. Estado: defecto de flujo comprobable; RLS no se considera vulnerada.

**A03 · Carreras de lecturas y suscripciones.** Página: métricas. Evidencia: `src/composables/useReadings.js`, watcher async → `load` → `subscribe` sin invalidación de solicitud. Impacto: lecturas de A visibles en B y posibles canales duplicados. Solución: generación de solicitud/cancelación, contexto capturado y lifecycle de canal único. Esfuerzo: medio. Aceptación: alternar A/B rápidamente con respuestas fuera de orden mantiene sólo el canal y las lecturas de la estación activa.

**A04 · IA persistente de otra lectura/estación.** Componente: `SmartRecommendations.vue:8`, `:12`, `:14`. Evidencia: `aiTips` prevalece sobre reglas y no se invalida al cambiar prop. Impacto: consejos aparentemente actuales que corresponden a otro espacio. Solución: vincular resultado a ID/timestamp/región y cancelar/ignorar respuestas antiguas; indicar vigencia. Esfuerzo: medio. Aceptación: al cambiar estación desaparece el análisis anterior; la respuesta tardía no lo repone y cada análisis identifica su lectura.

**A05 · Nulos clasificados como cero.** Componente: `src/lib/environment.js:8`, `:35`, `:44`. Evidencia: reproducción Node de cuatro nulos → `danger`. Impacto: recomendaciones incorrectas a partir de datos ausentes. Solución: reutilizar una validación consistente de medición en reglas y funciones de servidor. Esfuerzo: bajo/medio. Aceptación: nulos, vacíos y ausentes permanecen «Sin datos»; cero válido sigue siendo cero; no se aconseja modificar el ambiente sin medición suficiente.

**A06 · Vigencia y reconexión incompletas.** Componentes: `DashboardView.vue`, `DeviceSwitcher.vue:13`, `useReadings.js`. Evidencia: criterios 30/45 s, puntos sin reloj y evento online sin recuperación de hueco. Impacto: estados contradictorios y métricas antiguas que parecen actuales. Solución: criterio común y reloj compartido; marcar antigüedad por lectura; recargar después de recuperar canal/red. Esfuerzo: medio. Aceptación: una estación sin nuevas muestras cambia en todas las superficies al mismo tiempo y una desconexión/reconexión recupera el último estado sin duplicados.

**A07 · Credenciales de ingesta compartidas.** Componente: `supabase/functions/ingest-reading/index.ts:24`. Evidencia: una variable de clave y `device_id` independiente en el cuerpo. Impacto: un equipo con esa clave puede suplantar otro ID; limita un despliegue multicliente confiable. Solución: credenciales por dispositivo, asociación server-side y rotación. Esfuerzo: alto. Aceptación: la credencial de A no inserta lecturas de B; revocar A no interrumpe B. Estado: riesgo condicionado a posesión de credencial; no se ejecutó explotación ni se observó fuga de clave.

**A08 · Promesas comerciales sin evidencia suficiente.** Páginas: `ClassicView.vue:7`, `:60`, `GalleryView.vue`. Evidencia: laboratorio, SLA, frecuencia configurable, Enterprise y resultados medibles sin soporte correspondiente en UI/pruebas inspeccionadas. Impacto: expectativas y credibilidad de lanzamiento. Solución: inventario claim → prueba → estado actual; reformular lo no verificable como desarrollo/objetivo cuando corresponda. Esfuerzo: medio. Aceptación: cada afirmación pública tiene evidencia enlazable o wording explícito de limitación/roadmap aprobado por producto.

**A09 · Fotografía y MQ-135 contradicen el relato.** Páginas: dispositivo y galería. Evidencia visual: `airsense-device-detail.png` dice CO2; primera foto de galería no muestra el «ensamblaje» descrito en `GalleryView.vue:7`. Impacto: confusión técnica y pérdida de autenticidad. Solución: corregir representación/captura del display, pies y separación de escenas conceptuales/prototipo confirmado. Esfuerzo: medio. Aceptación: todas las imágenes publicadas tienen descripción fiel, origen documentado y terminología compatible con el sensor real.

**A10 · Diálogos incompletos para teclado.** Componentes: `QuoteModal.vue:76`, lightbox en `GalleryView.vue` y editor en `AdminUsersView.vue`. Evidencia: falta ciclo completo de foco/inert/restauración; admin sin Escape. Impacto: navegación fuera del modal y pérdida de contexto. Solución: patrón de diálogo común con foco inicial, ciclo, cierre y restauración. Esfuerzo: medio. Aceptación: Tab/Shift+Tab permanecen en diálogo, Escape lo cierra cuando corresponde y el foco vuelve al disparador; fondo no interactivo mientras está abierto.

**A11 · Contraste insuficiente en botón de informe.** Componente: `src/styles/dashboard.css`, regla `.email-panel button`; color blanco heredado sobre `#088395`. Evidencia: 4,48:1, texto de 12 px. Impacto: no alcanza 1.4.3 AA para texto normal en esa combinación. Solución: usar un derivado de marca más oscuro o ajustar el color de texto con cálculo. Esfuerzo: bajo. Aceptación: contraste ≥ 4,5:1 en normal/hover/focus/active, conservando identidad.

**A12 · Video automático sin pausa ni alternativa de movimiento reducido.** Página: `ProductView.vue:17`. Evidencia: autoplay/loop sin controls/poster ni lógica de preferencia. Impacto: distracción y riesgo de incumplimiento 2.2.2 si se confirma reproducción prolongada. Solución: control accesible y poster, respetar preferencia y bloqueo de autoplay. Esfuerzo: bajo/medio. Aceptación: se puede pausar por teclado, reducción de movimiento ofrece una presentación estática y el mensaje sigue visible sin reproducción. Estado: carencia comprobada; duración/comportamiento efectivo pendiente.

### P2 — Medio

**A13 · Descarga histórica sin límite y muestreo que puede ocultar picos.** Componente: `HistoricalDashboard.vue:48`. Evidencia: bucle de páginas hasta agotar y reducción posterior. Impacto: latencia/memoria en períodos largos y extremos omitidos. Solución: presupuesto de consulta y agregación temporal preservando extremos. Esfuerzo: alto. Aceptación: «30 días/Todo» tiene tiempo/volumen acotado y una prueba con pico breve conserva su máximo visible o explícitamente informado.

**A14 · Gráficos sin escala temporal real.** Componente: `SparkChart.vue`. Evidencia: X por índice y referencia sin leyenda. Impacto: huecos y frecuencia aparentes incorrectos. Solución: X por timestamp, leyenda, marcador de muestra única y alternativa tabular/resumen. Esfuerzo: medio. Aceptación: un hueco de una hora ocupa más distancia que uno de cinco segundos; línea de referencia y lectura única son comprensibles con teclado y sin color.

**A15 · Recuperación de cuenta mal enlazada.** Componentes: `SiteFooter.vue`, `AuthView.vue:19`. Evidencia: footer lleva al modo nueva contraseña; solicitud vive en `forgotMode` del login. Impacto: bloqueo del recorrido de recuperación. Solución: separar pedir enlace y aplicar contraseña, validar estado de recuperación. Esfuerzo: bajo/medio. Aceptación: desde footer se puede pedir el correo; una visita sin token no afirma identidad validada ni ofrece una operación condenada a fallar.

**A16 · Falta cierre de exposición y encuesta.** Página: `ProductView.vue:38` y `SpacesExperienceSection.vue`. Evidencia: termina tras espacios; búsqueda sin encuesta. Impacto: interés sin una acción medible. Solución: CTA final de demo/participación e Instagram; usar URL de encuesta proporcionada por el equipo, nunca inventarla. Esfuerzo: bajo, dependiente de contenido. Aceptación: después de espacios hay una acción clara y la encuesta real es accesible desde Inicio con nombre comprensible.

**A17 · Estadística sin trazabilidad suficiente.** Componente: `NoiseInsightSection.vue:84`. Evidencia: 72,7 % fijo sin n, fechas o umbral. Impacto: cifra atractiva difícil de defender ante preguntas. Solución: publicar metodología breve y dataset/resumen anonimizado o retirar el porcentaje hasta justificarlo. Esfuerzo: medio. Aceptación: otra persona reproduce el porcentaje a partir de muestra, definición y umbral documentados.

**A18 · Medios pesados y precarga prematura.** Componentes: `DeviceDetailSection.vue:24`, `GalleryView.vue`; recursos públicos. Evidencia: cinco imágenes precargadas al montar y JPEG de hasta 6,46 MB. Impacto: competencia de descarga en Wi-Fi de exposición y móviles. Solución: variantes responsivas, precarga por proximidad y formatos apropiados. Esfuerzo: medio. Aceptación: la galería no descarga originales para miniaturas y las imágenes de características no compiten con hero antes de aproximarse a la sección; medir antes/después.

**A19 · CSS acumulado y tres sistemas parciales.** Archivos: `main.css`, `responsive.css`, `dashboard.css`, estilos scoped. Evidencia: selectores de secciones antiguas y redefiniciones sucesivas. Impacto: regresiones y coste de evolución. Solución: inventario de estilos vivos, tokens de tipografía/espaciado/superficie y reglas por componente. Esfuerzo: alto. Aceptación: cada componente tiene una fuente identificable de estilos y la comparación visual de las rutas no muestra regresiones.

**A20 · Secundarios pequeños y pilas tipográficas divergentes.** Archivos: `main.css:36`, `dashboard.css:11`, reglas de sensor/kicker. Evidencia: 10–11 px y resolución distinta entre SO. Impacto: legibilidad contextual y ruptura de familia. Solución: pila común deliberada y escala que preserve metadatos legibles. Esfuerzo: medio. Aceptación: a 200 % y en 320 px se leen sensor/vigencia/unidad sin truncar ni perder jerarquía; validar Windows e iOS/macOS. Estado: riesgo de diseño, no fallo visual probado.

**A21 · Web y Android mezclados en configuración.** Archivos: `MobileSettingsView.vue:190`, `src/lib/deviceSetup.js`. Evidencia: ajustes Wi-Fi arroja error en web; texto «dentro de la aplicación» aunque portal web abre otra pestaña. Impacto: pasos imposibles o instrucciones falsas para el navegador. Solución: contenido/acciones según plataforma, con alternativa manual correcta. Esfuerzo: medio. Aceptación: desde navegador no se ofrece abrir ajustes nativos como si funcionara; cada instrucción describe lo que hace la plataforma actual.

**A22 · Asociación de estación nueva incompleta.** Archivos: `MobileSettingsView.vue`, `ingest-reading/index.ts`, migración de propiedad. Evidencia: ingesta crea estación sin dueño; UI sólo configura Wi-Fi/ID y renombra. Impacto: equipo conectado que no aparece en la cuenta. Solución: proceso autenticado de asociación seguro o alta administrativa visible. Esfuerzo: alto. Aceptación: un usuario autorizado conecta una estación y ésta aparece en su lista sin editar manualmente producción ni otorgar acceso de otras cuentas.

**A23 · Estado técnico por defecto engañoso.** Archivos: `MobileSettingsView.vue:148`, `DeviceTechnicalStatus.vue`. Evidencia: no se pasa `connection`; batería ausente se llama «Sensor no instalado». Impacto: estación configurada parece pendiente y ausencia de dato se interpreta como ausencia de hardware. Solución: inferir/pasar vigencia y usar copy «No disponible» cuando no se conoce instalación. Esfuerzo: bajo. Aceptación: configuración y dashboard coinciden para el mismo timestamp; batería nula no afirma un diagnóstico de hardware.

**A24 · Cuenta sin accesos de gestión claros.** Archivos: `ProfileView.vue`, `SiteHeader.vue`, `AdminUsersView.vue`. Evidencia: panel sin enlaces directos a ajustes/MFA/admin y header con sólo dos rutas. Impacto: funciones existentes poco descubribles. Solución: navegación contextual según rol/plataforma y salida del desafío MFA ante problemas. Esfuerzo: medio. Aceptación: usuario activo alcanza configuración desde su cuenta y admin alcanza usuarios sin escribir URL; visitante no ve acciones privilegiadas.

**A25 · Metadatos de difusión incompletos.** Archivos: `index.html:8`, `App.vue`. Evidencia: descripción Enterprise fija y sólo título dinámico; sin Open Graph. Impacto: presentación incoherente al compartir. Solución: metadata fiel al posicionamiento y tarjeta social con imagen real. Esfuerzo: bajo/medio. Aceptación: vista previa de enlace muestra nombre, descripción y recurso aprobados; no promete capacidades pendientes.

**A26 · Transparencia de datos personales insuficiente.** Componentes: `QuoteModal.vue`, `SmartRecommendations.vue`, `MobileSettingsView.vue`. Evidencia: formulario de contacto y análisis con región sin aviso visible de finalidad/proveedores. Impacto: menor confianza y decisiones poco informadas. Solución: explicación breve junto a acciones y política accesible validada por responsables. Esfuerzo: medio. Aceptación: antes del envío el usuario puede conocer qué datos se usan, para qué, destinatarios relevantes y canal de consulta.

**A27 · Pruebas insuficientes para afirmar preparación integral.** Archivos: `tests/auth-validation.test.js`, `tests/dashboard-presentation.test.js`. Evidencia: siete pruebas unitarias sin flujo de dispositivos, historial, modal o viewport. Impacto: errores asincrónicos y visuales sobreviven al build correcto. Solución: plan de regresión focalizado en A01–A15 y matriz de sección 9, con backend de prueba. Esfuerzo: medio/alto. Aceptación: evidencia de escenarios de carrera/desconexión/nulos/permisos/teclado y ocho anchos antes de dar aprobación de lanzamiento.

**A33 · Requisitos de contraseña contradictorios.** Archivos: `AuthView.vue:97`, `src/lib/authValidation.js`, `supabase/config.toml`. Evidencia: ayuda visible indica 10 y no menciona símbolo; validación exige 12 y símbolo. Impacto: intentos rechazados aunque el usuario siga las instrucciones. Solución: derivar ayuda y validación de una política común compatible con servidor. Esfuerzo: bajo. Aceptación: ejemplos que cumplen la ayuda pasan la validación local y los que no la cumplen reciben una explicación coherente antes del envío.

**A34 · Umbrales inteligentes locales sin aislamiento de respuesta.** Archivo: `src/composables/useLocalAlerts.js:93`. Evidencia: estado y `smartRefreshPromise` compartidos; la respuesta escribe en `settings` después de un posible cambio de estación. Impacto: aplicar umbrales meteorológicos a un contexto distinto del que los solicitó. Solución: capturar estación/región y verificar vigencia antes de persistir, con solicitudes separadas por contexto. Esfuerzo: medio. Aceptación: una respuesta tardía de A no cambia los umbrales ni el almacenamiento de B; volver a A conserva sólo su configuración.

### P3 — Bajo

**A28 · Selección de espacios sin feedback de espera.** Componente: `SpacesExperienceSection.vue:51`. Evidencia: se espera `prepareImage` antes de cambiar selección; sin indicador pending. Impacto: parece no responder en red lenta. Solución: estado de carga discreto con anuncio accesible. Esfuerzo: bajo. Aceptación: con imagen retrasada el clic confirma recepción sin anunciar como activa una foto aún no cargada.

**A29 · Rotación del carrusel con reducción de movimiento.** Componente: `EnvironmentalProblemsSection.vue:172`, `:181`. Evidencia: el cambio de preferencia revela contenido, pero `isPlaying` queda true. Impacto: contenido cambiante aunque no haya desplazamiento animado. Solución: iniciar detenido bajo esa preferencia y pausar al activarla. Esfuerzo: bajo. Aceptación: con preferencia reduce no avanza solo; el usuario conserva control para reproducirlo.

**A30 · Caché de recursos sin versión.** Archivo: `nginx.conf.template`, `/public/assets`. Evidencia: expiración de 30 días y nombres estables. Impacto: usuarios pueden ver recursos antiguos después de reemplazarlos. Solución: versionar URL/contenido y definir invalidación. Esfuerzo: bajo/medio. Aceptación: reemplazar una imagen en un despliegue controlado entrega la versión nueva sin pedir al usuario borrar caché.

**A31 · Pulido de navegación accesible.** Archivos: `App.vue`, `SiteHeader.vue`, `AdminUsersView.vue`. Evidencia: sin skip link explícito ni gestión de foco de ruta; flechas admin e Instagram con información de destino parcial. Impacto: recorrido menos predecible con teclado/lector. Solución: acceso al main, foco coherente y nombres/destinos explícitos. Esfuerzo: bajo. Aceptación: se puede omitir navegación repetida, identificar páginas anterior/siguiente y anticipar apertura externa. No se declara incumplimiento total de bypass por existir `main`.

**A32 · Espaciado y geometría sin escala editorial común.** Archivos: `SiteFooter.vue`, `DeviceDetailSection.vue`, `SpacesExperienceSection.vue`, hojas globales. Evidencia: contenedores máximos diferentes y radios 14/20/22/24/26/27/32/999. Impacto: posible sensación de piezas independientes y alto coste de ajuste. Solución: definir pocos roles de contenedor/radio y validar excepciones deliberadas. Esfuerzo: medio. Aceptación: especificación breve de tokens y comparación a 1440/1920 que justifique las alineaciones. Estado: recomendación de sistema, no desalineación observada en navegador.

## 15. Plan de mejoras

### Etapa 1 — Correcciones prioritarias

1. Decidir el recorrido público de exposición y las fuentes de demostración: A01. Dependencias: aprobación de producto, permisos y política de datos.
2. Resolver contexto, carreras, nulos y vigencia: A02–A06 y A34. Dependencias: contrato de timestamps/ID y fixtures con dos estaciones. Debe preceder a pulido del dashboard.
3. Cerrar gestión de foco, contraste, video y recuperación: A10–A12, A15 y A33. Dependencias: patrón compartido de diálogo y validación de teclado.
4. Revisar claims, MQ-135, pies y cifra de ruido: A08/A09/A17. Dependencias: evidencia del equipo, metodología y confirmación de origen de imágenes.
5. Completar próxima acción/encuesta: A16. Dependencias: URL y propósito reales de encuesta; demo del paso 1.
6. Definir seguridad de ingesta antes de ampliar equipos: A07. Dependencias: compatibilidad de firmware y rotación planificada; no ejecutar contra producción desde esta auditoría.

Salida de etapa: visitante de exposición entiende qué se mide, puede ver una demostración honesta y completar una acción sin datos incorrectos, callejones de permisos o barreras de teclado conocidas.

### Etapa 2 — Refinamiento premium

1. Consolidar tipografía, anchos, radios y componentes: A19/A20/A32. Depende de resolver flujos de etapa 1 para evitar diseñar estados descartados.
2. Afinar fotografía: derivados de galería, procedencia y consistencia real/conceptual; A09/A18. Depende de inventario visual aprobado.
3. Refinar materiales: reducir blur anidado, comprobar fallbacks y contraste por imagen; depende de tokens y recursos definitivos.
4. Mejorar gráficos y contexto de IA: A04/A14, con timestamps, referencia explicada y resumen accesible. Depende de aislamiento de datos.
5. Separar web/nativo y completar gestión/propiedad: A21–A24. Depende de decisión de alta segura de dispositivos.
6. Mejorar feedback de espacios y preferencias del carrusel: A28/A29. Depende de comprobar comportamiento en red lenta y reducción de movimiento.

Salida de etapa: lenguaje visual consistente, recursos fieles y comportamiento predecible en las rutas públicas y autenticadas, sin perseguir una copia literal de Apple.

### Etapa 3 — Excelencia y optimización

1. Acotar/agregar historial en servidor: A13, preservando extremos. Depende de volumen esperado y significado de cada período.
2. Medir LCP/INP/CLS y priorizar optimizaciones basadas en trazas: A18/A27. Depende de navegador y entorno de staging reproducible.
3. Ejecutar matriz responsive y accesibilidad asistiva: A27/A31. Depende de estados estabilizados y usuarios/cuentas de prueba.
4. Validar caché, headers efectivos, separación de tenants, credenciales por estación y recuperación de sesión: A07/A30. Depende de hosting/firmware y entorno controlado.
5. Completar difusión/privacidad y medición de participación: A25/A26. Depende de identidad editorial y responsables de tratamiento de datos.
6. Probar con visitantes reales la comprensión en cinco segundos y el recorrido de dos minutos hasta demo/encuesta; ajustar narrativa según resultados, sin atribuir resultados anticipados.

Salida de etapa: evidencias de rendimiento, accesibilidad, fidelidad de datos y eficacia del recorrido; criterios de lanzamiento escritos y repetibles.

## 16. Quick wins

Acciones candidatas de bajo esfuerzo, **no implementadas en esta etapa**:

| Acción | Valor | Dependencia/validación |
| --- | --- | --- |
| Corregir destino «Recuperar acceso» | Evita un callejón de recuperación | Distinguir solicitud y cambio de contraseña; A15. |
| Oscurecer el fondo del botón de informe con un derivado de marca | Contraste verificable | Medir estados; A11. |
| Limpiar recomendaciones al cambiar estación | Reduce consejos fuera de contexto | Añadir descarte de respuesta tardía para cerrar A04. |
| Corregir el pie de la primera foto de galería | Mejora autenticidad inmediatamente | Revisar cada foto antes de editar las demás; A09. |
| Cambiar «Sensor no instalado» por un estado de dato desconocido | Evita diagnóstico infundado | Confirmar si el hardware reporta capacidad; A23. |
| Pausar carrusel con movimiento reducido | Respeta preferencia | Conservar pausa/reproducción manual; A29. |
| Mostrar espera al seleccionar espacio | Hace visible el clic en red lenta | Mantener imagen anterior hasta carga; A28. |
| Añadir acceso a configuración desde cuenta | Mejora descubrimiento | Roles y plataforma; A24. |
| Aclarar categoría y variables junto al hero | Comprensión más rápida | Validación de copy y límites del MQ-135; A08. |

La asociación de dispositivos, el historial agregado y las credenciales por estación no son quick wins: requieren diseño y validación de contratos.

## 17. Recomendaciones estratégicas

1. **Definir una promesa central verificable:** un dispositivo que ayuda a conocer condiciones ambientales de espacios cotidianos. Presentar el MQ-135 como indicador estimado y evitar que la marca prometa diagnóstico de salud o precisión no demostrada.
2. **Diferenciar estados del producto:** disponible, demostración, piloto y en desarrollo. IA implementada en código no equivale a servicio operativo, del mismo modo que una escena conceptual no documenta una instalación.
3. **Diseñar para una visita breve:** una idea principal, una prueba visible, una interacción y una acción final. No exigir al visitante interpretar términos corporativos o configurar una cuenta para descubrir el proyecto.
4. **Usar la evidencia real como activo de marca:** fotografías propias fieles, metodología de ensayos, límites de sensores y personas detrás del producto. Un prototipo presentado con precisión transmite más confianza que promesas comerciales sin sustento.
5. **Construir un sistema pequeño:** una pila tipográfica deliberada, roles de color/superficie y escalas de espaciado. Mantener el carácter AirSense; no agregar efectos por semejanza superficial con una marca de referencia.
6. **No lanzar AirScore sin un modelo defendible:** definir variables, validez de sensores, tratamiento de faltantes, incertidumbre, fórmula y pruebas de comprensión antes de convertirlo en promesa.
7. **Medir el resultado correcto:** comprensión del producto, acceso exitoso a demo, participación en encuesta y seguimiento voluntario. Las métricas de conversión se deberán implementar sólo después de definir privacidad y objetivos reales.

## 18. Conclusión

La web comunica una intención de startup tecnológica, y su identidad reciente tiene más personalidad que una plantilla corporativa genérica. Todavía no demuestra de manera uniforme la claridad y confianza esperables de un producto premium: conviven un relato cotidiano cuidado, afirmaciones Enterprise poco respaldadas y estados de datos con fallos de contexto.

Para la exposición, el recorrido es prometedor pero incompleto: atrae, explica y muestra aplicaciones; no garantiza una demostración pública útil ni una acción final de participación. La mejora de mayor valor consiste en hacer ese recorrido fiable, honesto y fácil de completar.

Este diagnóstico queda listo para revisión. La aprobación de mejoras debe referirse a los hallazgos y criterios de aceptación anteriores. No se implementó ninguna corrección como parte de la auditoría.
