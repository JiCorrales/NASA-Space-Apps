# Debris Assessment Software (DAS) 3.2 – NASA Orbital Debris Program Office

> Guía de usuario: [`../pdf/das-3.2-users-guide.pdf`](../pdf/das-3.2-users-guide.pdf) (2,1 MB).
> Página: https://orbitaldebris.jsc.nasa.gov/mitigation/debris-assessment-software.html · El programa (para Windows) **no** se descargó; solo su guía.

## Qué es
Programa de NASA para comprobar si una misión cumple las normas de **mitigación de basura orbital** (NASA-STD-8719.14). Es el que CubeSat 101 recomienda para el informe ODAR ([`07-cubesat-101.md`](07-cubesat-101.md)).

## Requisitos clave (texto de la guía)
**Requisito 4.3-1, desechos que pasan por LEO:**
- a. Todo desecho de 1 mm o más liberado durante el despliegue, la operación o la retirada debe tener una **vida orbital máxima de 25 años** desde que se libera.
- b. El producto total objetos × tiempo debe ser **menor de 100 objetos-año** por etapa superior o por nave.
- Los desechos con perigeo **por debajo de 600 km** suelen reentrar en menos de 25 años; el requisito afecta sobre todo a perigeos **por encima de 700 km**, donde los objetos pueden durar cientos de años.

Esto resuelve dos pendientes de `../../09-pendientes.md`: la regla de 25 años y el límite de 100 objetos-año, ahora con fuente NASA.

**Nota:** desde 2022 la FCC exige 5 años para los satélites que licencia (conocimiento general, no viene de esta guía).

## Qué calcula DAS
Vida orbital, Δv necesario para reentrar en un tiempo dado (sección 4.3.1), riesgo de colisión con desechos, supervivencia de piezas en la reentrada y riesgo en tierra.

## Uso en el juego
- **Restricción de fin de vida**: en órbitas altas de LEO (> 700 km) el jugador debe añadir propulsión o una vela de arrastre para cumplir los 25 años; por debajo de 600 km se cumple sola.
- Compromiso: más altitud da más vida útil de la misión, pero obliga a planificar la retirada.
