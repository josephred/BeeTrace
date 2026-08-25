# Mapa del Dominio --- Sistema de Trazabilidad Apícola Argentina

**Versión:** 1.0\
**Fecha:** 2026-08-25\
**Tipo de documento:** Modelo conceptual de dominio\
**Uso:** Base para análisis funcional, arquitectura, base de datos y
APIs.

> **Nota de modelado:** este documento distingue las entidades del
> dominio de los organismos y sistemas que las registran o intervienen
> sobre ellas. No debe interpretarse que cada entidad pertenece
> exclusivamente a un único sistema.

## 1. Propósito

El mapa representa las entidades mínimas necesarias para comprender una
trazabilidad apícola digital.

El modelo parte de una distinción fundamental:

-   **Productor**: actor/persona o sujeto responsable de la actividad.
-   **RENAPA**: identificación/registro específico del productor
    apícola.
-   **RENSPA**: identificación sanitaria asociada al productor, la
    producción y el predio/establecimiento.
-   **Apiario**: unidad productiva donde se encuentran las colmenas.
-   **Movimiento**: evento de traslado entre establecimientos/orígenes y
    destinos.
-   **DT-e**: documento electrónico que ampara determinados movimientos
    sanitarios; se modela como documento asociado al movimiento.
-   **Lote**: unidad lógica de trazabilidad de producto.
-   **Tambor**: unidad física de almacenamiento/transporte de miel.
-   **SENASA, ARCA y SIFEGA**: organismos/plataformas institucionales
    que intervienen en diferentes dimensiones del ecosistema.

SENASA indica que el RENSPA identifica al productor y al predio donde
desarrolla sus actividades. Además, los movimientos sujetos a
documentación sanitaria se gestionan mediante SIGSA y DT-e.
citeturn0search17turn0search15

Para el modelo de 2026 debe contemplarse específicamente el avance del
DT-e para material apícola melario desde apiarios hacia salas de
extracción: SENASA informó su obligatoriedad a partir del 1 de agosto de
2026 y señaló que el titular del apiario gestiona el DT-e en SIGSA y que
la sala de extracción realiza su cierre. citeturn0search16

SIFeGA gestiona información federal relacionada con establecimientos y
productos alimenticios, incluyendo RNE y RNPA según la jurisdicción y el
circuito correspondiente. citeturn0search0turn0search7

ARCA interviene en la dimensión fiscal y de facturación; la factura
electrónica es un comprobante digital con validez legal equivalente al
comprobante en papel en los casos previstos.
citeturn0search6turn0search14

------------------------------------------------------------------------

## 2. Diagrama Mermaid

``` mermaid
flowchart LR

    %% Actores
    P["Productor"]
    T["Transportista"]

    %% Identidades / registros
    RNAPA["RENAPA"]
    RENSPA["RENSPA"]
    CUIT["CUIT / Identidad fiscal"]

    %% Producción
    EST["Establecimiento / Predio"]
    API["Apiario"]
    COL["Colmena"]

    %% Trazabilidad
    MOV["Movimiento"]
    DTE["DT-e"]
    LOTE["Lote"]
    TAMB["Tambor"]

    %% Organismos / sistemas
    SENASA["SENASA"]
    ARCA["ARCA"]
    SIFEGA["SIFEGA"]

    %% Relaciones principales
    P -->|"se registra como productor apícola"| RNAPA
    P -->|"se identifica fiscalmente mediante"| CUIT
    P -->|"es responsable / está asociado a"| RENSPA

    RENSPA -->|"identifica"| EST
    EST -->|"contiene / comprende"| API
    API -->|"contiene"| COL

    API -->|"origina material/producto"| MOV
    RENSPA -->|"origen o destino sanitario"| MOV
    T -->|"realiza / participa en"| MOV

    MOV -->|"puede estar amparado por"| DTE
    DTE -->|"documenta"| MOV

    MOV -->|"conduce a recepción / transformación"| LOTE
    LOTE -->|"se materializa en unidades"| TAMB

    %% Instituciones
    SENASA -->|"administra / regula registros y trazabilidad sanitaria"| RENSPA
    SENASA -->|"gestiona registros y procesos apícolas"| RNAPA
    SENASA -->|"gestiona SIGSA / DT-e"| DTE

    ARCA -->|"identidad fiscal / comprobantes"| CUIT
    ARCA -.->|"facturación y relación comercial"| LOTE

    SIFEGA -->|"registros sanitarios alimentarios"| LOTE
    SIFEGA -->|"RNE"| EST
    SIFEGA -->|"RNPA"| PROD["Producto alimenticio"]

    LOTE -->|"puede transformarse en"| PROD
```

### 2.1 Lectura recomendada del diagrama

La dirección conceptual principal es:

``` text
Productor
   ↓
RENAPA / RENSPA
   ↓
Establecimiento
   ↓
Apiario
   ↓
Movimiento
   ↓
DT-e
   ↓
Lote
   ↓
Tambor
   ↓
Producto alimenticio
```

Pero no debe interpretarse como una única cadena lineal. La trazabilidad
real es una **red de relaciones y eventos**.

Un productor puede estar asociado a uno o más establecimientos; un
establecimiento puede comprender uno o más apiarios; los movimientos
conectan un origen y un destino; y los lotes pueden consolidar o
transformarse a partir de operaciones posteriores.

------------------------------------------------------------------------

## 3. Entidades principales y atributos clave

  --------------------------------------------------------------------------------------------------------
  Entidad               Tipo                     Atributos clave          Relación principal
  --------------------- ------------------------ ------------------------ --------------------------------
  **Productor**         Actor                    `id`,                    Se vincula con RENAPA y uno o
                                                 `nombre_razon_social`,   más establecimientos/RENSPA
                                                 `tipo_persona`, `cuit`,  
                                                 `estado`                 

  **RENAPA**            Registro/identificador   `numero_renapa`,         Identifica al productor apícola
                                                 `estado`, `fecha_alta`,  dentro del registro
                                                 `fecha_actualizacion`    correspondiente

  **RENSPA**            Registro/identificador   `numero_renspa`,         Vincula productor, actividad y
                        sanitario                `productor_id`,          establecimiento/predio
                                                 `establecimiento_id`,    
                                                 `actividad`, `estado`    

  **Establecimiento**   Unidad                   `id`, `renspa`,          Puede contener o estar asociado
                        territorial/operativa    `nombre`, `domicilio`,   a apiarios y participar como
                                                 `latitud`, `longitud`,   origen/destino
                                                 `estado`                 

  **Apiario**           Unidad productiva        `id`, `codigo`,          Pertenece al contexto de un
                                                 `establecimiento_id`,    establecimiento y contiene
                                                 `ubicacion`,             colmenas
                                                 `cantidad_colmenas`,     
                                                 `estado`                 

  **Colmena**           Unidad productiva        `id`, `codigo`,          Pertenece a un apiario
                                                 `apiario_id`,            
                                                 `identificador`,         
                                                 `estado`                 

  **Movimiento**        Evento de trazabilidad   `id`, `origen`,          Conecta origen y destino
                                                 `destino`, `fecha_hora`, 
                                                 `cantidad`, `unidad`,    
                                                 `transportista_id`,      
                                                 `estado`                 

  **DT-e**              Documento                `id`, `numero`,          Ampara/documenta el movimiento
                                                 `movimiento_id`,         cuando corresponde
                                                 `fecha_emision`,         
                                                 `origen`, `destino`,     
                                                 `estado`,                
                                                 `sistema_origen`         

  **Lote**              Unidad lógica de         `id`, `codigo_lote`,     Agrupa producto trazable y puede
                        trazabilidad             `fecha_creacion`,        relacionarse con movimientos,
                                                 `origen`, `cantidad`,    extracción y tambores
                                                 `unidad`, `estado`       

  **Tambor**            Unidad física            `id`, `codigo`,          Es una unidad física asociada a
                                                 `lote_id`, `peso`,       un lote
                                                 `unidad`, `ubicacion`,   
                                                 `estado`                 

  **Transportista**     Actor                    `id`, `razon_social`,    Participa en movimientos
                                                 `cuit`, `habilitacion`,  
                                                 `vehiculo_id`, `estado`  

  **SENASA**            Organismo                `id_organismo`,          Interviene en la dimensión
                                                 `nombre`, `sistemas`,    sanitaria y registros/sistemas
                                                 `competencias`           correspondientes

  **ARCA**              Organismo                `id_organismo`,          Interviene en identidad fiscal y
                                                 `nombre`,                facturación
                                                 `servicios_fiscales`     

  **SIFEGA**            Plataforma federal       `id_sistema`,            Gestiona/integra información de
                        alimentaria              `jurisdiccion`,          control alimentario, RNE/RNPA
                                                 `estado`, `version`      según corresponda

  **Producto            Producto                 `id`, `nombre`,          Puede derivar de uno o más lotes
  alimenticio**                                  `categoria`, `rnpa`,     según el proceso de
                                                 `rne_origen`, `estado`   transformación/fraccionamiento
  --------------------------------------------------------------------------------------------------------

------------------------------------------------------------------------

## 4. Relaciones esenciales

### 4.1 Productor → RENAPA

``` text
Productor
    |
    +---- RENAPA
```

El RENAPA debe modelarse como un identificador/registro asociado al
productor apícola, no como equivalente del RENSPA.

### 4.2 Productor → RENSPA

``` text
Productor
    |
    +---- RENSPA
             |
             +---- Establecimiento / Predio
```

RENSPA y RENAPA no deben fusionarse en una sola entidad.

### 4.3 RENSPA → Apiario

Para el modelo de software, el apiario debe quedar vinculado al contexto
del establecimiento que corresponda.

``` text
RENSPA
  |
  +---- Establecimiento
           |
           +---- Apiario
                    |
                    +---- Colmena
```

### 4.4 Movimiento → DT-e

El modelo interno debe distinguir:

``` text
Movimiento
     |
     +---- Documento
              |
              +---- DT-e
```

Esto permite que el sistema represente el concepto de negocio
**Movimiento** aunque el documento oficial pueda cambiar o coexistir con
otros documentos.

En 2026, SENASA informó que el DT-e se incorpora al traslado de material
apícola melario desde apiarios hacia salas de extracción y que el
movimiento se gestiona en SIGSA. citeturn0search16

### 4.5 Lote → Tambor

``` text
Lote
  |
  +---- Tambor 001
  +---- Tambor 002
  +---- Tambor 003
```

Un lote es una unidad lógica de trazabilidad; el tambor es una unidad
física. No deben ser tratados como sinónimos.

------------------------------------------------------------------------

## 5. Organismos como actores institucionales

### SENASA

En el modelo conceptual, SENASA debe representarse como un **actor
institucional**, no como una entidad de negocio.

Sus sistemas y registros intervienen sobre diferentes objetos del
dominio.

``` text
SENASA
  |
  +-- RENSPA
  +-- RENAPA
  +-- SIGSA
       |
       +-- Movimientos
       +-- DT-e
```

El sitio oficial de SENASA describe al RENSPA como el registro que
identifica al productor y al predio asociado a su actividad.
citeturn0search17

### ARCA

ARCA se modela como actor externo de la dimensión fiscal:

``` text
ARCA
  |
  +-- Identidad fiscal
  |
  +-- Facturación
```

La plataforma de trazabilidad no debería asumir que la factura es el
mecanismo primario de trazabilidad. La factura puede aportar una
relación comercial/fiscal complementaria. ARCA mantiene servicios
específicos para facturación electrónica.
citeturn0search6turn0search13

### SIFEGA

SIFEGA se modela como plataforma externa del ecosistema alimentario:

``` text
SIFEGA
  |
  +-- RNE
  |
  +-- RNPA
  |
  +-- información alimentaria
  |
  +-- laboratorio / otros módulos
```

La documentación oficial indica que SIFeGA permite gestionar, según la
jurisdicción, autorizaciones sanitarias de establecimientos (RNE) y
productos alimenticios (RNPA), y que funciona como canal entre INAL,
autoridades sanitarias jurisdiccionales, industria y consumidores.
citeturn0search0turn0search12

------------------------------------------------------------------------

## 6. Regla arquitectónica importante

No conviene diseñar la base de datos de la plataforma copiando las bases
de datos de SENASA, ARCA o SIFEGA.

Debe existir un **modelo canónico propio**:

``` text
                 MODELO CANÓNICO
                       |
        +--------------+--------------+
        |              |              |
     SENASA           ARCA          SIFEGA
        |              |              |
     RENSPA          CUIT          RNE/RNPA
     RENAPA       Facturación     Alimentos
     DT-e
```

Los sistemas externos se conectarán mediante
**adaptadores/integraciones**.

Esto permitirá que la plataforma pueda evolucionar aunque cambien los
sistemas externos.

------------------------------------------------------------------------

## 7. Reglas de modelado para el desarrollo

1.  **No confundir Productor con RENAPA.**
2.  **No confundir RENAPA con RENSPA.**
3.  **No confundir RENSPA con Apiario.**
4.  **No confundir Movimiento con DT-e.**
5.  **No confundir Lote con Tambor.**
6.  **No usar la factura como sustituto de la trazabilidad sanitaria.**
7.  **No representar a SENASA, ARCA o SIFEGA como simples tablas de
    negocio.**
8.  **Registrar la fuente de cada dato externo.**
9.  **Mantener identificadores externos y claves internas separadas.**
10. **Registrar eventos de trazabilidad y auditoría.**

------------------------------------------------------------------------

## 8. Identificadores externos y claves internas

Se recomienda que cada entidad tenga una clave interna independiente de
los identificadores oficiales.

Ejemplo:

``` text
Productor
  id = UUID interno
  cuit = identificador fiscal
  renapa = identificador externo

Establecimiento
  id = UUID interno
  renspa = identificador externo

Movimiento
  id = UUID interno
  dte_numero = identificador/documento externo
```

Esto evita acoplar el diseño de la base de datos a la estructura de
numeración de un organismo externo.

------------------------------------------------------------------------

## 9. Modelo conceptual resumido

``` text
PRODUCTOR
   |
   +---- RENAPA
   |
   +---- RENSPA
            |
            +---- ESTABLECIMIENTO
                     |
                     +---- APIARIO
                              |
                              +---- COLMENA
                              |
                              +---- MOVIMIENTO
                                       |
                                       +---- DT-e
                                       |
                                       +---- DESTINO
                                                |
                                                +---- LOTE
                                                         |
                                                         +---- TAMBOR
                                                         |
                                                         +---- PRODUCTO
```

Los organismos se relacionan transversalmente:

``` text
                 SENASA
                    |
       +------------+------------+
       |            |            |
    RENAPA       RENSPA        DT-e
                                  |
                                  v
                              MOVIMIENTO

                 ARCA
                  |
                 CUIT
                  |
             FACTURACIÓN

                SIFEGA
                  |
             +----+----+
             |         |
            RNE       RNPA
```

------------------------------------------------------------------------

## 10. Próximo paso

Este mapa debe considerarse **modelo conceptual**, no todavía modelo
físico de base de datos.

El siguiente artefacto recomendado es el **Modelo de Dominio
detallado**, donde se definirán:

-   cardinalidades `1:1`, `1:N`, `N:M`;
-   ciclo de vida de cada entidad;
-   eventos;
-   estados;
-   identificadores;
-   claves internas y externas;
-   reglas de negocio;
-   entidades de auditoría;
-   modelo de integración con SENASA/SIGSA;
-   y posteriormente el **ERD de PostgreSQL**.

### Fuentes oficiales consultadas

-   urlSENASA ---
    RENSPAhttps://www.argentina.gob.ar/senasa/micrositios/renspa
-   urlSENASA --- Movimientos /
    SIGSAhttps://www.argentina.gob.ar/senasa/animales-acuaticos-produccion-primaria/movimientos
-   urlSENASA --- DT-e para material apícola
    melariohttps://www.argentina.gob.ar/noticias/se-optimizan-los-controles-de-movimientos-de-material-apicola-desde-apiarios-salas-de
-   urlANMAT ---
    SIFeGAhttps://www.argentina.gob.ar/anmat/regulados/alimentos/sifega
-   urlARCA --- Factura electrónicahttps://www.arca.gob.ar/fe/
