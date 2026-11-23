# Graph Report - simon v2  (2026-11-21)

## Corpus Check
- Corpus is ~6,508 words - fits in a single context window. You may not need a graph.

## Summary
- 262 nodes · 432 edges · 18 communities (12 shown, 6 thin omitted)
- Extraction: 77% EXTRACTED · 23% INFERRED · 0% AMBIGUOUS · INFERRED: 101 edges (avg confidence: 0.9)
- Token cost: unavailable. Host-agent usage was not exposed; cost.json zero counters are placeholders, not a claim of zero usage.

## Community Hubs (Navigation)
- Packaged Game Runtime
- Prototype Game Runtime
- Right Door Animation
- Left Door Animation
- Horror Artwork and Menus
- Right Turn and Preloading
- Left Turn Animation
- Camera and Door Controls
- Directional Navigation Artwork
- Menu Hover Audio
- Game Setup Instructions
- Animated Menu Playback
- Packaged Menu Frame Callbacks
- Prototype Menu Frame Callbacks
- Office Pan Animation
- Pointer Driven Office Pan
- Packaged SVG Image Helper
- Prototype SVG Image Helper

## God Nodes (most connected - your core abstractions)
1. `update` - 16 edges
2. `changeLook` - 15 edges
3. `tick` - 13 edges
4. `togglePhotoDoor` - 12 edges
5. `playNewGameIntro` - 11 edges
6. `Giro Izquierda` - 11 edges
7. `Giro Derecha` - 11 edges
8. `tick` - 11 edges
9. `update` - 11 edges
10. `reset` - 10 edges

## Surprising Connections (you probably didn't know these)
- `tick` --semantically_similar_to--> `tick`  [INFERRED] [semantically similar]
  simon v2.html → Simon the poch por ahora final/Simon_The_Poch/index.html
- `playNewGameIntro` --semantically_similar_to--> `playNewGameIntro`  [INFERRED] [semantically similar]
  simon v2.html → Simon the poch por ahora final/Simon_The_Poch/index.html
- `Right door: barely lowered` --semantically_similar_to--> `Right door: fully open`  [INFERRED] [semantically similar]
  7_fotogramas_puerta_derecha/01_apenas_cerrada.png → Animacion de las puertas/Original/puerta_derecha_oficina_1671x941.png
- `startSimonMenuFilm` --semantically_similar_to--> `startSimonMenuFilm`  [INFERRED] [semantically similar]
  simon v2.html → Simon the poch por ahora final/Simon_The_Poch/index.html
- `Right door: fully open` --semantically_similar_to--> `Simon security office artwork`  [INFERRED] [semantically similar]
  Animacion de las puertas/Original/puerta_derecha_oficina_1671x941.png → Imagenes/Oficina sombría de Simon.png

## Import Cycles
- None detected.

## Communities (18 total, 6 thin omitted)

### Community 0 - "Packaged Game Runtime"
Cohesion: 0.10
Nodes (39): abortPhotoAnimations, act, Packaged game application, Embedded map and character art, beep, beginGameUnderIntro, blocked, clearIntroTimers (+31 more)

### Community 1 - "Prototype Game Runtime"
Cohesion: 0.11
Nodes (34): act, Root game application, Embedded map and character art, beep, beginGameUnderIntro, blocked, clearIntroTimers, closeIntro (+26 more)

### Community 2 - "Right Door Animation"
Cohesion: 0.11
Nodes (30): Right door: barely lowered, Right doorway red control, Right door: partly lowered, Right doorway red control, Right door: lowered further, Right doorway red control, Right door: half closed, Right doorway red control (+22 more)

### Community 3 - "Left Door Animation"
Cohesion: 0.11
Nodes (30): Left door: barely lowered, Left doorway red control, Left door: partly lowered, Left doorway red control, Left door: lowered further, Left doorway red control, Left door: half closed, Left doorway red control (+22 more)

### Community 4 - "Horror Artwork and Menus"
Cohesion: 0.08
Nodes (29): Right door: fully open, Right doorway red control, Left door: fully open, Left doorway red control, Simon The Poch stitched animatronic, Simon The Poch menu: downcast closed-mouth, Simon The Poch menu choices, Simon The Poch stitched animatronic (+21 more)

### Community 5 - "Right Turn and Preloading"
Cohesion: 0.14
Nodes (25): Thirty four local animation PNGs, Giro Derecha, loadAnimationFrame, preloadAnimationFrames, Right turn frame 01, Office and right hallway view, Right turn image sequence, Right turn frame 02 (+17 more)

### Community 6 - "Left Turn Animation"
Cohesion: 0.17
Nodes (22): Giro Izquierda, Left turn frame 01, Left turn image sequence, Office and left hallway view, Left turn frame 02, Office and left hallway view, Left turn frame 03, Office and left hallway view (+14 more)

### Community 7 - "Camera and Door Controls"
Cohesion: 0.19
Nodes (21): animating, blockMotionControls, Camera movement state, changeLook, directionalTarget, Door closure frame arrays, Independent door animation states, Cosine frame easing (+13 more)

### Community 8 - "Directional Navigation Artwork"
Cohesion: 0.27
Nodes (10): Right navigation button, Right pointing chevron, Directional navigation artwork, Left navigation button, Left pointing chevron, updateNavigation, Right navigation arrow artwork, Right directional control (+2 more)

### Community 9 - "Menu Hover Audio"
Cohesion: 0.40
Nodes (5): bindMenuHover, Embedded menu selection audio, playMenuHover, prepareMenuHover, stopMenuHover

### Community 10 - "Game Setup Instructions"
Cohesion: 0.40
Nodes (5): Ten turns and seven door frames per side, Simon The Poch browser game, Center and side navigation, Independent door persistence, Relative local resources

### Community 11 - "Animated Menu Playback"
Cohesion: 0.50
Nodes (4): Three embedded menu animation frames, startSimonMenuFilm, Three embedded menu animation frames, startSimonMenuFilm

## Knowledge Gaps
- **113 isolated node(s):** `Relative local resources`, `Center and side navigation`, `Independent door persistence`, `Ten turns and seven door frames per side`, `svgImage` (+108 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 113 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **6 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Thirty four local animation PNGs` connect `Right Turn and Preloading` to `Right Door Animation`, `Left Door Animation`, `Left Turn Animation`?**
  _High betweenness centrality (0.164) - this node is a cross-community bridge._
- **What connects `Relative local resources`, `Center and side navigation`, `Independent door persistence` to the rest of the system?**
  _113 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Packaged Game Runtime` be split into smaller, more focused modules?**
  _Cohesion score 0.09581646423751687 - nodes in this community are weakly interconnected._
- **Why does `Puerta Izquierda` connect `Left Door Animation` to `Right Turn and Preloading`?**
  _High betweenness centrality (0.094) - this node is a cross-community bridge._
- **Should `Prototype Game Runtime` be split into smaller, more focused modules?**
  _Cohesion score 0.11051693404634581 - nodes in this community are weakly interconnected._
- **Why does `Puerta Derecha` connect `Right Door Animation` to `Right Turn and Preloading`?**
  _High betweenness centrality (0.094) - this node is a cross-community bridge._
- **Should `Right Door Animation` be split into smaller, more focused modules?**
  _Cohesion score 0.10804597701149425 - nodes in this community are weakly interconnected._
## Coverage and Integrity Notes
- All 3 text/HTML files and 63 image files were inspected. HTML inline JavaScript was mapped semantically; the detector classified HTML as documents, so no AST extraction was performed.
- Embedded base64 image/audio payloads were not decoded; nodes for these describe their explicit roles in the HTML. All four frames of the standalone GIF were inspected.
- Five audio files could not be transcribed because faster-whisper is unavailable: audio-Create-a-terrifying-dark-and-mysterious-ambient-so.wav, botones menu.mp3, button-click.mp3, fnaf-2-static.mp3, fnaf-ambiente.mp3 (all under Musica y botones). Their audible contents are not mapped.
- The ZIP archive was outside the detected supported corpus and was not unpacked.
- SHA-256 comparisons established 16 pairs of byte-identical images; these links are marked EXTRACTED.
- Graph health warning: 433 extracted relationships became 432 undirected links. Reciprocal calls between initMenuLoop (L696) and syncMenuMusic (L722) in the packaged index.html collapse into one link. No dangling endpoints, missing endpoints or self-loops were found. This default undirected map does not preserve call direction.
- No game execution or behavioral tests were performed; this is a source and asset map.
- Benchmark estimates: 17,466 naive tokens, 1,752 average query tokens, 10.0x reduction. Benchmark corpus size (13,100 words) differs from initial detection (6,508 words); these are tool estimates, not measured savings.
