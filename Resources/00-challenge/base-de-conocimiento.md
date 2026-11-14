# Space Mission Design Game: base de conocimiento

Reto: **Space Mission Design Game** (NASA Space Apps Challenge 2026)
Idea del equipo: juego de diseño y operación de misiones espaciales, con el monitor de salud de la tripulación como mecánica integrada.
Última revisión: 14 de noviembre de 2026

## Cómo leer estos archivos

Cada dato lleva una etiqueta de estado:

- **[VERIFICADO-NASA]**: leído en una página o PDF oficial de NASA en la revisión del 14 de noviembre de 2026.
- **[VERIFICADO-ENUNCIADO]**: viene del enunciado que entregó el equipo.
- **[VERIFICADO-GUÍA]**: leído en las guías de envío o de jueceo de spaceappschallenge.org. Las fechas de esas guías son de 2024 y 2025.
- **[SIN VERIFICAR]**: no se pudo abrir la fuente, viene de un tercero (por ejemplo, Athlone), o viene de una lectura anterior que no se reconfirmó.
- **[DERIVADO]**: cálculo o propuesta propia a partir de datos verificados. Revisarlo antes de presentarlo.
- **[POR DEFINIR]**: valor que el equipo debe decidir. No hay fuente que lo fije.

Ningún dato marcado como [SIN VERIFICAR] debe presentarse como dato de NASA en la demo o en la documentación.

## Índice

| Archivo | Contenido |
|---|---|
| `reto.md` | Objetivo, consideraciones, criterios de jueceo, premios, fechas y reglas de citación |
| `recursos-nasa.md` | Los 9 recursos del reto y el estado de cada uno |
| `../08-game-design/fases-mision.md` | Ciclo de vida de una misión y duración de cada fase de un CubeSat |
| `../08-game-design/reglas-diseno.md` | Decisiones del juego: nave, dispensador, lanzador, órbita, presupuesto, licencias, tiempo y pruebas |
| `../09-future-work/modulo-salud.md` | Peligros de NASA, riesgos relacionados y reglas del monitor de salud |
| `../07-simulation-and-events/eventos-aleatorios.md` | Mazo de eventos (sin verificar contra la guía completa) |
| `../09-future-work/datos-externos.md` | Datos fuera de la lista oficial (NOAA, NASA OSDR) y distancias verificadas |
| `referencias.md` | Bibliografía con enlaces y estado de acceso |
| `pendientes.md` | Lo que no se pudo confirmar y debe verificarse antes de presentarlo |
| investigacion/ | Investigación completa por fuente, con su propio estado |
| fuentes/ | Fichas cortas anteriores. Obsoletas: no usar. Contienen datos sin verificar; ver investigacion/ |

## Uso recomendado

1. Lean `reto.md` y `referencias.md` antes de programar.
2. Usen `../08-game-design/reglas-diseno.md` como especificación de la mecánica.
3. Verifiquen cada elemento de `pendientes.md` antes de presentarlo como dato.
4. Citen todo lo que venga de `../07-simulation-and-events/eventos-aleatorios.md`, `../09-future-work/datos-externos.md` o de los archivos de investigación en el campo "References".
