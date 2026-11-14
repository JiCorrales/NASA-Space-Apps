# Síntesis: información clave para el reto "Juego de diseño de misiones espaciales"

> Recopilación de `Enunciado.md` + todos los recursos de `Resources.txt` (detalle en cada archivo de esta carpeta). Fecha: 2026-11-14.

## 1. Qué pide el reto (resumen de `Enunciado.md`)
Un **juego interactivo** para **diseñar, gestionar y simular una misión espacial completa**, mostrando cómo cada decisión afecta al resto (compromisos de ingeniería).

**El jugador debería poder:** definir el objetivo → establecer requisitos → diseñar la nave → elegir instrumentos → elegir lanzador y órbita → gestionar presupuesto, masa, potencia, comunicaciones, datos y vida útil.

**Una solución sólida incluiría:**
- [ ] Juego/simulación funcional con interfaz clara
- [ ] Sistema de configuración de misiones
- [ ] Gestión de recursos (masa, potencia, presupuesto, datos, comunicaciones, tiempo)
- [ ] Modo individual **y** colaborativo de **hasta 4 jugadores** (roles + decisión colectiva + negociación)
- [ ] Simulación y evaluación de la misión con retroalimentación que explique **por qué** tuvo éxito o fracasó
- [ ] Puntuación que premie éxito, valor científico, uso eficiente de recursos y buena colaboración

**Extras sugeridos:** varios escenarios y dificultades, componentes simples/avanzados, eventos aleatorios, visualización de la nave, panel de control en tiempo real, clasificaciones, informe final, guardar/compartir/comparar diseños, modo competitivo entre equipos, modo libre, comprobación masa/órbita vs. lanzador, explicaciones y tutoriales para todos los niveles.

## 2. Mapa de recursos
| Recurso | Archivo(s) | Para qué sirve en el juego |
|---|---|---|
| Design and Develop Science Missions | [`fuentes/01`](fuentes/01-design-and-develop-science-missions.md), `pdf/250323-design-and-develop-science-mission.pdf` | Flujo del juego y los **4 segmentos** (lanzamiento, espacial, tierra, usuario); "empezar por el final" |
| GMAT | [`fuentes/02`](fuentes/02-gmat.md) | Precalcular órbitas/Δv realistas offline; validar el modelo simplificado |
| Concept Maturity Levels (JPL) | [`fuentes/03`](fuentes/03-concept-maturity-levels.md), `pdf/13-3547_A1b.pdf` | **Rondas/niveles de madurez**, semáforo verde/amarillo/rojo, iteración, ciencia vs. coste vs. riesgo |
| Mission Design Lab (Goddard) | [`fuentes/04`](fuentes/04-mission-design-lab.md) | Fases de estudio reales y **disciplinas → roles** de jugadores; MEL como hoja de diseño |
| NASA Mission Viz | [`fuentes/05`](fuentes/05-mission-viz.md), `pdf/mission-viz/` | Visualización web de órbitas (Three.js/X3DOM), elementos keplerianos, ideas de línea de tiempo |
| Juego "Build It Yourself" (Webb) | [`fuentes/06`](fuentes/06-webb-build-it-yourself.md), `pdf/webb-build-it-yourself/` | **Referente directo**: objetivo → longitud de onda → instrumento → óptica, compatibilidades, niveles, comparación con misiones reales |
| CubeSat 101 | [`fuentes/07`](fuentes/07-cubesat-101.md), `pdf/nasa_csli_cubesat_101_508.pdf` | Escenario CubeSat, **duraciones de fases**, costes, lecciones aprendidas → eventos aleatorios |
| Reto VR Space Apps 2023 | [`fuentes/08`](fuentes/08-space-apps-2023-vr-challenge.md) | Patrón técnico de visualización y lista de librerías/recursos |
| CSA – juegos digitales | [`fuentes/09`](fuentes/09-csa-digital-games.md) | Confirma que no hay juegos de *diseño* de misiones; inspiración para operaciones/uso de datos |

### Fuentes adicionales de NASA para los números del juego
| Necesidad del juego | Ficha | Datos |
|---|---|---|
| Catálogo de componentes (potencia, propulsión, ADCS, comunicaciones, aviónica, térmico, estructuras) | [`fuentes/10`](fuentes/10-small-spacecraft-soa-2026.md) | `pdf/small-spacecraft-soa-2026.pdf` |
| Capacidad de lanzadores por órbita | [`fuentes/11`](fuentes/11-lsp-launch-vehicle-performance.md) | `datos/lsp-launch-vehicle-performance.csv` |
| Δv, duración y ventanas a planetas y asteroides | [`fuentes/12`](fuentes/12-trajectory-browser.md) | `datos/trajectory-browser-transfers-2026-2036.csv` |
| Comunicaciones de espacio profundo | [`fuentes/13`](fuentes/13-dsn-link-design-handbook.md) | `pdf/dsn-810-005/` |
| Método de costes y reservas | [`fuentes/14`](fuentes/14-cost-estimating-handbook.md) | `pdf/nasa-cost-estimating-handbook-v4-main-body.pdf` |
| Fases, revisiones y TRL | [`fuentes/15`](fuentes/15-systems-engineering-handbook.md) | `pdf/nasa-systems-engineering-handbook-rev2.pdf` |
| Misiones reales para comparar y calibrar | [`fuentes/16`](fuentes/16-nssdca-master-catalog.md) | `datos/nssdca-reference-missions.csv` |
| Eventos aleatorios de clima espacial | [`fuentes/17`](fuentes/17-donki-space-weather.md) | `datos/donki/` |
| Fin de vida y basura orbital (regla de 25 años) | [`fuentes/18`](fuentes/18-debris-assessment-software.md) | `pdf/das-3.2-users-guide.pdf` |
| Posiciones de los planetas | [`fuentes/19`](fuentes/19-jpl-horizons.md) | `datos/horizons-elements-2026-11-14.csv` |
| Fallos reales para eventos | [`fuentes/20`](fuentes/20-nasa-lessons-learned-llis.md) | (búsqueda web) |
| Resultados científicos de exoplanetas | [`fuentes/21`](fuentes/21-exoplanet-archive.md) | `datos/exoplanet-archive-pscomppars.csv` |
| Modelos 3D, texturas e imágenes | [`fuentes/22`](fuentes/22-recursos-visuales.md) | (sin descargar) |
| Precios de lanzamiento, $/kg, presupuesto por clase de misión, modelo de costes | [`fuentes/23`](fuentes/23-costes-nasa.md) | `datos/nasa-launch-service-awards.csv`, `datos/launch-cost-per-kg-leo-ntrs.csv`, `datos/nasa-mission-cost-caps.csv`, `pdf/costes/` |
| Catálogo de instrumentos (masa, potencia, tasa de datos) | [`fuentes/24`](fuentes/24-instrumentos-wmo-oscar.md) | `datos/wmo-oscar-nasa-instruments.csv` |

## 3. Conceptos que el juego debería enseñar (con su fuente)
1. **Los requisitos científicos dirigen el diseño** (Webb game; "empezar por el final" en el webinar NASA).
2. **Una misión = 4 segmentos** que deben funcionar juntos (webinar NASA).
3. **Proceso:** necesidad/objetivos → concepto (ConOps) → requisitos verificables → diseño → construir y verificar → operar.
4. **Madurez e iteración:** servilleta → viabilidad → espacio de compromisos → diseño puntual; volver atrás es normal (CML).
5. **Márgenes y reservas**: un diseño al límite no es un buen diseño (CML 4, CubeSat 101: ≥10 % de reserva de presupuesto; "no diseñes al límite del volumen").
6. **Cada disciplina estima masa, potencia y tasa de datos** (MDL) → son los recursos del juego.
7. **No hay una única solución**: distintas combinaciones llegan al mismo objetivo (Enunciado; Webb game con varias misiones reales por objetivo).
8. **Riesgo**: herencia de vuelo reduce riesgo; tecnología nueva (p. ej. espejo segmentado) cuesta más y es más arriesgada (CubeSat 101, Webb game).
9. **El segmento de tierra importa**: sin estación terrena probada la misión fracasa (CubeSat 101).

## 4. Cadena de compromisos (trade-offs) a modelar
```
Objetivo científico
  └─► longitud de onda / tipo de medida ─► instrumento(s) ─► óptica/apertura
        └─► masa ▲  potencia ▲  datos ▲  coste ▲  riesgo ▲ (tecnología nueva)
              ├─ masa ─► lanzador más grande (coste ▲) / menos combustible (vida útil ▼)
              ├─ potencia ─► más paneles + baterías (masa ▲, coste ▲) ; eclipses según órbita
              ├─ datos ─► más almacenamiento + antena/transmisor mejor o más estaciones (masa, potencia, coste ▲)
              └─ órbita ─► cobertura, iluminación, contactos con tierra, radiación, Δv, vida útil (arrastre)
Lanzador ─► capacidad a esa órbita (kg) vs. masa total ; coste ; fecha/flexibilidad
Tiempo ─► fases de desarrollo (CubeSat 101: 18–24 meses típicos) ; vida operativa
```

## 5. Propuesta de estructura de juego derivada de los recursos
- **Fases (inspiradas en MDL + CML):**
  1. *Office Hours / Servilleta (CML 1):* elegir escenario y objetivo científico; clase de coste.
  2. *Viabilidad (CML 2):* fijar requisitos cuantitativos (qué datos, cuánta cobertura, cuánta vida útil).
  3. *Trade Study (CML 3):* comparar 2–3 alternativas (órbita, lanzador, instrumentos) en un "árbol de compromisos".
  4. *Point Design (CML 4):* hoja tipo **MEL** con masa/potencia/coste/datos por subsistema y márgenes; checklist verde/amarillo/rojo con umbral ~80 % para "lanzar".
  5. *Construir y verificar:* eventos de pruebas (vibración, térmico, DITL), licencias, retrasos.
  6. *Lanzamiento y operación:* simulación temporal con eventos aleatorios y panel de recursos.
  7. *Informe post-misión:* ciencia obtenida, recursos usados, por qué falló/funcionó, **misión real comparable** (como el juego Webb).
- **Roles para 4 jugadores (a partir de disciplinas MDL):**
  - *Científico/a principal (PI):* objetivos, instrumentos, valor científico, segmento de usuario.
  - *Ingeniería de la nave:* estructura, potencia, térmico, ADCS, propulsión.
  - *Comunicaciones y operaciones:* antena, estaciones de tierra, datos, operaciones.
  - *Ingeniería de sistemas / jefe de proyecto:* lanzador, órbita, presupuesto, calendario, riesgo, márgenes.
  Cada rol ve sus restricciones; algunas decisiones requieren consenso (negociar presupuesto de masa/potencia).
- **Escenarios/dificultad:** CubeSat educativo en LEO (fácil) → observatorio de Tierra en SSO → telescopio en L2 → misión a la Luna/Marte (difícil).
- **Puntuación (inspirada en CML/Team X):** valor científico × probabilidad de éxito − sobrecoste, con bonus por márgenes sanos y cumplimiento de requisitos.

## 6. Datos de referencia para balancear el juego
> ⚠️ Esta sección **no** procede de los recursos del reto: son valores aproximados de conocimiento general de ingeniería espacial, para arrancar. Verificar o precalcular con GMAT antes de presentarlos como datos reales.
> **Ya hay datos de NASA que sustituyen buena parte de esta sección**: capacidad de lanzadores ([`fuentes/11`](fuentes/11-lsp-launch-vehicle-performance.md)), Δv interplanetarios ([`fuentes/12`](fuentes/12-trajectory-browser.md)), elementos orbitales ([`fuentes/19`](fuentes/19-jpl-horizons.md)) y regla de reentrada ([`fuentes/18`](fuentes/18-debris-assessment-software.md)). Usar esos en el juego.

**Órbitas**
| Órbita | Altitud aprox. | Periodo | Características para el juego |
|---|---|---|---|
| LEO (tipo ISS) | 400 km, incl. 51,6° | ~92 min | Barata de alcanzar, alta resolución, contactos cortos (~5–10 min por pase), **arrastre → vida útil corta** sin propulsión |
| SSO (heliosíncrona) | 500–800 km, incl. ~97–98° | ~95–100 min | Misma hora solar en cada pase: ideal para observación de la Tierra |
| MEO (tipo GPS) | ~20.200 km | ~12 h | Navegación; más radiación |
| GEO | 35.786 km, ecuatorial | ~23 h 56 min | Fija sobre un punto: contacto continuo con una estación, cubre ~1/3 de la Tierra; cara de alcanzar |
| Sol–Tierra L2 (tipo JWST) | ~1,5 millones km | — | Entorno frío y estable para telescopios IR; requiere antenas de espacio profundo |
| Luna | ~384.400 km | — | Transferencia de ~3–5 días |
| Marte | — | — | Ventanas de lanzamiento cada ~26 meses; viaje de ~6–9 meses |

**Δv aproximados:** superficie→LEO ~9,3–10 km/s · LEO→GTO ~2,4 km/s · GTO→GEO ~1,5 km/s · LEO→inyección translunar ~3,1 km/s · LEO→transferencia a Marte ~3,6 km/s. Ecuación del cohete: Δv = Isp · g₀ · ln(m₀/m_f).

**Potencia:** constante solar ~1361 W/m² a 1 UA (cae con 1/d²: Marte ~590 W/m²); eficiencia de paneles ~25–30 %; en LEO hasta ~35 min de eclipse por órbita → baterías.

**Comunicaciones/datos:** UHF de CubeSat ~9,6 kbps · banda S ~1–2 Mbps · banda X decenas–cientos de Mbps. Volumen descargable ≈ tasa × tiempo de contacto × nº de pases. La señal cae con 1/d² (espacio profundo necesita antenas grandes, p. ej. Deep Space Network).

**Márgenes típicos en diseño conceptual:** masa y potencia 20–30 %; presupuesto con reserva (CubeSat 101 recomienda ≥10 %).

**Fin de vida en LEO:** la guía histórica era reentrar en ≤25 años; desde 2022 la FCC exige ≤5 años tras el fin de misión para satélites licenciados por ella.

## 7. Huecos / pendientes
- La **matriz CML** y la **checklist CML 4** del paper JPL son imágenes; revisar el PDF a mano si se quieren usar sus 24 filas exactas.
- Licencia de **NASA Mission Viz** sin confirmar (no reutilizar código hasta verificarla).
- No se descargaron los binarios de GMAT (322 MB); enlaces en [`fuentes/02-gmat.md`](fuentes/02-gmat.md).
- `Resources.txt` avisa de que **pueden añadirse más recursos** antes de la hackatón: revisar la pestaña "Recursos".
