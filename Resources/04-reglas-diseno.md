# 04. Reglas de diseño del juego

Cada decisión incluye sus opciones, sus costos y su fuente. Las etiquetas están definidas en `README.md`.

Revisado el 14 de noviembre de 2026 contra la guía CubeSat 101 (copia en nasa.gov, leída en esta sesión) y el enunciado entregado.

## A. Objetivo de la misión

- Elegir una ciencia objetivo. Cada objetivo fija qué instrumentos y longitudes de onda son compatibles. [VERIFICADO-NASA: regla de opciones deshabilitadas en el juego Webb]
- Un objetivo ambicioso exige más masa, potencia, datos y costo. [VERIFICADO-ENUNCIADO: ejemplo del instrumento más capaz]
- Ejemplos de objetivos (humedad del suelo, radiación, tormentas solares): [DERIVADO, son ideas del equipo]

## B. Nave (formato)

| Formato | Dimensiones | Masa | Estado |
|---|---|---|---|
| 1U | 10 × 10 × 10 cm | 1 a 1.33 kg | [VERIFICADO-NASA, CubeSat 101 §1.1] |
| 1.5U, 2U, 12U | No dadas. La guía solo los menciona como tamaños populares | [POR DEFINIR] | [VERIFICADO-NASA, §1.1 sin dimensiones] |
| 3U | 10 × 10 × 34 cm | [POR DEFINIR] | [VERIFICADO-NASA, figura 2] |
| 6U | Dos 3U lado a lado, el doble de ancho. Dimensiones exactas no dadas | [POR DEFINIR] | [VERIFICADO-NASA, §1.2.2] |

- Satélite pequeño: menos de 300 kg. [VERIFICADO-NASA, §1.1]
- Protuberancias de 6.5 mm: la guía solo las da en el checklist del 1U (apéndice C). No usar como regla general para 3U o 6U. [VERIFICADO-NASA, apéndice C]
- Regla de juego: si la nave no cabe en el dispensador, no puede volar. [DERIVADO; la regla de envolvente no se reconfirmó en la lectura de esta sesión]

## C. Dispensador

| Dispensador | Capacidad | Estado |
|---|---|---|
| P-POD (3U) | Hasta 3U en cualquier combinación | [VERIFICADO-NASA, §1.2.1] |
| Dispensador 6U | Configuración flexible, por ejemplo una 6U o seis 1U | [VERIFICADO-NASA, §1.2.2] |
| NPSCul-Lite | Ocho P-POD de 3U | [SIN VERIFICAR] |
| Despliegue desde la ISS | Solo NanoRacks puede desplegar desde la ISS. Los astronautas lo hacen de 1 a 3 meses después de llegar | [VERIFICADO-NASA, §3.5] |

- El cliente de lanzamiento normalmente elige el dispensador, no el equipo del CubeSat. [VERIFICADO-NASA, §1.2]

## D. Lanzador

- Lanzadores usados por CSLI hasta 2017: Super Strypi, Minotaur I, Minotaur IV, Taurus XL, Delta II, Antares, Falcon 9 y Atlas V. [VERIFICADO-NASA, figura 7]
- Planeados en 2017: Electron, Falcon 9 Heavy, LauncherOne y SLS. [VERIFICADO-NASA, figura 7]
- **Advertencia:** la lista es de 2017. Capacidades y costos por lanzador: [POR DEFINIR]. No están en la parte leída de la guía.
- Criterios de selección (margen de rendimiento, órbita, aceptar el dispensador): [SIN VERIFICAR en esta sesión; venían de una lectura anterior].
- Regla de juego: masa y órbita de la nave deben ser compatibles con el lanzador elegido. [VERIFICADO-ENUNCIADO]

## E. Órbita

- Varias órbitas con explicación básica. Afectan cobertura, observación, comunicaciones y tiempo de vida. [VERIFICADO-ENUNCIADO]
- Regla de juego propuesta: órbita baja con mejor cobertura de comunicaciones; órbitas altas con más tiempo de vida, más costo y más retardo. [DERIVADO]
- Regla de 25 años para desorbitar y límite de 100 objetos-años: [SIN VERIFICAR. No aparecen en la parte de CubeSat 101 leída en esta sesión.]

## F. Instrumentos

- Cada instrumento tiene masa, potencia, costo, volumen de datos y valor científico. [VERIFICADO-ENUNCIADO]
- Un instrumento más capaz suma valor científico y también masa, potencia, datos y costo. [VERIFICADO-ENUNCIADO]
- Valores concretos por instrumento: [POR DEFINIR]

## G. Presupuesto

- La NASA cubre el lanzamiento hasta **$300,000**, típicamente suficiente para un 3U a órbita baja. [VERIFICADO-NASA, §2.2]
- El equipo cubre materiales, mano de obra, pruebas, estación terrena, viajes a revisiones y entrega. [VERIFICADO-NASA, §2.2]
- Reserva de **al menos 10%** del presupuesto. [VERIFICADO-NASA, §2.2]
- Ejemplo de LightSail-2 (más de $1.24 millones por crowdfunding): [SIN VERIFICAR]
- Costo de formato, estación e instrumentos: [POR DEFINIR]

## H. Licencias regulatorias

- **Radio:** NTIA para satélites operados por el gobierno de EE. UU.; FCC para satélites no federales. [VERIFICADO-NASA, §2.8]
- **Sensor remoto:** los CubeSats no gubernamentales de EE. UU. con cámara necesitan licencia de NOAA. La FCC no completa la licencia de radio hasta ver la de NOAA. [VERIFICADO-NASA, §2.8]
- **Plazo:** presentar en los 30 días posteriores al manifiesto, o antes. [VERIFICADO-NASA, §2.8]
- **Duración del trámite:** de 4 a 6 meses. [VERIFICADO-NASA, §2.8]
- **Regla de juego:** las licencias deben estar listas antes de la entrega final. Si no, la nave puede ser retirada del manifiesto. [VERIFICADO-NASA, §2.8]

## I. Tiempo

- Desarrollo mínimo: 9 meses. Típico: 18 a 24 meses. [VERIFICADO-NASA, p. 9]
- Duración de cada fase: ver `03-fases-mision.md`.
- Regla de juego propuesta: cada decisión consume semanas o meses del cronograma, y la entrega tardía bloquea el lanzamiento. [DERIVADO; la consecuencia de la entrega tardía sí aparece en la guía, según lectura anterior]

## J. Comunicaciones y estación terrena

- Componentes básicos: una radio y una antena. [SIN VERIFICAR]
- Lanzar con una estación terrena inadecuada es una falla grave. [SIN VERIFICAR]
- **Bandas 437 MHz y 140 MHz:** no aparecen en la sección 5.1 de la guía. No usarlas hasta confirmar la fuente. [SIN VERIFICAR; posiblemente en otra parte del documento]
- Regla de juego: sin estación terrena suficiente, la misión pierde datos aunque la nave esté bien. [DERIVADO]

## K. Pruebas de verificación

- **Vibración:** obligatoria en todos los lanzamientos. El ICD fija los niveles. [VERIFICADO-NASA, §6.9.2]
- **Vacío térmico (horneado):** se requiere en casi todas las misiones. Los ciclos de vacío térmico son una prueba interna opcional y no reemplazan el horneado. [VERIFICADO-NASA, §6.9.3]
- **Día en la vida (DITL):** obligatoria, para mostrar que los inhibidores eléctricos y los temporizadores funcionan. [VERIFICADO-NASA, §2.11]
- **Después de las pruebas ambientales:** no se pueden hacer cambios físicos al hardware. [VERIFICADO-NASA, §6.9.2]
- **ETU y FlatSat:** un ETU es igual a la unidad de vuelo pero no se lanza, sirve para práctica. Un FlatSat tiene todos los componentes excepto la estructura. [VERIFICADO-NASA, apéndice B]
- **Recomendación de una ETU, un FlatSat y dos unidades de vuelo:** [SIN VERIFICAR. La guía no da esa recomendación explícita en el texto leído.]
- Choque, EMI/EMC y carga estática: en algunos casos. [SIN VERIFICAR]

## L. Escala de masa, potencia y presupuesto de un diseño de ejemplo

- No confirmados. Las diapositivas de NASA no traen esos números en texto. [POR DEFINIR]
