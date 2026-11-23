# Contexto del proyecto

## Arquitectura
- Juego de terror para navegador, con HTML, CSS y JavaScript integrados en cada página.
- `simon v2.html`: prototipo raíz, con controles de puertas más simples.
- `Simon the poch por ahora final/Simon_The_Poch/index.html`: versión empaquetada, con animaciones de puertas y giros y audio Web Audio. `LEEME.txt` contiene instrucciones de uso.
- La versión empaquetada carga 34 PNG de animación desde `recursos/puertas/` y `recursos/giros/`; `recursos/botones/` contiene controles gráficos. También hay recursos incrustados en base64.
- Las carpetas de imágenes, animaciones y música de la raíz contienen recursos de trabajo; algunos duplican archivos empaquetados. No borres duplicados ni sincronices ambas versiones sin que la tarea lo requiera.

- Las cámaras alternan entre `CUSTOM_SCENES` (vacías) y `CAMERA_SIMON_SCENES` (`recursos/camaras_con_simon/`) según `room()`, sin sprite superpuesto. La PC es el único acceso para abrirlas. CAM 11 usa flash para reiniciar la ruta de Simón; no hay cierre de rejilla y las rutas centrales terminan en CAM 11.

## Trabajo y memoria
- Aplicá las reglas globales de eficiencia. Determiná qué versión afecta la solicitud antes de editar; preservá rutas relativas y recursos incrustados, sin cargar sus enormes payloads si no son necesarios.
- El mapa está en `graphify-out/graph.json`, con `GRAPH_REPORT.md` y `graph.html`. Consultalo si está vigente y resulta útil; verificá los detalles en el HTML. No lo regeneres por mensaje.
- El mapa se extrajo semánticamente: no garantiza dirección de llamadas ni cubre el contenido audible de los archivos de audio. No reemplaza la validación del comportamiento.
- Para cambios del juego, verificá los flujos afectados y relacionados: menú/inicio, navegación, puertas, cámaras, energía y audio, según corresponda.
- Actualizá este contexto solo ante cambios duraderos de arquitectura o decisiones; no guardes registros de cada tarea ni dupliques las reglas globales.
