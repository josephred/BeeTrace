# Casos de Uso --- Sistema de Trazabilidad Apícola Argentina

**Versión:** 1.0\
**Fecha:** 2026-08-25\
**Rol del documento:** Análisis funcional inicial\
**Prioridad:** MVP = necesario para la primera versión operativa; Futuro
= evolución posterior.

> **Criterio de modelado:** el sistema debe distinguir entre el concepto
> interno de **Movimiento** y el documento oficial **DT-e** que lo
> ampara cuando corresponde. SENASA informó en 2026 la incorporación del
> DT-e para el traslado de material apícola melario desde apiarios hacia
> salas de extracción, con gestión por SIGSA y cierre por la sala
> receptora. citeturn0search10turn0search15

------------------------------------------------------------------------

## 1. Actores del sistema

  ------------------------------------------------------------------------
  Actor                               Descripción
  ----------------------------------- ------------------------------------
  **Productor apícola**               Responsable de la actividad apícola
                                      y de los apiarios que gestiona.

  **Responsable de establecimiento**  Persona que administra una sala,
                                      acopio u otro establecimiento
                                      receptor/operativo.

  **Sala de extracción**              Establecimiento que recibe material
                                      melario y realiza la extracción de
                                      miel.

  **Transportista**                   Responsable del traslado de
                                      material/producto entre origen y
                                      destino.

  **Acopiador**                       Recibe, almacena y administra miel o
                                      lotes.

  **Fraccionador**                    Transforma lotes de miel en
                                      productos fraccionados.

  **Laboratorio**                     Registra o informa resultados
                                      analíticos asociados a
                                      muestras/lotes.

  **Exportador**                      Gestiona operaciones de comercio
                                      exterior y lotes destinados a
                                      exportación.

  **Administrador de plataforma**     Administra usuarios, roles,
                                      catálogos, auditoría e
                                      integraciones.

  **SENASA / SIGSA**                  Actor institucional externo
                                      relacionado con registros y
                                      trazabilidad sanitaria; SIGSA ampara
                                      movimientos sujetos a documentación
                                      sanitaria. citeturn0search20

  **ARCA**                            Actor externo de la dimensión
                                      fiscal, identidad tributaria y
                                      facturación electrónica.
                                      citeturn0search12turn0search17

  **SIFeGA / autoridades sanitarias** Actor externo de la dimensión de
                                      control alimentario,
                                      establecimientos y productos
                                      alimenticios. SIFeGA integra
                                      información y gestiones de RNE/RNPA
                                      según jurisdicción.
                                      citeturn0search0turn0search3
  ------------------------------------------------------------------------

------------------------------------------------------------------------

# 2. Casos de uso del MVP

## CU-01 --- Registrar usuario

-   **Actores:** Administrador, Productor, Responsable de
    establecimiento.
-   **Descripción:** Crear una cuenta de usuario para acceder a la
    plataforma.
-   **Flujo principal:**
    1.  El usuario inicia el registro.
    2.  Informa datos básicos.
    3.  El sistema valida los datos requeridos.
    4.  Se crea la cuenta.
    5.  Se asigna el estado inicial.
-   **Flujo alternativo:**
    -   El correo ya existe → se informa el conflicto.
    -   Los datos son inválidos → se solicita corrección.
-   **Prioridad:** **MVP**

## CU-02 --- Autenticar usuario

-   **Actores:** Todos los usuarios.
-   **Descripción:** Permitir acceso seguro a las funcionalidades
    autorizadas.
-   **Flujo principal:** usuario → credenciales → validación → sesión →
    permisos.
-   **Flujo alternativo:** credenciales inválidas, usuario bloqueado o
    sesión vencida.
-   **Prioridad:** **MVP**

## CU-03 --- Administrar roles y permisos

-   **Actores:** Administrador.
-   **Descripción:** Definir qué operaciones puede realizar cada
    usuario.
-   **Flujo principal:** seleccionar usuario → asignar rol → configurar
    permisos → guardar → auditar.
-   **Flujo alternativo:** rol inexistente, permiso incompatible o
    usuario inactivo.
-   **Prioridad:** **MVP**

------------------------------------------------------------------------

## CU-04 --- Registrar productor

-   **Actores:** Productor, Administrador.
-   **Descripción:** Crear la representación interna del productor.
-   **Flujo principal:**
    1.  Ingresar datos del productor.
    2.  Informar identificación fiscal cuando corresponda.
    3.  Asociar identificador RENAPA cuando esté disponible.
    4.  Validar unicidad.
    5.  Guardar.
-   **Flujo alternativo:**
    -   Productor ya registrado.
    -   Identificador inconsistente.
    -   Validación externa no disponible → guardar como pendiente de
        verificación.
-   **Prioridad:** **MVP**

## CU-05 --- Asociar RENAPA al productor

-   **Actores:** Productor, Administrador.
-   **Descripción:** Registrar la identificación/registro apícola
    correspondiente al productor.
-   **Flujo principal:** seleccionar productor → ingresar RENAPA →
    validar → asociar.
-   **Flujo alternativo:** RENAPA ya asociado a otro productor; estado
    no válido; dato pendiente de verificación.
-   **Prioridad:** **MVP**

## CU-06 --- Registrar establecimiento / RENSPA

-   **Actores:** Productor, Responsable, Administrador.
-   **Descripción:** Registrar un establecimiento y relacionarlo con su
    RENSPA.
-   **Flujo principal:**
    1.  Seleccionar productor/responsable.
    2.  Crear establecimiento.
    3.  Informar RENSPA.
    4.  Registrar ubicación.
    5.  Asociar actividad.
    6.  Guardar.
-   **Flujo alternativo:**
    -   RENSPA ya registrado.
    -   Establecimiento sin verificación externa.
    -   Datos incompletos.
-   **Prioridad:** **MVP**

## CU-07 --- Registrar apiario

-   **Actores:** Productor.
-   **Descripción:** Asociar un apiario a un establecimiento y registrar
    sus datos básicos.
-   **Flujo principal:** seleccionar establecimiento → crear apiario →
    ubicación → datos productivos → guardar.
-   **Flujo alternativo:** apiario duplicado; ubicación inválida;
    establecimiento inactivo.
-   **Prioridad:** **MVP**

## CU-08 --- Registrar / administrar colmenas

-   **Actores:** Productor.
-   **Descripción:** Mantener la información básica de las colmenas de
    un apiario.
-   **Flujo principal:** seleccionar apiario → alta/edición/baja lógica
    de colmena → guardar historial.
-   **Flujo alternativo:** identificador duplicado; apiario inexistente;
    operación no autorizada.
-   **Prioridad:** **MVP**

------------------------------------------------------------------------

# 3. Movimientos y DT-e

## CU-09 --- Crear movimiento

-   **Actores:** Productor, Responsable, Transportista.
-   **Descripción:** Registrar un movimiento como evento de
    trazabilidad.
-   **Flujo principal:**
    1.  Seleccionar origen.
    2.  Seleccionar destino.
    3.  Informar fecha.
    4.  Informar cantidad/unidad.
    5.  Seleccionar transportista.
    6.  Registrar contenido/material.
    7.  Guardar movimiento.
-   **Flujo alternativo:**
    -   Origen o destino inválido.
    -   Establecimiento inactivo.
    -   Transportista no habilitado/validado.
    -   Datos incompletos.
-   **Prioridad:** **MVP**

## CU-10 --- Gestionar DT-e

-   **Actores:** Productor, Sala de extracción, Sistema/SENASA-SIGSA.
-   **Descripción:** Registrar y/o integrar el DT-e asociado al
    movimiento cuando corresponda.
-   **Flujo principal:**
    1.  Crear o seleccionar movimiento.
    2.  Solicitar/registrar DT-e.
    3.  Guardar número y estado.
    4.  Asociar el documento al movimiento.
    5.  Registrar cambios de estado.
-   **Flujo alternativo:**
    -   Servicio externo no disponible.
    -   DT-e rechazado.
    -   Datos incompatibles con el movimiento.
    -   Documento ya registrado.
-   **Prioridad:** **MVP**, con integración oficial progresiva.

> En el esquema informado por SENASA para 2026, el titular del apiario
> gestiona el DT-e en SIGSA y la sala de extracción realiza el cierre.
> El documento permite controlar el tiempo de permanencia del material
> melario en la sala. citeturn0search10

## CU-11 --- Recibir movimiento

-   **Actores:** Sala de extracción, Responsable de establecimiento.
-   **Descripción:** Confirmar que el material/producto llegó al
    establecimiento destino.
-   **Flujo principal:** localizar movimiento → verificar
    origen/documentación → registrar recepción → actualizar estado.
-   **Flujo alternativo:** cantidad diferente; documento faltante;
    movimiento no encontrado; rechazo de recepción.
-   **Prioridad:** **MVP**

## CU-12 --- Cerrar DT-e / confirmar recepción documental

-   **Actores:** Sala de extracción, Sistema/SENASA-SIGSA.
-   **Descripción:** Registrar el cierre del documento cuando
    corresponda al circuito oficial.
-   **Flujo principal:** localizar DT-e → verificar recepción → cerrar →
    guardar fecha/hora → auditar.
-   **Flujo alternativo:** DT-e ya cerrado; datos inconsistentes;
    servicio externo no disponible.
-   **Prioridad:** **MVP**

------------------------------------------------------------------------

# 4. Extracción y lotes

## CU-13 --- Registrar extracción

-   **Actores:** Sala de extracción.
-   **Descripción:** Registrar una operación de extracción y
    relacionarla con los movimientos recibidos.
-   **Flujo principal:**
    1.  Seleccionar entradas recibidas.
    2.  Registrar fecha/hora.
    3.  Registrar cantidad obtenida.
    4.  Crear o seleccionar lote.
    5.  Guardar relaciones de trazabilidad.
-   **Flujo alternativo:**
    -   Cantidad no consistente.
    -   Entrada no recibida.
    -   Lote inexistente.
    -   Operación anulada.
-   **Prioridad:** **MVP**

## CU-14 --- Crear lote

-   **Actores:** Sala de extracción, Acopiador, Fraccionador.
-   **Descripción:** Crear una unidad lógica de trazabilidad para la
    miel/producto.
-   **Flujo principal:** informar origen → fecha → cantidad →
    características → generar identificador → guardar.
-   **Flujo alternativo:** código duplicado; origen no trazable;
    cantidad inválida.
-   **Prioridad:** **MVP**

## CU-15 --- Asociar entradas a lote

-   **Actores:** Sala de extracción, Acopiador.
-   **Descripción:** Relacionar uno o más orígenes/entradas con un lote.
-   **Flujo principal:** seleccionar entradas → validar compatibilidad →
    asignar cantidades → guardar.
-   **Flujo alternativo:** cantidades excedidas; entrada ya consumida;
    mezcla no permitida por regla de negocio.
-   **Prioridad:** **MVP**

## CU-16 --- Registrar tambor

-   **Actores:** Sala de extracción, Acopiador.
-   **Descripción:** Registrar una unidad física de almacenamiento
    asociada a un lote.
-   **Flujo principal:** seleccionar lote → crear tambor → asignar
    código → informar peso → ubicar → guardar.
-   **Flujo alternativo:** código duplicado; peso inválido; lote
    cerrado.
-   **Prioridad:** **MVP**

------------------------------------------------------------------------

# 5. Trazabilidad

## CU-17 --- Consultar trazabilidad hacia atrás

-   **Actores:** Productor, Sala, Acopiador, Fraccionador, Exportador,
    Administrador.
-   **Descripción:** Reconstruir el origen de un lote/tambor/producto.
-   **Flujo principal:**
    1.  Buscar lote/tambor/producto.
    2.  Obtener eventos.
    3.  Recorrer relaciones hacia el origen.
    4.  Mostrar productor, RENSPA, apiario, movimientos y documentos
        disponibles.
-   **Flujo alternativo:** información incompleta; dato externo no
    sincronizado; relación pendiente.
-   **Prioridad:** **MVP**

## CU-18 --- Consultar trazabilidad hacia adelante

-   **Actores:** Productor, Sala, Acopiador, Fraccionador, Exportador,
    Administrador.
-   **Descripción:** Determinar el destino y las transformaciones
    posteriores de una producción.
-   **Flujo principal:** seleccionar origen/lote → recorrer movimientos
    → recepciones → lotes derivados → tambores → productos.
-   **Flujo alternativo:** lote cerrado sin destino; información externa
    pendiente; relación inexistente.
-   **Prioridad:** **MVP**

## CU-19 --- Consultar historial de una entidad

-   **Actores:** Usuarios autorizados.
-   **Descripción:** Visualizar todos los eventos asociados a una
    entidad.
-   **Flujo principal:** seleccionar entidad → consultar timeline →
    filtrar por fecha/tipo → visualizar detalle.
-   **Flujo alternativo:** no existen eventos; usuario sin permiso.
-   **Prioridad:** **MVP**

## CU-20 --- Generar QR de trazabilidad

-   **Actores:** Sala, Acopiador, Fraccionador, Administrador.
-   **Descripción:** Generar un identificador QR para acceder a
    información pública o autorizada de trazabilidad.
-   **Flujo principal:** seleccionar objeto → generar código → asociar
    URL/identificador → imprimir/publicar.
-   **Flujo alternativo:** objeto no apto para publicación; información
    sensible; código existente.
-   **Prioridad:** **Futuro**

------------------------------------------------------------------------

# 6. Laboratorio y calidad

## CU-21 --- Registrar muestra

-   **Actores:** Laboratorio, Sala, Acopiador, Fraccionador.
-   **Descripción:** Asociar una muestra con un lote o producto.
-   **Flujo principal:** seleccionar lote → crear muestra → identificar
    → registrar fecha → enviar al laboratorio.
-   **Flujo alternativo:** lote inexistente; muestra duplicada; datos
    incompletos.
-   **Prioridad:** **MVP básico**

## CU-22 --- Registrar resultado de análisis

-   **Actores:** Laboratorio.
-   **Descripción:** Registrar resultados analíticos asociados a una
    muestra.
-   **Flujo principal:** seleccionar muestra → cargar análisis →
    resultado → responsable → documento → cerrar.
-   **Flujo alternativo:** resultado pendiente; análisis rechazado;
    documento inválido.
-   **Prioridad:** **Futuro**

## CU-23 --- Consultar estado de calidad del lote

-   **Actores:** Sala, Acopiador, Fraccionador, Exportador.
-   **Descripción:** Visualizar los análisis y estados asociados a un
    lote.
-   **Flujo principal:** buscar lote → consultar muestras → resultados →
    estado consolidado.
-   **Flujo alternativo:** no existen análisis; resultados pendientes.
-   **Prioridad:** **Futuro**

------------------------------------------------------------------------

# 7. Acopio y fraccionamiento

## CU-24 --- Registrar recepción en acopio

-   **Actores:** Acopiador.
-   **Descripción:** Registrar la entrada de uno o más lotes/tambores.
-   **Flujo principal:** seleccionar documento/movimiento → verificar
    cantidades → registrar recepción → actualizar stock.
-   **Flujo alternativo:** diferencia de peso; documento faltante; lote
    bloqueado.
-   **Prioridad:** **MVP**

## CU-25 --- Transferir lote entre ubicaciones

-   **Actores:** Acopiador, Responsable.
-   **Descripción:** Registrar cambios de ubicación física sin perder
    trazabilidad.
-   **Flujo principal:** seleccionar lote/tambor → origen → destino →
    fecha → confirmar.
-   **Flujo alternativo:** ubicación inexistente; stock insuficiente;
    lote bloqueado.
-   **Prioridad:** **MVP**

## CU-26 --- Registrar fraccionamiento

-   **Actores:** Fraccionador.
-   **Descripción:** Relacionar uno o más lotes de materia prima con
    productos resultantes.
-   **Flujo principal:** seleccionar lotes → informar proceso → cantidad
    → producto → crear relación lote-origen/producto.
-   **Flujo alternativo:** cantidades inconsistentes; producto no
    autorizado; lote bloqueado.
-   **Prioridad:** **Futuro**

## CU-27 --- Asociar RNE/RNPA

-   **Actores:** Fraccionador, Administrador, SIFeGA.
-   **Descripción:** Registrar o consultar identificadores sanitarios de
    establecimiento y producto.
-   **Flujo principal:** ingresar RNE/RNPA → validar fuente → asociar
    establecimiento/producto.
-   **Flujo alternativo:** registro no encontrado; registro vencido/no
    vigente; jurisdicción no integrada.
-   **Prioridad:** **Futuro**

> SIFeGA gestiona información y trámites relacionados con
> establecimientos y productos alimenticios; su cobertura depende de las
> jurisdicciones integradas. citeturn0search0turn0search3

------------------------------------------------------------------------

# 8. Facturación y comercialización

## CU-28 --- Registrar operación comercial

-   **Actores:** Productor, Acopiador, Fraccionador, Exportador.
-   **Descripción:** Registrar la operación comercial relacionada con
    productos/lotes.
-   **Flujo principal:** seleccionar vendedor → comprador →
    producto/lote → cantidad → precio → guardar.
-   **Flujo alternativo:** cliente/proveedor inexistente; lote no
    disponible; cantidades inconsistentes.
-   **Prioridad:** **MVP básico**

## CU-29 --- Emitir factura electrónica

-   **Actores:** Usuario comercial, ARCA.
-   **Descripción:** Preparar y, en una fase de integración, autorizar
    un comprobante fiscal electrónico.
-   **Flujo principal:** seleccionar operación → generar comprobante →
    enviar a ARCA → recibir autorización → guardar CAE/datos.
-   **Flujo alternativo:** rechazo fiscal; servicio no disponible; datos
    fiscales inválidos.
-   **Prioridad:** **Futuro**

> ARCA define la factura electrónica como comprobante digital legalmente
> equivalente al papel y dispone servicios específicos de emisión y
> autorización. citeturn0search12turn0search18

------------------------------------------------------------------------

# 9. Integraciones institucionales

## CU-30 --- Sincronizar información con SENASA

-   **Actores:** Plataforma, SENASA/SIGSA.
-   **Descripción:** Intercambiar información autorizada con los
    servicios oficiales disponibles.
-   **Flujo principal:** preparar solicitud → autenticar →
    enviar/consultar → validar respuesta → registrar fuente y fecha de
    sincronización.
-   **Flujo alternativo:** servicio no disponible; credenciales
    inválidas; respuesta inconsistente; versión de servicio
    incompatible.
-   **Prioridad:** **MVP / integración progresiva**

## CU-31 --- Sincronizar identidad fiscal con ARCA

-   **Actores:** Plataforma, ARCA.
-   **Descripción:** Validar o utilizar datos fiscales necesarios para
    operaciones autorizadas.
-   **Flujo principal:** solicitar → autenticar → consultar → validar →
    almacenar referencia externa.
-   **Flujo alternativo:** CUIT inválida; servicio no disponible;
    autorización insuficiente.
-   **Prioridad:** **Futuro**

## CU-32 --- Consultar RNE/RNPA en SIFeGA

-   **Actores:** Plataforma, SIFeGA/autoridad sanitaria.
-   **Descripción:** Consultar información sanitaria alimentaria cuando
    el servicio o fuente pública/integrada lo permita.
-   **Flujo principal:** enviar identificador → consultar → recibir
    estado → registrar fecha/fuente.
-   **Flujo alternativo:** jurisdicción no integrada; registro
    inexistente; servicio no disponible.
-   **Prioridad:** **Futuro**

SIFeGA dispone de búsquedas públicas de establecimientos y productos
autorizados en las jurisdicciones que utilizan o vinculan información al
sistema. citeturn0search1turn0search7

------------------------------------------------------------------------

# 10. Auditoría y control

## CU-33 --- Registrar evento de auditoría

-   **Actores:** Sistema.
-   **Descripción:** Registrar automáticamente las operaciones
    relevantes.
-   **Flujo principal:** ocurre operación → capturar usuario →
    fecha/hora → entidad → operación → resultado → guardar.
-   **Flujo alternativo:** error de almacenamiento → reintento/alerta.
-   **Prioridad:** **MVP**

## CU-34 --- Consultar auditoría

-   **Actores:** Administrador, Auditor autorizado.
-   **Descripción:** Consultar el historial de modificaciones.
-   **Flujo principal:** filtrar por usuario/entidad/fecha → consultar →
    visualizar.
-   **Flujo alternativo:** sin permisos; sin resultados.
-   **Prioridad:** **MVP**

## CU-35 --- Detectar inconsistencia de trazabilidad

-   **Actores:** Sistema, Administrador.
-   **Descripción:** Detectar relaciones imposibles o sospechosas.
-   **Ejemplos:**
    -   movimiento con destino inexistente;
    -   lote sin origen;
    -   tambor asociado a lote inexistente;
    -   cantidad de salida mayor que stock;
    -   DT-e incompatible con el movimiento.
-   **Flujo principal:** evento registrado → reglas → detectar
    inconsistencia → generar alerta.
-   **Flujo alternativo:** falso positivo → marcar para revisión.
-   **Prioridad:** **Futuro**

------------------------------------------------------------------------

# 11. Exportación

## CU-36 --- Preparar expediente de exportación

-   **Actores:** Exportador, Administrador.
-   **Descripción:** Consolidar lotes y documentación para una operación
    de exportación.
-   **Flujo principal:** seleccionar lotes → verificar trazabilidad →
    documentación → consolidar expediente → validar.
-   **Flujo alternativo:** lote sin trazabilidad completa; documentación
    faltante; análisis pendiente.
-   **Prioridad:** **Futuro**

## CU-37 --- Consultar trazabilidad de exportación

-   **Actores:** Exportador, Auditor autorizado.
-   **Descripción:** Reconstruir el origen de una partida exportada.
-   **Flujo principal:** seleccionar exportación → partida → lotes →
    tambores → movimientos → origen.
-   **Flujo alternativo:** información faltante o inconsistente.
-   **Prioridad:** **Futuro**

------------------------------------------------------------------------

# 12. Resumen de prioridades

  ID      Caso de uso                          Prioridad
  ------- ------------------------------------ ------------------
  CU-01   Registrar usuario                    MVP
  CU-02   Autenticar usuario                   MVP
  CU-03   Roles y permisos                     MVP
  CU-04   Registrar productor                  MVP
  CU-05   Asociar RENAPA                       MVP
  CU-06   Registrar establecimiento / RENSPA   MVP
  CU-07   Registrar apiario                    MVP
  CU-08   Administrar colmenas                 MVP
  CU-09   Crear movimiento                     MVP
  CU-10   Gestionar DT-e                       MVP / progresivo
  CU-11   Recibir movimiento                   MVP
  CU-12   Cerrar DT-e                          MVP / progresivo
  CU-13   Registrar extracción                 MVP
  CU-14   Crear lote                           MVP
  CU-15   Asociar entradas a lote              MVP
  CU-16   Registrar tambor                     MVP
  CU-17   Trazabilidad hacia atrás             MVP
  CU-18   Trazabilidad hacia adelante          MVP
  CU-19   Historial                            MVP
  CU-20   QR                                   Futuro
  CU-21   Registrar muestra                    MVP básico
  CU-22   Resultado de análisis                Futuro
  CU-23   Estado de calidad                    Futuro
  CU-24   Recepción en acopio                  MVP
  CU-25   Transferir ubicación                 MVP
  CU-26   Fraccionamiento                      Futuro
  CU-27   RNE/RNPA                             Futuro
  CU-28   Operación comercial                  MVP básico
  CU-29   Factura electrónica                  Futuro
  CU-30   Integración SENASA                   MVP / progresivo
  CU-31   Integración ARCA                     Futuro
  CU-32   Integración SIFeGA                   Futuro
  CU-33   Auditoría automática                 MVP
  CU-34   Consulta de auditoría                MVP
  CU-35   Detección de inconsistencias         Futuro
  CU-36   Expediente de exportación            Futuro
  CU-37   Trazabilidad de exportación          Futuro

------------------------------------------------------------------------

# 13. Casos de uso críticos para validar el dominio

Antes de comenzar el desarrollo, hay seis casos que deberían utilizarse
como **prueba de consistencia del modelo**:

1.  **CU-04 --- Registrar productor**
2.  **CU-06 --- Registrar establecimiento / RENSPA**
3.  **CU-07 --- Registrar apiario**
4.  **CU-09 --- Crear movimiento**
5.  **CU-10/CU-12 --- Gestionar y cerrar DT-e**
6.  **CU-13/CU-14 --- Registrar extracción y crear lote**
7.  **CU-17 --- Trazabilidad hacia atrás**
8.  **CU-18 --- Trazabilidad hacia adelante**

Si estos casos pueden ejecutarse correctamente, tendremos una primera
columna vertebral funcional del sistema:

``` text
PRODUCTOR
   ↓
RENAPA
   ↓
RENSPA
   ↓
APIARIO
   ↓
MOVIMIENTO
   ↓
DT-e
   ↓
SALA
   ↓
EXTRACCIÓN
   ↓
LOTE
   ↓
TAMBOR
   ↓
TRAZABILIDAD
```

------------------------------------------------------------------------

# 14. Próximo artefacto recomendado

El siguiente documento de análisis debería ser el **Modelo de Dominio
Detallado**, tomando estos casos de uso como fuente.

De allí se derivarán:

``` text
Casos de uso
     ↓
Entidades
     ↓
Relaciones y cardinalidades
     ↓
Reglas de negocio
     ↓
Estados
     ↓
Eventos
     ↓
Modelo ER
     ↓
Base de datos PostgreSQL
     ↓
APIs
```

Esto evita cometer un error frecuente: diseñar la base de datos primero
y descubrir después que el modelo no puede representar correctamente la
trazabilidad.
