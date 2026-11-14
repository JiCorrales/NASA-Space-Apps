# Costes: precios de lanzamiento, coste por kg, topes por clase de misión y modelo PCEC

> Recopilado el 2026-11-14 de fuentes de NASA. Cubre el pendiente de **precios** que no daban ni el State-of-the-Art ni la web de LSP.
> Datos: [`data/nasa-launch-service-awards.csv`](data/nasa-launch-service-awards.csv) · [`data/launch-cost-per-kg-leo-ntrs.csv`](data/launch-cost-per-kg-leo-ntrs.csv) · [`data/nasa-mission-cost-caps.csv`](data/nasa-mission-cost-caps.csv)
> PDFs: [`../pdf/costes/`](../pdf/costes/)

## 1. Precio real de lanzamientos de NASA (notas de prensa oficiales)
Cada nota de NASA que adjudica un lanzamiento da el **coste total para NASA**. Normalmente incluye el servicio de lanzamiento y otros costes asociados (procesado de la nave, integración, seguimiento). Las cifras se copiaron literalmente de cada nota.

| Misión | Adjudicación | Lanzador | Coste total (M$) |
|---|---|---|---|
| TESS | 2014-12 | Falcon 9 | 87 |
| SWOT | 2016-11 | Falcon 9 | 112 |
| Landsat 9 | 2017-10 | Atlas V | 153,8 |
| DART | 2019-04 | Falcon 9 | 69 |
| PACE | 2020-02 | Falcon 9 | 80,4 |
| Psyche | 2020-02 | Falcon Heavy | 117 |
| IMAP | 2020-09 | Falcon 9 | 109,4 |
| SPHEREx | 2021-02 | Falcon 9 | 98,8 |
| Europa Clipper | 2021-07 | Falcon Heavy | 178 (solo el contrato) |
| Roman | 2022-07 | Falcon Heavy | 255 |
| Sentinel-6B | 2022-12 | Falcon 9 | 94 |
| JPSS-4 | 2024-07 | Falcon 9 | 112,7 |
| NEO Surveyor | 2025-02 | Falcon 9 | 100 |

**Para el juego:** un Falcon 9 para NASA cuesta en la práctica **~69–113 M$** y un Falcon Heavy **~117–255 M$**, con todo incluido. El alcance de cada cifra varía según la nota (columna `cost_scope` del CSV).

**Lanzadores pequeños (VADR):** NASA contrata CubeSats y SmallSats de clase D (Electron, etc.) con el contrato VADR (máximo total de 300 M$ entre todas las órdenes), pero **no publica el precio de cada orden**. Para CubeSats sigue valiendo la referencia de CubeSat 101: NASA cubre hasta **300.000 $** por un 3U a LEO ([`../03-spacecraft/cubesat-101.md`](../03-spacecraft/cubesat-101.md)).

## 2. Coste por kg a LEO (NASA Ames, 2018)
Jones, H. W., *The Recent Large Reduction in Space Launch Cost*, ICES-2018-81, NASA Ames (NTRS 20200001093). PDF: `../pdf/costes/ntrs-20200001093-launch-cost-reduction.pdf`.
- Tabla A1: coste a LEO de 36 lanzadores, de 1957 a 2018, en **miles de $ de 2018 por kg**.
- Media 1970–2000: **18,5 k$/kg** (rango típico de 10 a 32). Transbordador: 61,7 k$/kg. **Falcon 9: 2,7 k$/kg; Falcon Heavy: 1,4 k$/kg**.
- Llevar carga a la ISS es más caro: transbordador 105,8 k$/kg, Falcon 9 con Dragon unos 25 k$/kg.

Útil para un modelo simple de **coste de lanzamiento = masa × $/kg** según la era o el tipo de lanzador.

## 3. Topes de coste por clase de misión (presupuesto del jugador)
NASA limita lo que puede costar una misión según su programa. Fuente principal: tabla de la presentación **MOCET 2024** de NASA (`../pdf/costes/mocet-2024-mission-cost-caps.pdf`), que cita cada convocatoria (AO).

| Clase | Tope (M$) | Año del dólar | ¿Incluye operaciones? | ¿Incluye lanzador? | Ejemplo |
|---|---|---|---|---|---|
| Pioneers | 20 | — | — | — | (SmallSats astrofísica) |
| Explorer Mission of Opportunity | 35–70 | FY22 | sí | no | GOLD |
| Earth Venture-Instrument | 37–42 | FY24 | sí | no | — |
| SMEX Astrofísica | 145 → **190 (AO 2026)** | FY19 → FY26 | sí | no | NuSTAR |
| SMEX Heliofísica | 165 | FY17 | sí | ver nota | IBEX |
| Earth Venture-Mission | 190 | FY22 | sí | — | CYGNSS |
| MIDEX Heliofísica | 250 | FY19 | sí | no | ICON |
| MIDEX Astrofísica | 300 | FY22 | sí | no | TESS |
| Mars Scout | 475 | FY06 | sí | sí | Phoenix |
| Discovery | 500 | FY19 | no | no | Lucy |
| New Frontiers 4 / 5 | 850 / 900 (fases A–D) | FY15 / FY22 | no | no | — |

Notas: "sí" o "no" interpreta las abreviaturas de la tabla ("Ops", "No Ops", "No LV"). Para SMEX Heliofísica la tabla pone "LV" sin más detalle. Los topes son del momento de cada convocatoria y en dólares de su año.

**Para el juego:** los escenarios pueden usar estas clases como **nivel de dificultad y de presupuesto**: Pioneers (20 M$, nave pequeña) → SMEX → MIDEX → Discovery → New Frontiers. Como en las convocatorias reales, el lanzador suele ir **aparte** del tope.

## 4. Modelo de costes de NASA: PCEC
**Project Cost Estimating Capability**, la herramienta paramétrica oficial de NASA para estimar el coste de naves (sucesora de NAFCOM).
- Complemento de Excel, **gratuito para el público** a través del NASA Software Catalog, con algunas restricciones de exportación. Versión 2.4 (mayo de 2025). **No se descargó**: hay que solicitarlo en el catálogo (https://www.nasa.gov/ocfo/ppc-corner/pcec-project-cost-estimating-capability).
- Sus ecuaciones (CER) se ajustan con datos de 42 misiones recientes (repositorio CADRe) y son del tipo potencia, por ejemplo:
  `Coste_no_recurrente(control de actitud) = 0,1 × masa_unidad_kg^0,42 × entorno_operativo^0,75 × entorno_radiación^0,19 × tiempo_diseño^0,26 × (año_lanzamiento − 1960)^1,56`
  (ejemplo de `../pdf/costes/ntrs-20160013375-pcec-spacecraft-estimating.pdf`; unidades según PCEC).
- Hay 15 CER por subsistema (no recurrente y recurrente) y 6 para gestión, ingeniería de sistemas, garantía de misión, integración y pruebas, y operaciones.
- PDFs: presentación de PCEC v2.4 (`pcec-v2-4-overview.pdf`), artículo de NTRS sobre las CER de naves y el apéndice E del CEH, con el catálogo de modelos de coste de NASA (`ceh-appendix-e-models-tools.pdf`).

**Para el juego:** justifica un modelo propio simplificado del tipo **coste_subsistema = a × masa^b**, con exponentes menores que 1 (economías de escala) y un factor por tecnología nueva. Hay que presentarlo como "inspirado en PCEC", no como valores de PCEC.

## Lo que sigue sin cubrir
- **Precio de cada componente** (cuánto cuesta un panel o una radio concretos): no lo publica NASA. Usar el modelo paramétrico o rangos [POR DEFINIR].
- Precio de cada lanzamiento VADR (lanzadores pequeños).
