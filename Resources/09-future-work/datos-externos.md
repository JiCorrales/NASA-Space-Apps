# 07. Datos externos (fuera de la lista oficial)

Estas fuentes no aparecen en la lista oficial de recursos. Pueden usarse para dar realismo, pero deben citarse en el proyecto. **Ninguno de los datos numéricos de este archivo está verificado con la fuente original** salvo donde se indica.

## 1. Protones solares de GOES (NOAA SWPC)

- **URL:** https://services.swpc.noaa.gov/json/goes/primary/integral-protons-1-day.json
- **Estado:** [SIN VERIFICAR] no se pudo abrir desde la sesión (no está en la lista permitida).
- **Uso en el juego:** evento de tormenta solar y dosis de radiación en el tránsito.
- **Cómo citarlo:** NOAA Space Weather Prediction Center, datos GOES, protones integrales de un día.

## 2. Dosis de radiación (NASA OSDR RadLab)

- **Sitio:** https://visualization.osdr.nasa.gov/radlab/
- **Estado:** [SIN VERIFICAR] no se pudo abrir. Las cifras que siguen vienen de otro proyecto del evento:

| Escenario | Dosis diaria citada | Origen citado |
|---|---|---|
| Estación espacial (ISS) | 0.73 mSv/día | Tres mediciones citadas por otro proyecto |
| Superficie lunar | 1.37 mSv/día | Chang'E-4, según otro proyecto |
| Tránsito a Marte | 1.8 mSv/día | Curiosity, según otro proyecto |

- **No usar** como datos hasta verificarlas en el sitio de RadLab.

## 3. Retardo de comunicación

| Destino | Retardo de ida | Estado |
|---|---|---|
| Luna | cerca de 1.3 s | [DERIVADO] 384,400 km / 299,792 km/s ≈ 1.28 s |
| Marte | hasta 20 min | [VERIFICADO-NASA] la página de peligro "Distance from Earth" lo menciona como retardo de hasta 20 minutos por trayecto |
| Estación espacial | menos de 1 s | [DERIVADO] |

- Los 4 a 22 minutos que se usaban antes venían de otro proyecto y no están verificados. Usar el dato de NASA (hasta 20 min).

## 4. Distancia y duración a Marte

- **Distancia promedio:** unas 140 millones de millas. [VERIFICADO-NASA, página "Distance from Earth"]
- **Duración de un viaje a Marte:** unos tres años, frente a un viaje lunar de tres días. [VERIFICADO-NASA, misma página]
- **Nota:** la página no da cifra en kilómetros.

## 5. Trayectorias (GMAT, Mission Viz)

- No son datos externos, pero sus resultados deben citarse si se usan.
- Precálculo de órbitas con GMAT, luego guardado en tablas del juego. [DERIVADO]

## Advertencia general

- Revisar el derecho de uso de cada fuente antes de publicarla.
- NASA no respalda los sitios no estadounidenses. Las fuentes de NOAA y de NASA deben cumplir sus propios términos de uso.
