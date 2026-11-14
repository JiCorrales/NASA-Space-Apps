# "Build It Yourself" – juego de aprendizaje sobre telescopios (NASA Webb)

> Fuente: https://science.nasa.gov/mission/webb/game-build-it-yourself/ (actualizada 2025-12-17) y las transcripciones oficiales del juego descargadas en [`../pdf/webb-build-it-yourself/`](../pdf/webb-build-it-yourself/):
> `gametext.pdf` (flujo y textos), `level1-science.pdf`, `level2-science.pdf`, `level3-science.pdf` (resultados por combinación).
> Juego relacionado: "Scope It Out" – https://science.nasa.gov/mission/webb/game-scope-it-out/

## Ficha
- Aprobado por la revisión de productos educativos de NASA en 2013 (como "Build It Yourself: Satellite!"). **[DISCREPANCIA]**
- Autora: Maggie Masetti · Programador: Mike Wojnarowski · Arte: Susan Lin.
- **Mensaje educativo:** *los requisitos científicos determinan el diseño e ingeniería de la misión*.
- Pantalla mínima 1024×768 (no pensado para móvil). Sin funciones de accesibilidad: se ofrece la transcripción completa.

## Flujo de juego
1. **Menú:** Level 1 / Level 2 / Level 3 y botón "Need a hint". **[DISCREPANCIA]** Se muestran siluetas de naves misteriosas que se **desbloquean** al construir misiones parecidas.
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
| 3 | Grande | Hasta 4 objetivos **[DISCREPANCIA]**, 3 longitudes de onda (una por objetivo), 3 instrumentos (uno por longitud de onda); añade **espejo segmentado tipo Webb** para óptico/IR. |

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

---

## Ficha anterior del equipo (antes Resources/05-juego-webb-build-it-yourself.md, fusionada)

Esta fuente tenía dos fichas. Lo de arriba es la ficha de alee, la más nueva. Lo de abajo es la ficha del equipo, copiada sin cambios salvo el nivel de los títulos, para no perder ningún dato, etiqueta ni pendiente. Título original: "Juego "Build It Yourself: Satellite!" (Telescopio Webb)".

### Discrepancias entre las dos fichas

Cada **[DISCREPANCIA]** de arriba remite a esta lista. No se eligió ninguna versión: confirmar en la fuente.

- **Menú de niveles.** Esta ficha: "Level 1 / Level 2 / Level 3". Ficha del equipo: el menú "dice 'Level 1, Level 3, Level 3'. Falta el nivel 2 y el segundo 'Level 3' probablemente es un error."
- **Objetivos del nivel 3.** Esta ficha: "Hasta 4 objetivos". Ficha del equipo: "4 (según el PDF)". Las dos señalan la misma contradicción de 4 objetivos con 3 longitudes de onda.
- **Ficha e historia.** Esta ficha da como hechos la aprobación de 2013, la autora, el programador, la artista, la pantalla mínima de 1024×768 y la falta de accesibilidad. Ficha del equipo: historia "[SIN VERIFICAR]" y pantalla y accesibilidad en "Otros datos [SIN VERIFICAR]".
- **PDFs de resultados.** Esta ficha usa `level1-science.pdf` a `level3-science.pdf`. Ficha del equipo, pendiente: "Abrir los PDFs de resultados científicos de cada nivel."

**Enlace fuente:** https://science.nasa.gov/mission/webb/game-build-it-yourself/
**Flujo del juego (PDF):** https://science.nasa.gov/wp-content/uploads/2024/03/gametext.pdf
**Revisado:** 14 de noviembre de 2026. Página y PDF de flujo leídos en esta sesión.

Etiquetas: [VERIFICADO-NASA] confirmado en la página o el PDF de flujo. [SIN VERIFICAR] de una lectura anterior o de otra fuente. [DERIVADO] propuesta propia.

---

### 1. Qué es [VERIFICADO-NASA]

Juego educativo de NASA en el que el jugador elige qué estudiará su satélite y luego decide longitudes de onda, instrumentos y sistemas ópticos. NASA lo describe como una forma de enseñar que los requisitos científicos determinan el diseño de una misión espacial.

Historia (autora, año de creación, tecnología Flash, aprobación de 2013, juego hermano "Scope It Out!"): [SIN VERIFICAR]

### 2. Pantallas [VERIFICADO-NASA, PDF de flujo]

1. Pantalla de título, con botón Start.
2. Selección de nivel, con botones de nivel y "Need a hint".
3. Pantalla de ciencia: elegir un objetivo entre agujeros negros, formación estelar, Universo temprano, galaxias y exoplanetas.
4. Pantalla de longitud de onda, según el objetivo.
5. Pantalla de instrumento, por cada longitud de onda.
6. Pantalla de óptica, por cada instrumento cuando aplica.
7. Lanzamiento: animación de cohete y luego resultado científico. Los niveles 2 y 3 muestran un cohete más grande y los resultados se pueden recorrer con flechas.

Navegación: botones anterior y siguiente, botón de menú principal y un cuadro de instrucciones. [VERIFICADO-NASA]

### 3. Reglas por nivel [VERIFICADO-NASA, tabla del PDF de flujo]

| Nivel | Objetivos científicos | Longitudes de onda | Instrumentos | Óptica |
|---|---|---|---|---|
| 1 | 1 (de cinco) | 1 | 1 | 1 por instrumento |
| 2 | Hasta 2 | Hasta 2, compatibles con los objetivos | Al menos 1 por longitud de onda | 1 por instrumento |
| 3 | 4 (según el PDF) | 3 en total, "uno por objetivo" (según el PDF) | 3 en total, uno por longitud de onda | Incluye espejo segmentado como el de Webb |

- Si solo hay un objetivo en el nivel 2, se pueden elegir dos longitudes de onda para ese objetivo. [VERIFICADO-NASA]
- Las opciones que no son compatibles aparecen deshabilitadas. [VERIFICADO-NASA, página]
- Las sombras de la pantalla principal se llenan a medida que se desbloquean misiones comparables (nivel 2) o misiones misteriosas con ilustración (nivel 3). [VERIFICADO-NASA]

### 4. Contradicciones del juego [VERIFICADO-NASA]

- **Nivel 3:** el PDF permite 4 objetivos pero solo 3 longitudes de onda, "una por objetivo". No cuadra. Confirmar con NASA.
- **Menú de niveles:** dice "Level 1, Level 3, Level 3". Falta el nivel 2 y el segundo "Level 3" probablemente es un error.
- **Nivel 1:** la pantalla dice "pick your science goals" (en plural), pero solo permite uno.
- **Nivel 2 y 3:** comparten un solo encabezado aunque sus reglas difieren.

### 5. Pistas [VERIFICADO-NASA, PDF de flujo]

El botón "Need a hint" pide pasar el cursor sobre un satélite desconocido. Hay siete pistas, por ejemplo: requiere un centelleador; tiene un espejo segmentado grande en una energía mayor a la óptica; es un telescopio grande parecido a JWST; es más pequeño que JWST y observa infrarrojo; es un telescopio de rayos X sin óptica que puede detectar agujeros negros; observa radiación de fondo del Universo temprano; es un telescopio grande parecido a Hubble.

### 6. Resultados y puntaje [VERIFICADO-NASA]

- Tras el lanzamiento se muestra la apariencia del satélite y la misión real con datos similares.
- La transcripción enlaza PDFs de las opciones y de los resultados científicos de cada nivel.
- **Sin puntaje.** La página no menciona ningún sistema de puntaje.

### 7. Otros datos [SIN VERIFICAR]

- Retroalimentación al correo de NASA del sitio de Webb.
- Pantalla mínima de 1024 × 768; diseñado para tabletas, laptops y escritorios.
- No tiene funciones integradas de accesibilidad; hay transcripción en PDF.

Estos datos vienen de una lectura anterior y no se reconfirmaron hoy.

### 8. Modelo de mecánica para nuestro juego [DERIVADO]

Cadena de decisiones: **Objetivo → Longitud de onda → Instrumento → Óptica → Resultado**.

Equivalente para el juego de misión:
1. Objetivo de la misión (humedad del suelo, radiación, tormentas solares, clima).
2. Carga útil: el instrumento depende del objetivo.
3. Órbita y lanzador: definen masa y costo.
4. Resultado: comparación con misiones reales.

Reglas para tomar como concepto (no como texto):
- Niveles de complejidad de uno, dos y tres objetivos.
- Opciones deshabilitadas según compatibilidad.
- Pistas al jugador.
- Animación de lanzamiento y pantalla de resultado.

### 9. Limitaciones para nuestro juego [VERIFICADO-NASA, confirmado en la página]

- No tiene puntaje. El reto pide evaluación, así que el juego debe añadir un sistema propio.
- No tiene presupuesto, masa, potencia ni tiempo. Esos elementos son del equipo.
- No tiene salud de tripulación ni eventos aleatorios.

### 10. Pendientes

- [ ] Abrir los PDFs de resultados científicos de cada nivel.
- [ ] Confirmar la contradicción del nivel 3 (4 objetivos frente a 3 longitudes de onda).
- [ ] Confirmar si el "Level 3" repetido es el nivel 2.
- [ ] No copiar textos ni arte del juego.

### 11. Cómo citar

NASA. A Learning Game About Telescopes: Build It Yourself: Satellite! https://science.nasa.gov/mission/webb/game-build-it-yourself/
