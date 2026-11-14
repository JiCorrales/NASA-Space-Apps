# 05. Módulo de salud de la tripulación

Propuesta del equipo: integrar el monitor de salud como mecánica del juego, no como producto aparte.

**Dato importante:** el enunciado del reto no menciona la salud de la tripulación. Es una decisión del equipo para diferenciarse, no un requisito del reto. [VERIFICADO-ENUNCIADO]

## Peligros del vuelo espacial (NASA HRP)

Fuente: https://www.nasa.gov/hrp/hazards/ [VERIFICADO-NASA, página leída en esta sesión]

1. **Radiación espacial (Space Radiation):** NASA la describe como una de las partes más peligrosas del vuelo espacial.
2. **Aislamiento y confinamiento (Isolation and Confinement):** respuestas conductuales en grupos aislados y confinados en un espacio pequeño durante mucho tiempo.
3. **Distancia de la Tierra (Distance from Earth):** instrucciones, suministros y atención médica son más difíciles de recibir a medida que los astronautas se alejan.
4. **Campos de gravedad (Gravity Fields):** el cuerpo (músculos, huesos, oído interno y órganos) debe adaptarse a distintas gravedades.
5. **Ambientes cerrados y hostiles (Hostile/Closed Environments):** mantener un ecosistema seguro implica controlar temperatura, presión, iluminación, ruido y microbios, y vigilar las respuestas inmunitarias.

Nota de corrección: la versión anterior usaba "Gravedad alterada" y "Ambiente cerrado y hostil". Los nombres oficiales son los de arriba.

## Riesgos relacionados

Los 17 riesgos de NASA están en `09-nasa-hrp-hazards-risks-research.md`. Los que tienen relación más directa con un monitor de salud son:

- Riesgo 3: cambios cardiovasculares.
- Riesgo 7: nutrición inadecuada.
- Riesgo 9: condición cardiorrespiratoria y musculoesquelética reducida.
- Riesgo 11: cambios óseos inducidos por el vuelo.
- Riesgo 12: cambios conductuales y trastornos psiquiátricos.
- Riesgo 14: sueño insuficiente y horarios irregulares.

## Efectos mencionados en la fuente del reto

Cambios inmunológicos, pérdida de densidad ósea, eventos cardiovasculares, nutrición deficiente y condiciones conductuales. [SIN VERIFICAR como lista de la fuente del reto; coincide con los riesgos 1, 3, 7, 11 y 12 de NASA]

## Indicadores de salud propuestos

Presión arterial, frecuencia cardíaca, glucosa en sangre, temperatura corporal, horas de sueño y estado de ánimo. [SIN VERIFICAR como requisito del reto. Es la lista de la fuente de Athlone, no del enunciado.]

Para cada indicador el juego debe tener: valor, rango normal, umbral de alerta y acción recomendada. [DERIVADO]

## Entorno de la misión

El módulo debería funcionar en nave, estación espacial, rover o base lunar o marciana. [SIN VERIFICAR, viene de la fuente de Athlone]

## Reglas de juego propuestas

- **Exposición a radiación:** depende del destino y la duración. Usa la dosis diaria de `07-datos-externos.md` (hoy sin verificar), con blindaje como decisión de diseño. [DERIVADO]
- **Aislamiento:** penalización de ánimo y sueño que crece con la duración de la misión. [DERIVADO, basado en el peligro 2 de NASA]
- **Gravedad alterada:** penalización a huesos y corazón si no hay equipo de ejercicio. [DERIVADO, basado en el peligro 4 de NASA]
- **Equipo de ejercicio:** protege hueso y corazón, pero consume energía y volumen. [DERIVADO]
- **Retardo de comunicación:** el envío de reportes al control terrestre tarda según la distancia. [DERIVADO, ver `07`]
- **Recordatorios:** pedir mediciones o tareas de salud como parte de la rutina. [DERIVADO]

## Guía al jugador

- Accesible para personas con distintos niveles de conocimiento, con explicaciones en lenguaje sencillo. [VERIFICADO-ENUNCIADO]
- Gamificación, gráficos de tendencia y colores de estado para lectura rápida. [SIN VERIFICAR, viene de la fuente de Athlone]

## Pendientes

- [ ] Valores de referencia de cada indicador: [POR DEFINIR, requiere fuente médica].
- [ ] Umbrales de alerta: [POR DEFINIR].
- [ ] Ninguna de estas reglas es consejo médico. Es mecánica de juego.
