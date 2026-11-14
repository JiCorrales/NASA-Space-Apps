# DSN Telecommunications Link Design Handbook (810-005)

> Web: https://deepspace.jpl.nasa.gov/dsndocs/810-005/ (JPL / Deep Space Network). Descargado el 2026-11-14.
> PDFs: [`../pdf/dsn-810-005/`](../pdf/dsn-810-005/) (10 de los ~30 módulos)

## Qué es
El manual oficial con el que los equipos de misión diseñan sus enlaces de radio con la **Deep Space Network** (antenas de 70 m y 34 m en Goldstone, Madrid y Canberra). Cada módulo describe una parte: antenas, frecuencias, efectos atmosféricos, telemetría, cobertura…

## Módulos descargados
| Archivo | Módulo | Para qué |
|---|---|---|
| `001B.pdf` | 001 – Introducción al manual | Estructura y cómo usarlo |
| `101I.pdf` | 101 – Subred de 70 m | Prestaciones de las antenas más grandes (G/T, potencia de transmisión) |
| `103F.pdf` | 103 – Subred de 34 m HEF | Antenas de 34 m de alta eficiencia |
| `104Q.pdf` | 104 – Estaciones de 34 m BWG | Antenas de 34 m de guía de ondas (las más usadas) |
| `105E.pdf` | 105 – Efectos atmosféricos y ambientales | Pérdidas por lluvia y atmósfera según la banda |
| `201F.pdf` | 201 – Asignación de frecuencias y canales | Bandas S, X y Ka permitidas |
| `206E.pdf` | 206 – Telemetría, información general | Conceptos de telemetría y tasas de datos |
| `207A.pdf` | 207 – Recepción de telemetría en 34 m y 70 m | Rendimiento de recepción y tasas alcanzables |
| `301P.pdf` | 301 – Cobertura y geometría | Visibilidad de las tres estaciones según la distancia |
| `901I.pdf` | 901 – Glosario | Términos |

No se descargaron (no aportan al juego): 106 corona solar, 107 y 108 catálogos de radiofuentes, 202 Doppler, 203 y 214 ranging, 205 comandos, 208 decodificación, 209 radiociencia, 210 Delta-DOR, 211 VLBI, 302 a 305 posicionamiento, calibración, tiempo y pruebas.

## Uso en el juego
- **Presupuesto de enlace simplificado**: la potencia recibida cae con 1/distancia². A la distancia de Marte o Júpiter, una antena mayor (34 m → 70 m) o una banda más alta (X → Ka) permite más datos.
- **Recurso "comunicaciones"**: datos que se pueden bajar = tasa × horas de contacto. La DSN se comparte entre muchas misiones, así que las horas de antena son un recurso limitado.
- **Cobertura**: tres complejos separados unos 120° de longitud permiten contacto casi continuo con naves lejanas (módulo 301).
- Para misiones en LEO se usa la **Near Space Network**, no la DSN: ver el capítulo 11 de [`../03-spacecraft/small-spacecraft-soa-2026.md`](../03-spacecraft/small-spacecraft-soa-2026.md).
