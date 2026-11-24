# Contexto del proyecto

## Graphify (prioridad — ahorro de tokens)
- Antes de investigar el proyecto, consultá el grafo Graphify (`graphify-out/graph.json`, `GRAPH_REPORT.md`) si está disponible.
- Identificá archivos, funciones y dependencias por el grafo; no recorras el repositorio entero.
- Leé solo los fragmentos que vayas a modificar. Reutilizá contexto previo; evitá búsquedas repetitivas.
- Tras cambios estructurales, actualizá el grafo solo si Graphify está disponible y es práctico.
- El grafo de 2026-11-21 describe arquitectura/assets; puede estar desactualizado en noches, audio espacial, alcantarilla y recursos externalizados. Fuente de verdad del runtime: `artifacts/Simon_The_Poch/` (`gameplay.js` + `index.html`).

## Arquitectura
- Juego de terror para navegador (HTML/CSS/JS). Runtime actual empaquetado: `Simon_The_Poch/index.html` + `gameplay.js`.
- Recursos en `recursos/` (rutas relativas). Jumpscare por secuencia de 9 fotogramas (~675 ms) en canvas; audios espaciales en `recursos/sonidos/`.
- Cinco noches (`NIGHT_CONFIG` en `gameplay.js`): movimiento, reroute, reacción, doorHold, sewerWeight, flash, ductStep. Progreso en `localStorage` (`simon-five-nights-v1`).
- IA acotada a `ROOM_GRAPH` (11 cámaras). Rutas izquierda (7), derecha (8), alcantarilla (11). Retroceso solo a habitación vecina.
- Defensa: puertas izq/der, rejilla (`gateClosed`, tecla S / botón), flash en CAM 11 (ahuyenta con grito a mantenimiento).
- Cámaras: `CUSTOM_SCENES` vacías vs `CAMERA_SIMON_SCENES`. Audio Web Audio con paneo estéreo y conducto.
- Diseño adaptable oficina/cámaras; menú a pantalla completa con frames en `object-fit: cover`.

## Trabajo y memoria
- Aplicá las reglas globales de eficiencia. Determiná qué versión afecta la solicitud antes de editar.
- Para cambios del juego, verificá flujos: menú/inicio, navegación, puertas, cámaras, energía, audio y noches.
- Actualizá este contexto solo ante cambios duraderos de arquitectura o decisiones; no guardes registros de cada tarea.
