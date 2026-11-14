# CubeSat 101 – Conceptos y procesos básicos (NASA CSLI)

> Resumen de [`../pdf/nasa_csli_cubesat_101_508.pdf`](../pdf/nasa_csli_cubesat_101_508.pdf): *CubeSat 101: Basic Concepts and Processes for First-Time CubeSat Developers*, NASA CubeSat Launch Initiative (CSLI), 2017. Guía de todas las fases, desde el ConOps hasta lanzamiento y operación.
> Info CSLI: http://go.nasa.gov/CubeSat_initiative · Especificación CDS: http://www.cubesat.org

## Conceptos básicos
- **Smallsat:** satélite < 300 kg. **CubeSat:** smallsat con forma, tamaño y masa estandarizados → componentes comerciales (COTS) y menor coste.
- **Unidad 1U:** cubo de 10 cm, ~1–1,33 kg (10×10×11 cm). 3U: 10×10×34 cm. Tamaños comunes: 1U, 1.5U, 2U, 3U, 6U (desde 2014, dos 3U lado a lado), 12U.
- Protuberancias permitidas por la CDS: hasta **6,5 mm** desde la superficie.
- **Dispensador:** interfaz entre CubeSat y lanzador; lo protege en el ascenso y lo libera (P-POD de Cal Poly: hasta 3U). Hay dispensadores 6U.
- **CSLI:** NASA paga el lanzamiento (hasta **300.000 $**, típicamente suficiente para un 3U a LEO); el desarrollador paga desarrollo, pruebas, estación terrena, operación y viajes.
- Alrededor de la mitad de las misiones CSLI son científicas (sobre todo clima espacial y ciencias de la Tierra) y el 66 % hacen demostración tecnológica (comunicaciones, propulsión, navegación y control, radiación).

## Fases y duraciones típicas
Un CubeSat puede diseñarse, construirse, probarse y entregarse en 9 meses, pero **lo típico son 18–24 meses**. Entrega al integrador de 4 semanas a 6 meses antes del lanzamiento.

| # | Fase | Duración |
|---|---|---|
| 1 | Desarrollo del concepto | 1–6 meses |
| 2 | Conseguir financiación | 1–12 meses |
| 3 | Revisiones de mérito y viabilidad | 1–2 meses |
| 4 | Diseño del CubeSat | 1–6 meses |
| 5 | Propuesta a la convocatoria CSLI | 3–4 meses |
| 6 | Selección y asignación a un lanzamiento | 1–36 meses |
| 7 | Coordinación de misión | 9–18 meses |
| 8 | Licencias (radio, teledetección) | 4–6 meses |
| 9 | Documentación de vuelo | 10–12 meses |
| 10 | Estación terrena (diseño y pruebas) | 2–12 meses |
| 11 | Fabricación y pruebas | 2–12 meses |
| 12 | Revisión de preparación de misión | medio día |
| 13 | Integración en el dispensador | 1–2 días |
| 14 | Integración dispensador–lanzador | 1 día |
| 15 | Lanzamiento | 1 día |
| 16 | Operaciones | variable, hasta 20 años |

## Costes
No hay precio estándar; depende de complejidad, experiencia del equipo, duración y hardware especial. Partidas típicas: **materiales, mano de obra, pruebas ambientales, viajes** (+ estación terrena). Reservar **≥10 % de margen** del presupuesto. Pruebas ambientales: vibración, *thermal vacuum bakeout*, choque, EMI/EMC.
Financiación: patrocinadores (NSF, NASA ESTO), universidades, Space Grant, crowdfunding (LightSail-2 > 1,24 M$; KickSat), demostraciones tecnológicas para misiones mayores.

## Consejos de diseño (lecciones reales)
- **Mantenerlo simple**; la CDS prohíbe pirotecnia y la **propulsión** pone nerviosos a los proveedores (menos oportunidades de lanzamiento).
- Componentes importantes **accesibles desde el exterior** (algo se romperá en las pruebas).
- **No diseñar al límite del volumen** permitido: "si no cabe, no vuela".
- Mecanismos de despliegue (paneles, antenas) con **doble *burn wire***.
- Usar **componentes con herencia de vuelo** (baterías, antenas, ADCS) → menos riesgo.
- Baterías con certificación **UL**.
- Materiales de **bajo punto de fusión** (aluminio, acero; evitar titanio, tungsteno, tántalo) para que se desintegren en la reentrada.
- **ADCS** (determinación y control de actitud): crítico; apunta paneles al Sol o la cámara a la Tierra.
- Más vale construir varias unidades: **ETU** (unidad de pruebas), **FlatSat** (electrónica en una mesa) y dos de vuelo.
- **Flexibilidad orbital:** cuanto más flexible el requisito de órbita/fecha, más fácil conseguir lanzamiento.

## Comunicaciones y segmento de tierra
- Estación terrena mínima: **radio + antena**; muchos equipos usan equipos de radioaficionado. "Lanzar con una estación terrena inadecuada mata la misión": probarla pronto siguiendo otros satélites.
- Bandas habituales: **437 MHz (70 cm)** para CubeSats y 140 MHz (2 m) donde están los satélites meteorológicos NOAA.
- Licencias: radio por **FCC** (no gubernamental) o **NTIA** (gubernamental); cámara/teledetección por **NOAA**. Sin licencias → se pierde el lanzamiento.
- Seguimiento con **TLE** (Two-Line Elements) publicados por JSpOC en space-track.org; identificar tu satélite tras el lanzamiento puede llevar semanas.

## Opciones de lanzamiento ("mission models")
1. Lanzador contratado por NASA (pasajero secundario de una misión NASA).
2. Rideshare de Operationally Responsive Space (ORS).
3. Rideshare de la NRO.
4. Lanzamiento comercial a través de un broker.
5. **Despliegue desde la ISS** (llega en una nave de carga y los astronautas lo despliegan 1–3 meses después; NanoRacks).
Lanzadores que han llevado CubeSats CSLI (2017): Super Strypi, Minotaur I/IV, Taurus XL, Delta II, Antares, Falcon 9, Atlas V; previstos: Electron, Falcon Heavy, LauncherOne, SLS. El lanzador debe tener margen de prestaciones, ir a tu órbita y admitir dispensadores.

## Documentación y pruebas de certificación
- **ODAR** (evaluación de basura orbital): demostrar que no es un peligro, que **reentrará en un tiempo razonable** y que ninguna pieza grande sobrevive a la reentrada. Herramienta NASA DAS: https://www.orbitaldebris.jsc.nasa.gov/mitigation/das.html
- Otros entregables: encuesta de transmisores, lista de materiales, informe de masas, informe de baterías, verificación dimensional, informe eléctrico, análisis de venteo.
- Pruebas: **Day In The Life (DITL)** (temporizadores, inhibidores, despliegues y primera transmisión tras la separación; después no se puede tocar el software), **vibración/choque**, **thermal vacuum bakeout**.

## Qué nos aporta para el juego
- **Escenario "CubeSat"** ideal para el nivel fácil: unidades U como límite de volumen/masa, presupuesto pequeño, lanzamiento compartido.
- **Duraciones reales** de cada fase → recurso "tiempo".
- **Eventos aleatorios realistas:** fallo en vibración, licencia retrasada, retraso del lanzador, pérdida de contacto, despliegue fallido, identificación del satélite.
- Reglas fáciles de convertir en restricciones: margen ≥10 %, propulsión = menos lanzamientos, herencia de vuelo = menos riesgo, órbita flexible = lanzamiento antes.
