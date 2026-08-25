# Documento de Visión

## Sistema de Trazabilidad Apícola Argentina

**Versión:** 1.0\
**Estado:** Documento de visión inicial\
**Propósito:** Base funcional y conceptual para el diseño y desarrollo
de una plataforma de trazabilidad apícola orientada a desarrolladores.

------------------------------------------------------------------------

## 1. Introducción

El presente Documento de Visión define el propósito, problema, usuarios,
alcance inicial y objetivos de un sistema de trazabilidad apícola para
Argentina.

El documento está pensado principalmente para equipos de desarrollo que
necesiten comprender el problema de negocio antes de diseñar la solución
tecnológica. Por ese motivo, se utiliza un lenguaje funcional y
sencillo, evitando que el conocimiento previo de la actividad apícola
sea un requisito.

La plataforma propuesta busca **centralizar y relacionar información de
la cadena apícola**, sin reemplazar necesariamente los sistemas
oficiales existentes. Su función inicial será proporcionar una capa de
gestión, trazabilidad e integración que permita relacionar actores,
establecimientos, apiarios, movimientos, lotes, análisis y documentos.

> **Principio fundamental:** el sistema debe permitir reconstruir la
> historia de un producto apícola desde su origen hasta su destino,
> manteniendo la relación entre las personas, establecimientos,
> movimientos, lotes y documentos que participan en el proceso.

------------------------------------------------------------------------

# 2. Problema

## 2.1 Situación actual

La trazabilidad apícola involucra numerosos actores, documentos y
sistemas. La información necesaria para reconstruir el recorrido de la
miel puede encontrarse distribuida entre organismos públicos, empresas,
establecimientos productivos, laboratorios y sistemas administrativos.

Para un desarrollador que no conoce el sector, esto genera una
dificultad inicial importante: antes de programar debe comprender
conceptos como:

-   RENAPA.
-   RENSPA.
-   Apiario.
-   Establecimiento.
-   Sala de extracción.
-   Lote.
-   Tambor.
-   DT-e.
-   Movimiento.
-   RNE.
-   RNPA.
-   Facturación.
-   Análisis de laboratorio.
-   Exportación.

Además, estos conceptos no representan lo mismo ni pertenecen
necesariamente al mismo sistema.

## 2.2 Fragmentación de la información

La cadena puede involucrar diferentes fuentes de información:

-   registros del productor;
-   registros de establecimientos;
-   registros de movimientos;
-   documentación de transporte;
-   información de extracción;
-   identificación de lotes;
-   resultados de laboratorio;
-   registros de establecimientos y productos alimenticios;
-   información fiscal y comercial;
-   documentación de exportación.

El problema tecnológico no consiste simplemente en almacenar estos
datos, sino en **relacionarlos de forma coherente y auditable**.

## 2.3 Problema que resolverá la plataforma

La plataforma deberá facilitar que un usuario autorizado pueda responder
preguntas como:

-   ¿Quién produjo esta miel?
-   ¿En qué establecimiento se originó?
-   ¿Qué apiario está asociado?
-   ¿Qué movimiento realizó?
-   ¿Cuál fue el establecimiento de destino?
-   ¿En qué lote terminó la producción?
-   ¿Qué tambores contienen ese lote?
-   ¿Qué análisis de laboratorio se realizaron?
-   ¿Quién recibió la miel?
-   ¿En qué producto fraccionado terminó?
-   ¿Qué documentos respaldan cada etapa?

------------------------------------------------------------------------

# 3. Visión del producto

La visión del sistema es construir una **plataforma de trazabilidad
apícola interoperable**, capaz de centralizar la información relevante
de la cadena y relacionarla mediante identificadores y eventos.

La plataforma deberá permitir que diferentes actores trabajen sobre una
representación común del proceso, mientras que las integraciones con
sistemas externos se implementarán mediante módulos o adaptadores
independientes.

### Visión resumida

``` text
ACTORES
   |
   v
IDENTIDADES
   |
   v
ESTABLECIMIENTOS
   |
   v
APIARIOS / PRODUCCIÓN
   |
   v
MOVIMIENTOS
   |
   v
EXTRACCIÓN
   |
   v
LOTES
   |
   v
ANÁLISIS
   |
   v
ACOPIO / FRACCIONAMIENTO
   |
   v
COMERCIALIZACIÓN
   |
   v
EXPORTACIÓN / CONSUMO
```

------------------------------------------------------------------------

# 4. Usuarios del sistema

La plataforma deberá contemplar diferentes perfiles. El MVP no
necesariamente implementará todas las funciones para todos ellos, pero
el modelo deberá permitir su incorporación futura.

## 4.1 Productor apícola

Puede:

-   administrar sus datos;
-   asociar sus identificadores oficiales;
-   consultar establecimientos relacionados;
-   registrar información productiva;
-   consultar movimientos;
-   consultar lotes;
-   consultar trazabilidad.

## 4.2 Responsable de establecimiento

Puede:

-   administrar información del establecimiento;
-   registrar operaciones;
-   recibir movimientos;
-   gestionar lotes;
-   consultar antecedentes de la miel recibida.

## 4.3 Sala de extracción

Puede:

-   registrar recepción de miel;
-   relacionar origen y lote;
-   registrar extracción;
-   generar unidades de producción;
-   asociar tambores;
-   consultar trazabilidad de entrada y salida.

## 4.4 Transportista

Puede:

-   consultar movimientos asignados;
-   visualizar información necesaria para el transporte;
-   registrar estados del traslado;
-   consultar documentación autorizada.

## 4.5 Acopiador

Puede:

-   registrar recepción;
-   administrar existencias;
-   relacionar lotes;
-   consultar procedencia;
-   registrar despachos.

## 4.6 Fraccionador

Puede:

-   recibir lotes;
-   registrar fraccionamiento;
-   relacionar lote de origen con producto final;
-   consultar resultados de análisis;
-   generar información de trazabilidad del producto.

## 4.7 Laboratorio

Puede, en una etapa posterior:

-   registrar análisis;
-   asociar resultados a muestras;
-   identificar lote analizado;
-   emitir o cargar certificados;
-   consultar el historial autorizado de la muestra.

## 4.8 Exportador

Puede:

-   consultar lotes disponibles;
-   consolidar lotes;
-   gestionar documentación;
-   relacionar exportaciones con productos y lotes;
-   consultar trazabilidad hacia atrás.

## 4.9 Administrador

Puede:

-   administrar usuarios;
-   configurar permisos;
-   administrar catálogos;
-   controlar integraciones;
-   revisar auditoría;
-   monitorear errores.

------------------------------------------------------------------------

# 5. Alcance inicial: MVP

El MVP debe ser deliberadamente limitado. Su objetivo no será resolver
toda la cadena apícola desde el primer día, sino demostrar que es
posible construir una **trazabilidad digital consistente**.

## 5.1 Funcionalidades incluidas

### A. Gestión de usuarios

-   Registro de usuarios.
-   Autenticación.
-   Roles.
-   Permisos básicos.
-   Auditoría de acciones.

### B. Identidad del productor

La plataforma deberá permitir almacenar y relacionar:

-   datos básicos del productor;
-   CUIT u otro identificador fiscal cuando corresponda;
-   identificador RENAPA;
-   establecimientos relacionados;
-   identificadores RENSPA disponibles para el usuario.

> El sistema deberá distinguir claramente entre la identidad del
> productor y la identidad del establecimiento.

### C. Gestión de establecimientos

Permitir:

-   registrar establecimientos;
-   almacenar RENSPA;
-   registrar ubicación;
-   asociar responsable;
-   relacionar establecimientos con productores;
-   consultar historial.

### D. Gestión de apiarios

Permitir:

-   registrar apiarios;
-   asociarlos al establecimiento correspondiente;
-   almacenar ubicación;
-   registrar información básica;
-   mantener historial.

### E. Gestión de movimientos

El MVP deberá modelar el movimiento como una relación entre
establecimiento de origen y establecimiento de destino.

``` text
RENSPA ORIGEN
      |
      | movimiento
      v
RENSPA DESTINO
```

El sistema deberá poder almacenar:

-   origen;
-   destino;
-   fecha;
-   responsable;
-   transporte;
-   cantidad;
-   unidad;
-   documento asociado;
-   estado.

El **DT-e** deberá tratarse como un documento asociado al movimiento
oficial, no como sustituto del concepto de movimiento dentro del modelo
interno.

### F. Gestión de lotes

Permitir:

-   crear lotes;
-   identificar origen;
-   asociar fecha;
-   asociar establecimiento;
-   registrar cantidad;
-   asociar unidades físicas;
-   registrar estados;
-   consultar historial.

### G. Gestión de tambores

Permitir:

-   identificar cada tambor;
-   asociarlo a un lote;
-   registrar cantidad;
-   registrar ubicación;
-   registrar movimientos;
-   consultar historial.

### H. Trazabilidad hacia atrás

Dado un lote, el sistema deberá poder reconstruir:

``` text
Lote
  |
  +-- Tambor
  |
  +-- Extracción
  |
  +-- Origen
  |
  +-- Establecimiento
  |
  +-- RENSPA
  |
  +-- Productor
```

### I. Trazabilidad hacia adelante

Dado un origen, deberá ser posible consultar:

``` text
Origen
  |
  +-- Movimiento
  |
  +-- Recepción
  |
  +-- Lote
  |
  +-- Tambor
  |
  +-- Fraccionamiento
  |
  +-- Producto final
```

------------------------------------------------------------------------

# 6. Fuera del alcance inicial

Para evitar un MVP excesivamente grande, inicialmente se propone dejar
fuera:

-   facturación electrónica completa;
-   integración productiva con ARCA;
-   integración completa con SIFEGA;
-   automatización completa de exportaciones;
-   marketplace;
-   pagos;
-   inteligencia artificial avanzada;
-   IoT de colmenas;
-   sensores;
-   blockchain;
-   aplicaciones móviles nativas;
-   integración automática con todos los sistemas provinciales.

Estas funcionalidades podrán incorporarse posteriormente.

------------------------------------------------------------------------

# 7. Integraciones previstas

Aunque algunas integraciones no formen parte del MVP funcional, la
arquitectura deberá prepararse para ellas.

## SENASA

La plataforma deberá contemplar la futura integración con servicios y
sistemas relacionados con:

-   RENAPA;
-   RENSPA;
-   SIGSA;
-   movimientos;
-   DT-e;
-   establecimientos;
-   información sanitaria.

## ARCA

Se deberá prever la integración futura para:

-   identificación fiscal;
-   facturación electrónica;
-   comprobantes;
-   información comercial.

## SIFEGA / autoridades sanitarias

Se deberá prever la relación con:

-   RNE;
-   RNPA;
-   establecimientos alimentarios;
-   productos alimenticios.

## Laboratorios

Se deberá prever una interfaz para:

-   recepción de muestras;
-   resultados;
-   certificados;
-   análisis asociados a lotes.

------------------------------------------------------------------------

# 8. Objetivos del sistema

## Objetivo general

Construir una plataforma digital que permita **registrar, relacionar y
consultar la trazabilidad de productos apícolas**, desde su origen
productivo hasta sus etapas posteriores de transformación y
comercialización.

## Objetivos específicos

-   Crear un modelo común de información apícola.
-   Separar claramente productor, establecimiento y producto.
-   Relacionar RENAPA y RENSPA sin confundir sus funciones.
-   Modelar movimientos como eventos entre establecimientos.
-   Asociar documentos oficiales a los eventos correspondientes.
-   Identificar lotes y unidades físicas.
-   Mantener trazabilidad hacia atrás y hacia adelante.
-   Registrar auditoría de las operaciones.
-   Facilitar futuras integraciones con organismos oficiales.
-   Proporcionar APIs para que otros sistemas puedan consumir
    información autorizada.
-   Reducir la duplicación de carga de datos.
-   Facilitar el desarrollo de soluciones por distintos equipos.

------------------------------------------------------------------------

# 9. Principios de diseño

## 9.1 Interoperabilidad

La plataforma no debe asumir que todos los datos pertenecen al sistema.

Debe poder integrarse con sistemas externos.

``` text
        PLATAFORMA
             |
   +---------+---------+
   |         |         |
 SENASA     ARCA     SIFEGA
```

## 9.2 Separación de responsabilidades

La plataforma deberá distinguir:

-   identidad fiscal;
-   identidad del productor;
-   identidad del establecimiento;
-   información productiva;
-   movimiento;
-   documento;
-   lote;
-   producto.

## 9.3 Trazabilidad basada en eventos

Las operaciones importantes deberán generar eventos.

Ejemplos:

-   alta de establecimiento;
-   registro de apiario;
-   cosecha;
-   recepción;
-   extracción;
-   creación de lote;
-   movimiento;
-   análisis;
-   fraccionamiento;
-   despacho.

## 9.4 Auditoría

Los cambios relevantes deberán conservar:

-   quién realizó la operación;
-   cuándo;
-   qué entidad modificó;
-   qué valores cambiaron;
-   origen de la información.

## 9.5 Seguridad

La información deberá protegerse mediante:

-   autenticación;
-   autorización;
-   control de acceso por rol;
-   registro de actividad;
-   cifrado de comunicaciones;
-   protección de información sensible.

## 9.6 Evolución

El diseño deberá permitir agregar nuevos organismos, documentos y
procesos sin modificar completamente el núcleo del sistema.

------------------------------------------------------------------------

# 10. Beneficios esperados

## Para productores

-   Menor duplicación de información.
-   Mejor acceso al historial productivo.
-   Mayor visibilidad de sus operaciones.
-   Acceso simplificado a información de trazabilidad.

## Para salas y acopiadores

-   Mejor control de recepción.
-   Identificación de lotes.
-   Historial de movimientos.
-   Control de existencias.
-   Menor dependencia de registros manuales.

## Para laboratorios

-   Asociación directa entre muestras y lotes.
-   Menor riesgo de pérdida de contexto.
-   Historial de análisis.

## Para fraccionadores

-   Conocimiento del origen de la materia prima.
-   Relación entre lote de origen y producto final.
-   Mejor gestión de retiros o incidentes.

## Para exportadores

-   Mayor capacidad para reconstruir la historia del producto.
-   Consolidación de documentación.
-   Preparación para integraciones de comercio exterior.

## Para organismos y autoridades

-   Información más estructurada.
-   Mejor capacidad de auditoría.
-   Mayor disponibilidad de información histórica.
-   Posibilidad de detectar inconsistencias.

## Para desarrolladores

-   Modelo de dominio documentado.
-   APIs normalizadas.
-   Integraciones desacopladas.
-   Modelo de datos común.
-   Arquitectura extensible.

------------------------------------------------------------------------

# 11. Resultado esperado del MVP

Al finalizar el MVP deberá ser posible realizar una demostración
completa:

``` text
PRODUCTOR
   |
   v
RENSPA
   |
   v
APIARIO
   |
   v
COSECHA
   |
   v
LOTE
   |
   v
TAMBOR
   |
   v
MOVIMIENTO
   |
   v
RENSPA DESTINO
   |
   v
RECEPCIÓN
   |
   v
NUEVA OPERACIÓN
```

Y consultar el proceso en ambos sentidos.

### Trazabilidad hacia atrás

``` text
Tambor
  ↓
Lote
  ↓
Extracción
  ↓
Origen
  ↓
RENSPA
  ↓
Productor
```

### Trazabilidad hacia adelante

``` text
Productor
  ↓
RENSPA
  ↓
Movimiento
  ↓
Destino
  ↓
Lote
  ↓
Tambor
  ↓
Producto
```

------------------------------------------------------------------------

# 12. Criterios de éxito del MVP

El MVP podrá considerarse exitoso si:

-   un usuario puede registrar su identidad;
-   un establecimiento puede quedar asociado a un productor;
-   un RENSPA puede ser identificado como origen o destino de un
    movimiento;
-   un apiario puede quedar asociado al establecimiento correspondiente;
-   un lote puede relacionarse con su origen;
-   un tambor puede relacionarse con un lote;
-   un movimiento puede ser consultado;
-   la trazabilidad puede recorrerse hacia atrás y hacia adelante;
-   todas las operaciones importantes quedan auditadas;
-   la arquitectura permite agregar posteriormente integraciones
    oficiales.

------------------------------------------------------------------------

# 13. Evolución posterior

Una vez validado el MVP, se propone evolucionar hacia:

### Fase 2

-   integración con SENASA;
-   gestión avanzada de DT-e;
-   laboratorios;
-   documentos digitales;
-   QR de trazabilidad.

### Fase 3

-   ARCA;
-   facturación electrónica;
-   SIFEGA;
-   RNE/RNPA;
-   gestión comercial.

### Fase 4

-   exportación;
-   Aduana;
-   certificaciones;
-   trazabilidad internacional.

### Fase 5

-   aplicación móvil;
-   IoT;
-   sensores;
-   analítica;
-   inteligencia artificial;
-   predicción y detección de inconsistencias.

------------------------------------------------------------------------

# 14. Visión final

La plataforma no pretende reemplazar a los organismos oficiales.

Su propósito es actuar como una **capa tecnológica de gestión,
trazabilidad e interoperabilidad**.

El modelo conceptual será:

``` text
                    PLATAFORMA
                         |
        +----------------+----------------+
        |                |                |
     PRODUCTOR       ESTABLECIMIENTO    LOTES
        |                |                |
     RENAPA           RENSPA           TAMBOR
                         |
                      MOVIMIENTO
                         |
                       DT-e
                         |
        +----------------+----------------+
        |                |                |
     SENASA             ARCA           SIFEGA
        |                |                |
        +----------------+----------------+
                         |
                    TRAZABILIDAD
                         |
                    PRODUCTO FINAL
```

La arquitectura deberá permitir que cada organismo mantenga su
responsabilidad y fuente oficial de información, mientras la plataforma
construye las relaciones necesarias para ofrecer una visión integrada
del proceso.

------------------------------------------------------------------------

## 15. Próximo documento

A partir de esta visión, el siguiente entregable recomendado es el:

**Documento de Modelo de Dominio Apícola**

Este documento deberá definir formalmente las entidades y relaciones
principales, especialmente:

-   Persona.
-   Productor.
-   Empresa.
-   CUIT.
-   RENAPA.
-   Establecimiento.
-   RENSPA.
-   Apiario.
-   Colmena.
-   Cosecha.
-   Sala de extracción.
-   Lote.
-   Tambor.
-   Movimiento.
-   DT-e.
-   Transportista.
-   Vehículo.
-   Recepción.
-   Laboratorio.
-   Análisis.
-   Fraccionamiento.
-   Producto.
-   RNE.
-   RNPA.
-   Documento.
-   Evento de trazabilidad.

Ese modelo será la base para diseñar posteriormente la **base de datos,
APIs, arquitectura de microservicios y aplicación**.
