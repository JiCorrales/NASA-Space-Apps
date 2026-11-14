# CubeSat 101: conceptos básicos y procesos para desarrolladores primerizos

**Programa:** NASA CubeSat Launch Initiative (CSLI). Documento producido bajo contrato por el laboratorio CubeSat de Cal Poly (PolySat).
**Copia leída:** https://www.nasa.gov/wp-content/uploads/2017/03/nasa_csli_cubesat_101_508.pdf (213 000 caracteres aprox.). Se leyeron los caracteres 0 a 200 000, en dos partes. Lo que aparece después no se leyó.
**Copia no accesible:** https://www3.nasa.gov/sites/default/files/atoms/files/nasa_csli_cubesat_101_508.pdf (bloqueada por robots.txt).
**Revisado:** 14 de noviembre de 2026.

Etiquetas: [VERIFICADO-NASA] confirmado en la copia leída. [SIN VERIFICAR] no apareció en la parte leída o viene de otra fuente. [DERIVADO] propuesta propia.

---

## 1. Qué es

La guía está escrita para desarrolladores primerizos de CubeSat, sobre todo en instituciones educativas. Explica las fases desde el concepto de operaciones (ConOps) hasta el lanzamiento y la operación. [VERIFICADO-NASA, introducción]

## 2. Tamaños y masas

- **1U:** un cubo de 10 cm, con una masa de alrededor de 1 a 1.33 kg. [VERIFICADO-NASA, §1.1, p. 4]
- **3U:** 10 × 10 × 34 cm. [VERIFICADO-NASA, figura 2, p. 4]
- **6U:** dos 3U lado a lado, el doble de ancho. La guía no da dimensiones ni masa exactas. [VERIFICADO-NASA, §1.2.2, p. 6]
- **1.5U, 2U y 12U:** se mencionan como tamaños populares, sin dimensiones ni masa. [VERIFICADO-NASA, §1.1, p. 4]
- **Satélite pequeño:** menos de 300 kg. [VERIFICADO-NASA, §1.1, p. 4]
- **Protuberancias de 6.5 mm:** la guía solo las da en el checklist del 1U (apéndice C, p. 80). [VERIFICADO-NASA]

### Otras cifras de tamaño [SIN VERIFICAR]

Otras fuentes de la NASA dan 1U de 10 × 10 × 10 cm, 2U de 10 × 10 × 20 cm y 3U de 10 × 10 × 30 cm, con la envolvente de despliegue incluida. Para el diseño usar las de la guía oficial.

### Masas máximas en un borrador [SIN VERIFICAR]

Una tabla de un artículo de 2016 sobre basura espacial da masas máximas tomadas de un borrador del estándar: 1U 2.0 kg, 1.5U 3.0 kg, 2U 4.0 kg, 3U 6.0 kg, 6U 12.0 kg, 12U 24.0 kg.

**Conflicto:** la guía da 1 a 1.33 kg para el 1U. El borrador da 2.0 kg como máximo. Son fuentes distintas. Para el juego, usar la guía para la masa típica y el borrador solo como límite, y marcarlo como decisión de diseño. [DERIVADO]

## 3. Dispensadores y lanzadores

### Dispensadores
- **P-POD (3U):** desarrollado en Cal Poly San Luis Obispo. Contiene hasta 3U en cualquier combinación, se atornilla al lanzador y abre su puerta con una señal eléctrica. [VERIFICADO-NASA, §1.2.1, p. 5]
- **Dispensadores 6U:** introducidos en 2014. Aceptan la mayoría de las configuraciones, por ejemplo una 6U o seis 1U. [VERIFICADO-NASA, §1.2.2, p. 6]
- El cliente de lanzamiento normalmente elige el dispensador, no el equipo del CubeSat. [VERIFICADO-NASA, §1.2, p. 5]
- **Despliegue desde la ISS:** NanoRacks es la única organización comercial que puede desplegar CubeSats desde la ISS. Los CubeSats se integran en dispensadores en tierra y viajan en una nave de carga presurizada. Los astronautas los despliegan entre 1 y 3 meses después de llegar. [VERIFICADO-NASA, §3.5, p. 39]
- **NPSCul-Lite (ocho P-POD de 3U):** [SIN VERIFICAR]

### Lanzadores
- **Usados hasta 2017:** Super Strypi, Minotaur I, Minotaur IV, Taurus XL, Delta II, Antares, Falcon 9 y Atlas V. [VERIFICADO-NASA, figura 7, p. 8]
- **Planeados en 2017:** Electron, Falcon 9 Heavy, LauncherOne y SLS. [VERIFICADO-NASA, figura 7, p. 8]
- **Criterios de selección** (margen de rendimiento, órbita deseada, aceptación del dispensador): [SIN VERIFICAR en esta sesión]
- **Advertencia:** la lista es de 2017. Costos y capacidades actuales deben buscarse en fuentes actualizadas.

## 4. Cronograma

- **Desarrollo más rápido posible:** 9 meses. **Típico:** 18 a 24 meses. [VERIFICADO-NASA, p. 9]

| Fase | Duración | Estado |
|---|---|---|
| 1. Desarrollo del concepto | 1 a 6 meses (p. 9–11) | [VERIFICADO-NASA] |
| 2. Búsqueda de financiamiento | 1 a 12 meses (p. 11) | [VERIFICADO-NASA] |
| 3. Revisiones de mérito y factibilidad | 1 a 2 meses (p. 14) | [VERIFICADO-NASA] |
| 4. Diseño del CubeSat | 1 a 6 meses (p. 15) | [VERIFICADO-NASA] |
| 5. Desarrollo y envío de propuesta | 3 a 4 meses (p. 17) | [VERIFICADO-NASA] |
| 6. Selección y asignación al manifiesto | 1 a 36 meses (p. 18) | [VERIFICADO-NASA] |
| 7. Coordinación de la misión | 9 a 18 meses (p. 19) | [VERIFICADO-NASA] |
| 8. Licencias regulatorias | 4 a 6 meses (p. 20) | [VERIFICADO-NASA] |
| 9. Documentación de vuelo | 10 a 12 meses (p. 21) | [VERIFICADO-NASA] |
| 10. Diseño y pruebas de estación terrena | 2 a 12 meses (p. 22) | [VERIFICADO-NASA] |
| 11. Fabricación y pruebas de hardware | 2 a 12 meses (p. 23) | [VERIFICADO-NASA] |
| 12. Revisión de preparación para la misión | Medio día (p. 25) | [VERIFICADO-NASA] |
| 13. Integración CubeSat-dispensador | 1 o 2 días (conflicto interno: 2 días en un encabezado, 1 día en la lista) | [VERIFICADO-NASA] |
| 14. Integración dispensador-lanzador | 1 día (p. 27) | [VERIFICADO-NASA] |
| 15. Lanzamiento | 1 día (p. 28) | [VERIFICADO-NASA] |
| 16. Operaciones de la misión | Hasta 20 años (p. 29) | [VERIFICADO-NASA] |

- **Entrega antes del lanzamiento:** de 4 semanas a 6 meses, según el proveedor. [SIN VERIFICAR]
- **Calendario de propuestas** (convocatoria en agosto, propuestas en noviembre, selección entre 12 y 16 semanas después): [SIN VERIFICAR]

## 5. Modelos de misión (formas de lanzar) [SIN VERIFICAR]

Según una lectura anterior: lanzador procurado por NASA, viaje compartido de ORS, viaje compartido de NRO, servicio comercial a través de un intermediario, y despliegue desde la ISS. La guía describe en detalle los primeros tres.

## 6. Costos

- **Cubierto por NASA:** costo de lanzamiento hasta $300,000, típicamente suficiente para un 3U a órbita baja. [VERIFICADO-NASA, §2.2, p. 11]
- **Cubierto por el equipo:** materiales, mano de obra, pruebas, estación terrena, viajes a revisiones y entrega. [VERIFICADO-NASA, §2.2, p. 11]
- **Reserva:** al menos 10% del presupuesto para eventos inesperados. [VERIFICADO-NASA, §2.2, p. 13]
- **Ejemplo de LightSail-2 (más de $1.24 millones por crowdfunding):** [SIN VERIFICAR]

## 7. Licencias

- **Radio:** NTIA para satélites operados por el gobierno de EE. UU.; FCC para satélites no federales. [VERIFICADO-NASA, §2.8, pp. 20]
- **Sensor remoto (imager):** los CubeSats no gubernamentales de EE. UU. con cámara deben contactar a NOAA. La FCC no completa la licencia de radio hasta ver la de NOAA. [VERIFICADO-NASA, §2.8, pp. 20–21]
- **Plazo:** presentar lo antes posible, preferiblemente dentro de los 30 días posteriores al manifiesto, o antes. [VERIFICADO-NASA, §2.8, p. 20]
- **Riesgo:** sin licencias antes de la entrega final, el satélite puede ser retirado del manifiesto. Hay una caja de advertencia sobre un caso en que el CubeSat se integró sin licencia FCC aprobada. [VERIFICADO-NASA, §2.8, pp. 20–21]

## 8. Pruebas

- **Vibración:** obligatoria en todos los lanzamientos. El ICD especifica niveles y duración. Se verifica sin daños con inspección visual y barridos sinusoidales antes y después. [VERIFICADO-NASA, §6.9.2, pp. 60–63]
- **Vacío térmico (horneado):** requerido en casi todas las misiones. Los ciclos de vacío térmico son internos y opcionales, y no reemplazan el horneado. [VERIFICADO-NASA, §6.9.3, pp. 60–63]
- **Choque, EMI/EMC y carga estática:** en algunos casos. [SIN VERIFICAR]
- **Día en la vida (DITL):** requerida, para mostrar que los inhibidores eléctricos y los temporizadores funcionan. [VERIFICADO-NASA, §2.11, p. 24]
- **Después de las pruebas ambientales:** no se pueden hacer cambios físicos al hardware. [VERIFICADO-NASA, §6.9.2]
- **ETU y FlatSat:** una ETU es igual a la unidad de vuelo pero no se lanza; un FlatSat incluye todos los componentes excepto la estructura. [VERIFICADO-NASA, apéndice B, p. 67]
- **Dos unidades de vuelo y una ETU y un FlatSat como recomendación:** [SIN VERIFICAR; el texto leído no la da]
- **Documentación de pruebas al integrador:** [SIN VERIFICAR]

## 9. Revisiones

Plantilla de la revisión de preparación, presentación preliminar y asistencia presencial obligatoria: [SIN VERIFICAR]

## 10. Comunicaciones y estación terrena

- Componentes básicos: radio y antena. Los componentes de radioaficionado son comunes. [SIN VERIFICAR]
- Lanzar con una estación terrena inadecuada es una falla grave. [SIN VERIFICAR]
- **Bandas de práctica 437 MHz y 140 MHz:** no aparecen en la sección 5.1. Solo dice que los satélites de radioaficionado usan bandas del servicio correspondiente y necesitan coordinación con IARU. [VERIFICADO-NASA, §5.1, pp. 45–46, pero no las frecuencias]

## 11. Órbita, vida útil y desorbitación [SIN VERIFICAR en la copia leída]

La parte leída de la guía trae la sección de desorbitación (ODAR, documento de cumplimiento de basura espacial, §6.1, pp. 54–55). **No trae** la regla de 25 años, ni el límite de 100 objetos-años, ni la guía de altitud. Esas cifras venían de otras fuentes de la NASA. Verificarlas antes de usarlas.

## 12. Estándar de diseño (CDS) [SIN VERIFICAR]

- El CubeSat Design Specification fue creado por Cal Poly y Stanford como plantilla estandarizada.
- La revisión 13 limita la energía química total a 100 Wh. Es el límite de equipaje de mano de la FAA para baterías de litio recargables.
- El CDS prohíbe pirotecnia.

## 13. Fallas comunes [SIN VERIFICAR]

La lista de modos de falla de la versión anterior venía de una lectura anterior. En la copia leída hoy no aparece. Antes de usarla, revisar el resto del documento.

## 14. Uso propuesto en el juego [DERIVADO]

- **Formatos:** 1U, 3U y 6U como opciones de nave, con masa y volumen.
- **Presupuesto:** $300,000 de lanzamiento cubiertos por NASA, con reserva de 10%.
- **Cronograma:** las fases de la sección 4 como barra de tiempo.
- **Eventos aleatorios:** fallas de la sección 13 cuando se verifiquen.
- **Desorbitación:** regla a confirmar antes de usarla como restricción.
- **Batería:** límite de 100 Wh, cuando se confirme.

## 15. Pendientes

- [ ] Leer los caracteres 200 000 a 212 299 de la copia.
- [ ] Confirmar la lista de modos de falla.
- [ ] Confirmar regla de 25 años y límite de 100 objetos-años en una fuente de NASA.
- [ ] Confirmar la discrepancia de masa del 1U (1 a 1.33 kg frente a 2.0 kg del borrador).
- [ ] Confirmar la discrepancia de dimensiones del 1U (10 cm, según la guía; otras fuentes de NASA también dan 10 cm).
- [ ] Confirmar la lista de lanzadores y costos con fuentes actuales.

## 16. Cómo citar

NASA CubeSat Launch Initiative. CubeSat 101: Basic Concepts and Processes for First-Time CubeSat Developers. Revisión de octubre de 2017 [SIN VERIFICAR: fecha de una versión anterior]. https://www.nasa.gov/wp-content/uploads/2017/03/nasa_csli_cubesat_101_508.pdf
