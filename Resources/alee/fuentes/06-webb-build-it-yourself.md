# "Build It Yourself" – juego de aprendizaje sobre telescopios (NASA Webb)

> Fuente: https://science.nasa.gov/mission/webb/game-build-it-yourself/ (actualizada 2025-12-17) y las transcripciones oficiales del juego descargadas en [`../pdf/webb-build-it-yourself/`](../pdf/webb-build-it-yourself/):
> `gametext.pdf` (flujo y textos), `level1-science.pdf`, `level2-science.pdf`, `level3-science.pdf` (resultados por combinación).
> Juego relacionado: "Scope It Out" – https://science.nasa.gov/mission/webb/game-scope-it-out/

## Ficha
- Aprobado por la revisión de productos educativos de NASA en 2013 (como "Build It Yourself: Satellite!").
- Autora: Maggie Masetti · Programador: Mike Wojnarowski · Arte: Susan Lin.
- **Mensaje educativo:** *los requisitos científicos determinan el diseño e ingeniería de la misión*.
- Pantalla mínima 1024×768 (no pensado para móvil). Sin funciones de accesibilidad: se ofrece la transcripción completa.

## Flujo de juego
1. **Menú:** Level 1 / Level 2 / Level 3 y botón "Need a hint". Se muestran siluetas de naves misteriosas que se **desbloquean** al construir misiones parecidas.
2. **Ciencia:** pasar el ratón sobre cada objetivo muestra una explicación; se elige uno.
3. **Longitud de onda:** solo aparecen las compatibles con el objetivo elegido (las inviables salen en gris), cada una con una explicación de *por qué* sirve para ese objetivo.
4. **Instrumento:** según la longitud de onda.
5. **Óptica:** según instrumento, longitud de onda y tamaño de misión (si hay varios instrumentos, óptica para cada uno).
6. **Lanzamiento:** animación de cohete (más grande cuanto mayor es el nivel).
7. **Resultado:** dibujo de un **satélite real parecido**, **datos reales** que tu instrumento podría haber obtenido y texto con el resultado científico. Se puede ir atrás/adelante y cambiar opciones hasta lanzar.

## Niveles
| Nivel | Tamaño | Reglas |
|---|---|---|
| 1 | Pequeño | 1 objetivo → 1 longitud de onda → 1 instrumento → óptica |
| 2 | Mediano | Hasta 2 objetivos y 2 longitudes de onda (pensar si son compatibles); cada longitud de onda necesita ≥1 instrumento; óptica por instrumento. Puede dar varios resultados. |
| 3 | Grande | Hasta 4 objetivos, 3 longitudes de onda (una por objetivo), 3 instrumentos (uno por longitud de onda); añade **espejo segmentado tipo Webb** para óptico/IR. |

## Árbol de opciones y compatibilidades
### Objetivos científicos → longitudes de onda permitidas
| Objetivo | Longitudes de onda |
|---|---|
| Agujeros negros | Rayos X, Gamma, Óptico, UV |
| Formación estelar | Óptico, IR, UV |
| Universo temprano | Óptico, Microondas, IR |
| Galaxias | Óptico, IR, Rayos X, Gamma, UV |
| Exoplanetas | Óptico, IR |

Ideas clave de las explicaciones: la materia que cae a un agujero negro se calienta y emite UV/X/gamma; el **IR atraviesa el polvo** donde nacen estrellas y planetas; la luz de galaxias lejanas está **desplazada al rojo** (→ IR); el fondo cósmico de **microondas** muestra el universo pocos cientos de miles de años tras el Big Bang; los exoplanetas se detectan en óptico por **tránsitos** (bajada periódica de brillo).

### Longitud de onda → instrumentos
| Longitud de onda | Instrumentos |
|---|---|
| Óptico, IR, UV | Cámara, Espectrómetro |
| Rayos X | Cámara, Espectrómetro, **Contador proporcional** (no necesita óptica) |
| Gamma | **Centelleador** (scintillator) |
| Microondas | **Radiómetro** |

- *Cámara:* como una digital; los datos se almacenan a bordo y se transmiten a Tierra.
- *Espectrómetro:* separa la luz en un espectro → temperatura, masa, composición y movimiento.
- *Radiómetro:* mide el flujo radiante; diferencias de temperatura en el fondo de microondas.
- *Contador proporcional:* gas (xenón) que da un pulso eléctrico por cada fotón X; energía, tiempo, posición.
- *Centelleador:* cristales que convierten gamma en luz visible recogida por fotomultiplicadores.

### Instrumento/longitud de onda/tamaño → óptica
| Óptica | Cuándo |
|---|---|
| Espejos segmentados/anidados de rayos X (incidencia rasante) | X con instrumento que la requiera. Pequeña/mediana: láminas finas, baratas y ligeras. Grande: vidrio, más preciso pero pesado (→ caro de lanzar) |
| Espejo segmentado (óptico/IR/UV) | Solo misión grande: más caro que un espejo pequeño y requiere tecnología nueva (p. ej. berilio), pero más barato que lanzar un espejo gigante monolítico |
| Espejo primario único | Cualquier tamaño, de microondas a UV; cuanto más grande, más pesado y caro |
| Sin óptica | Gamma (no se pueden enfocar) y X para espectroscopía/tiempos con contador proporcional |

## Resultados: combinación → misión real comparable
**Nivel 1:** RXTE (BH-X-contador) · Swift XRT/UVOT (BH-X/óptico; galaxias óptico/UV) · CGRO/COMPTEL (gamma) · GALEX (UV) · COBE (microondas; IR espectrómetro universo temprano) · ISO (IR) · WISE (exoplanetas IR cámara) · TESS (exoplanetas óptico cámara) · Suzaku (galaxias X) · ASCA (galaxias X contador) · VLT de ESO (óptico espectrómetro).

**Nivel 2:** Chandra (X; BH óptico cámara) · Swift (UV cámara) · FUSE (UV espectrómetro) · COBE (microondas) · GALEX (BH UV cámara) · Fermi (gamma) · Gemini GMOS (BH óptico espectrómetro) · Spitzer (IR) · WISE (galaxias IR cámara) · VLT (óptico espectrómetro).

**Nivel 3:** Chandra (X anidado) · **Hubble** (espejo primario único; óptico/UV/IR) · **James Webb** (espejo segmentado) · Fermi (gamma) · Herschel (IR espectrómetro/cámara con primario único) · WMAP (microondas).

## Pistas de las naves misteriosas
Usar un centelleador · espejo grande segmentado pero en una longitud de onda mucho más energética que el óptico · telescopio grande parecido a JWST · más pequeño que JWST pero también en IR · telescopio X sin óptica que "ve" agujeros negros · radiación del universo temprano (y no es IR) · telescopio grande parecido a Hubble.

## Qué nos aporta para el juego
- **Patrón probado de "objetivo → requisitos → hardware"** con opciones deshabilitadas cuando son incompatibles y explicación del *porqué*.
- **Dificultad por niveles** (más objetivos = más instrumentos y más complejidad).
- **Comparar el diseño del jugador con misiones reales** y **coleccionables desbloqueables**.
- Lo que le falta (y que el reto pide): presupuesto, masa, potencia, datos/comunicaciones, órbita y lanzador, simulación y colaboración.
