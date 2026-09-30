# Cuentas y acceso

## Purpose

Permite a una persona crear una cuenta en FlowSync, identificarse con ella, mantener y cerrar su sesión y consultar su perfil. Es la puerta de entrada que decide quién puede acceder a las partes privadas de la aplicación.

## Requirements

### Requirement: Registro de cuenta

El sistema SHALL permitir crear una cuenta nueva a partir de un email, una contraseña con su confirmación y un nombre completo opcional, dejando a la persona con la sesión ya iniciada.

#### Scenario: Registro correcto desde la pantalla de registro

- **WHEN** una persona sin sesión abre la pantalla de registro, introduce un email no registrado, una contraseña de entre 8 y 32 caracteres, la misma contraseña en "Repite la contraseña" y pulsa "Crear cuenta"
- **THEN** se crea la cuenta, la sesión queda iniciada sin pasar por la pantalla de login y se la lleva a la pantalla de perfil

#### Scenario: Registro sin nombre completo

- **WHEN** una persona completa el registro dejando vacío (o solo con espacios) el campo "Nombre completo"
- **THEN** la cuenta se crea igualmente y su perfil no tiene nombre

#### Scenario: Respuesta de la API al registrar

- **WHEN** un cliente envía a la API de registro unos datos válidos
- **THEN** la respuesta, envuelta en un objeto `data`, contiene los datos públicos del usuario creado y un token de acceso con el que autenticar las siguientes peticiones

### Requirement: Validación de los datos de registro

El sistema SHALL rechazar el registro cuando los datos no cumplen las reglas, sin crear la cuenta, e indicar el motivo junto al campo afectado.

#### Scenario: Email ya registrado

- **WHEN** una persona intenta registrarse con un email que ya pertenece a una cuenta
- **THEN** no se crea la cuenta y bajo el campo email aparece "Ese email ya está registrado. Inicia sesión en su lugar."

#### Scenario: Email con formato inválido

- **WHEN** una persona intenta registrarse con un texto que no es una dirección de email válida
- **THEN** no se crea la cuenta y bajo el campo email aparece "Introduce una dirección de email válida."

#### Scenario: Email demasiado largo

- **WHEN** una persona intenta registrarse con un email de más de 254 caracteres
- **THEN** no se crea la cuenta y bajo el campo email aparece un aviso de que no puede superar los 254 caracteres

#### Scenario: Contraseña demasiado corta o demasiado larga

- **WHEN** una persona intenta registrarse con una contraseña de menos de 8 o de más de 32 caracteres
- **THEN** no se crea la cuenta y bajo el campo contraseña aparece un aviso indicando el mínimo de 8 o el máximo de 32 caracteres

#### Scenario: Campo obligatorio vacío

- **WHEN** una persona intenta registrarse dejando vacío el email o la contraseña
- **THEN** no se crea la cuenta y bajo el campo afectado aparece "Falta rellenar …" seguido del nombre del campo

#### Scenario: Pista de longitud de contraseña

- **WHEN** una persona está en la pantalla de registro y no hay error en el campo contraseña
- **THEN** bajo ese campo se muestra la indicación "Entre 8 y 32 caracteres."

#### Scenario: Errores mostrados por campo

- **WHEN** el registro se rechaza por errores de validación que afectan solo a campos visibles del formulario
- **THEN** cada error se muestra bajo su campo y no aparece un aviso general

### Requirement: Coincidencia de contraseña y confirmación

El sistema SHALL exigir que la confirmación de la contraseña coincida con la contraseña para completar el registro.

#### Scenario: Confirmación distinta en la pantalla de registro

- **WHEN** una persona rellena "Contraseña" y "Repite la contraseña" con valores distintos y pulsa "Crear cuenta"
- **THEN** no se envía la solicitud, no se crea la cuenta y bajo "Repite la contraseña" aparece "Las contraseñas no coinciden."

#### Scenario: Confirmación distinta enviada directamente a la API

- **WHEN** un cliente envía a la API de registro una confirmación que no coincide con la contraseña
- **THEN** la API rechaza el registro con un error de validación sobre el campo de confirmación y no crea la cuenta

### Requirement: Inicio de sesión

El sistema SHALL permitir iniciar sesión con el email y la contraseña de una cuenta existente.

#### Scenario: Credenciales correctas desde la pantalla de login

- **WHEN** una persona sin sesión abre la pantalla de login, introduce el email y la contraseña de una cuenta existente y pulsa "Entrar"
- **THEN** la sesión queda iniciada y se la lleva a la pantalla de perfil

#### Scenario: Respuesta de la API al iniciar sesión

- **WHEN** un cliente envía a la API de login unas credenciales correctas
- **THEN** la respuesta, envuelta en un objeto `data`, contiene los datos públicos del usuario y un token de acceso nuevo

### Requirement: Rechazo de credenciales incorrectas

El sistema SHALL rechazar el inicio de sesión cuando el email no corresponde a ninguna cuenta o la contraseña no es la correcta, sin revelar cuál de los dos ha fallado.

#### Scenario: Contraseña incorrecta

- **WHEN** una persona intenta iniciar sesión con el email de una cuenta existente y una contraseña que no es la suya
- **THEN** no se inicia sesión y aparece un aviso general "El email o la contraseña no son correctos."

#### Scenario: Email no registrado

- **WHEN** una persona intenta iniciar sesión con un email que no pertenece a ninguna cuenta
- **THEN** no se inicia sesión y aparece el mismo aviso general "El email o la contraseña no son correctos."

### Requirement: Validación de los datos de login

El sistema SHALL rechazar el intento de login con datos mal formados antes de comprobar las credenciales, indicando el motivo junto al campo afectado.

#### Scenario: Email con formato inválido en el login

- **WHEN** una persona intenta iniciar sesión con un texto que no es una dirección de email válida
- **THEN** no se inicia sesión y bajo el campo email aparece "Introduce una dirección de email válida."

#### Scenario: Campos vacíos en el login

- **WHEN** una persona pulsa "Entrar" con el email o la contraseña vacíos
- **THEN** no se inicia sesión y bajo el campo vacío aparece "Falta rellenar …" seguido del nombre del campo

### Requirement: Estado de envío de los formularios de acceso

El sistema SHALL indicar que una solicitud de login o registro está en curso e impedir reenviarla mientras tanto.

#### Scenario: Login en curso

- **WHEN** una persona pulsa "Entrar" y la respuesta aún no ha llegado
- **THEN** el botón muestra "Entrando…" y está deshabilitado

#### Scenario: Registro en curso

- **WHEN** una persona pulsa "Crear cuenta" y la respuesta aún no ha llegado
- **THEN** el botón muestra "Creando cuenta…" y está deshabilitado

#### Scenario: Fin del envío con error

- **WHEN** la solicitud de login o registro termina con un error
- **THEN** el botón vuelve a estar habilitado con su texto original y se muestran los errores correspondientes

### Requirement: Navegación entre login y registro

El sistema SHALL ofrecer un enlace desde cada pantalla de acceso hacia la otra.

#### Scenario: Del login al registro

- **WHEN** una persona sin sesión está en la pantalla de login y pulsa "Crea una"
- **THEN** se la lleva a la pantalla de registro

#### Scenario: Del registro al login

- **WHEN** una persona sin sesión está en la pantalla de registro y pulsa "Inicia sesión"
- **THEN** se la lleva a la pantalla de login

### Requirement: Consulta del perfil

El sistema SHALL devolver los datos públicos de la cuenta autenticada: identificador, nombre completo (o vacío), email, iniciales, fecha de creación y fecha de última actualización, y nunca la contraseña.

#### Scenario: Perfil con token válido

- **WHEN** un cliente pide el perfil a la API enviando un token de acceso válido
- **THEN** recibe, envuelto en un objeto `data`, el identificador, el nombre completo, el email, las iniciales y las fechas de creación y actualización de esa cuenta, sin la contraseña

#### Scenario: Perfil sin token o con token no válido

- **WHEN** un cliente pide el perfil a la API sin token, con un token inexistente o con un token ya revocado
- **THEN** la API responde con un error de acceso no autorizado (401) y no devuelve datos de ninguna cuenta

### Requirement: Cálculo de las iniciales

El sistema SHALL derivar las iniciales de la cuenta a partir de su nombre completo o, si no tiene, de su email, siempre en mayúsculas.

#### Scenario: Nombre con al menos dos palabras

- **WHEN** una cuenta tiene como nombre completo "Ada Lovelace"
- **THEN** sus iniciales son "AL" (primera letra de las dos primeras palabras)

#### Scenario: Nombre de una sola palabra

- **WHEN** una cuenta tiene como nombre completo una sola palabra, por ejemplo "Ada"
- **THEN** sus iniciales son las dos primeras letras de esa palabra en mayúsculas ("AD")

#### Scenario: Cuenta sin nombre

- **WHEN** una cuenta no tiene nombre completo y su email es "ada@flowsync.dev"
- **THEN** sus iniciales son la primera letra de la parte anterior a la arroba y la primera letra de la parte posterior, en mayúsculas ("AF")

### Requirement: Pantalla de perfil

El sistema SHALL mostrar a la persona con sesión iniciada una pantalla con sus datos de cuenta y la opción de cerrar sesión.

#### Scenario: Perfil con nombre

- **WHEN** una persona con sesión iniciada abre la pantalla de perfil y su cuenta tiene nombre completo
- **THEN** ve sus iniciales, su nombre completo, su email y "Miembro desde" seguido de la fecha de creación de la cuenta en formato largo en castellano (por ejemplo "30 de septiembre de 2026")

#### Scenario: Perfil sin nombre

- **WHEN** una persona con sesión iniciada abre la pantalla de perfil y su cuenta no tiene nombre completo
- **THEN** en lugar del nombre ve el texto "Sin nombre"

### Requirement: Cierre de sesión

El sistema SHALL permitir cerrar la sesión actual, invalidando en el servidor el token con el que se hizo la petición y dejando a la persona fuera de la zona privada.

#### Scenario: Cerrar sesión desde el perfil

- **WHEN** una persona con sesión iniciada pulsa "Cerrar sesión" en la pantalla de perfil
- **THEN** el botón muestra "Cerrando sesión…", la sesión se cierra y se la lleva a la pantalla de login

#### Scenario: El token revocado deja de servir

- **WHEN** un cliente cierra sesión con un token y después usa ese mismo token para pedir el perfil
- **THEN** la API responde con un error de acceso no autorizado (401)

#### Scenario: Otras sesiones de la misma cuenta siguen activas

- **WHEN** una misma cuenta tiene sesión iniciada con dos tokens distintos (por ejemplo, en dos navegadores) y cierra sesión con uno de ellos
- **THEN** el otro token sigue siendo válido para pedir el perfil

#### Scenario: Cierre de sesión con el servidor inaccesible

- **WHEN** una persona pulsa "Cerrar sesión" y el servidor no responde o devuelve un error
- **THEN** la sesión se cierra igualmente en la aplicación y se la lleva a la pantalla de login

#### Scenario: Cierre de sesión en la API sin token

- **WHEN** un cliente llama a la API de cierre de sesión sin un token válido
- **THEN** la API responde con un error de acceso no autorizado (401)

### Requirement: Varias sesiones simultáneas por cuenta

El sistema SHALL emitir un token de acceso nuevo e independiente en cada registro o inicio de sesión correcto, sin invalidar los anteriores.

#### Scenario: Dos inicios de sesión seguidos

- **WHEN** una persona inicia sesión dos veces con la misma cuenta
- **THEN** obtiene dos tokens distintos y ambos permiten consultar el perfil

### Requirement: Persistencia de la sesión en el navegador

El sistema SHALL conservar la sesión iniciada al recargar la página o volver a abrir la aplicación en el mismo navegador, verificándola contra el servidor antes de dar acceso.

#### Scenario: Recarga con sesión válida

- **WHEN** una persona con sesión iniciada recarga la página o vuelve a abrir la aplicación en el mismo navegador
- **THEN** ve un indicador de carga mientras se comprueba la sesión y, al confirmarse, sigue dentro con sus datos de perfil sin volver a introducir credenciales

#### Scenario: Sesión que el servidor ya no reconoce

- **WHEN** una persona abre la aplicación con una sesión guardada cuyo token el servidor rechaza (por ejemplo, porque se revocó desde otro lugar)
- **THEN** la sesión guardada se descarta, se la lleva a la pantalla de login y allí aparece el aviso "Tu sesión ha caducado. Vuelve a iniciar sesión."

#### Scenario: Servidor inaccesible al restaurar la sesión

- **WHEN** una persona abre la aplicación con una sesión guardada y el servidor no está disponible
- **THEN** se la lleva a la pantalla de login con el aviso "No se pudo conectar con el servidor. Comprueba que el backend está arrancado.", y la sesión guardada no se descarta, de modo que al recargar con el servidor ya disponible vuelve a estar dentro

#### Scenario: Aviso de sesión perdida al volver a entrar

- **WHEN** se muestra en el login un aviso de sesión perdida y la persona inicia sesión correctamente
- **THEN** el aviso desaparece

### Requirement: Protección de las pantallas privadas

El sistema SHALL permitir el acceso a la pantalla de perfil solo con sesión iniciada y redirigir a la pantalla de login a quien no la tenga.

#### Scenario: Acceso al perfil sin sesión

- **WHEN** una persona sin sesión intenta abrir la pantalla de perfil
- **THEN** se la lleva a la pantalla de login

#### Scenario: Comprobación de sesión en curso

- **WHEN** una persona abre una pantalla protegida mientras todavía se está comprobando su sesión guardada
- **THEN** ve un indicador de carga y no se la redirige hasta que la comprobación termina

### Requirement: Pantallas de acceso solo para quien no tiene sesión

El sistema SHALL impedir que una persona con sesión iniciada vea las pantallas de login y registro, llevándola a su perfil.

#### Scenario: Abrir login o registro con sesión iniciada

- **WHEN** una persona con sesión iniciada intenta abrir la pantalla de login o la de registro
- **THEN** se la lleva a la pantalla de perfil

### Requirement: Direcciones no reconocidas

El sistema SHALL redirigir cualquier dirección de la aplicación que no corresponda a una pantalla conocida hacia la pantalla de perfil, que a su vez aplica la protección por sesión.

#### Scenario: Dirección desconocida con sesión

- **WHEN** una persona con sesión iniciada abre una dirección inexistente o la raíz de la aplicación
- **THEN** se la lleva a la pantalla de perfil

#### Scenario: Dirección desconocida sin sesión

- **WHEN** una persona sin sesión abre una dirección inexistente o la raíz de la aplicación
- **THEN** acaba en la pantalla de login

### Requirement: Errores de comunicación en los flujos de acceso

El sistema SHALL informar con un aviso comprensible cuando el login o el registro no pueden completarse por un problema de conexión o del servidor.

#### Scenario: Servidor no alcanzable

- **WHEN** una persona intenta iniciar sesión o registrarse y el servidor no responde
- **THEN** aparece el aviso general "No se pudo conectar con el servidor. Comprueba que el backend está arrancado."

#### Scenario: Error inesperado del servidor

- **WHEN** una persona intenta iniciar sesión o registrarse y el servidor responde con un error no relacionado con la validación ni con las credenciales
- **THEN** aparece el aviso general "Algo ha ido mal en el servidor. Inténtalo de nuevo en un momento."

## Auditoría

### Requisitos revisados

- Requisitos escritos por el agente: 18.
- Requisitos verificados personalmente abriendo y contrastando el código: 11.

### Inconsistencias encontradas

- El frontend muestra "Tu sesión ha caducado. Vuelve a iniciar sesión." ante cualquier respuesta 401 al restaurar una sesión, aunque en la configuración observada no hay una caducidad temporal de los tokens; un 401 también puede corresponder a un token inválido o revocado. Es visible al contrastar `frontend/src/lib/api.ts` con la configuración y gestión de tokens del backend.

### Comportamiento que no pude decidir si es bug o contrato

- No pude determinar si la sensibilidad a mayúsculas y minúsculas del email debe considerarse un bug o parte del contrato. Una lectura es que el sistema acepta el email tal como se proporciona y, al no normalizarlo explícitamente, podría distinguir direcciones que solo cambien en mayúsculas/minúsculas. La otra lectura es que las direcciones deberían tratarse como la misma identidad independientemente de las mayúsculas y que la ausencia de normalización sería un defecto. El código revisado no permite decidir con seguridad cuál de las dos interpretaciones es la intención del producto.

