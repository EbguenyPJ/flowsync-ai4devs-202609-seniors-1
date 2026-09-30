# Prompts

Aquí van **todos los prompts que lanzaste** para hacer el ejercicio, en el orden en que los
lanzaste, con el modelo y la herramienta de cada uno.

Esto no es papeleo. Lo que se revisa es **cómo pediste las cosas**, no solo lo que salió: un
resultado flojo con un prompt bueno y un resultado flojo con un prompt vago necesitan feedback
distinto, y sin este archivo no se distinguen.

## Cómo rellenarlo

- Un apartado `## Prompt N` por cada prompt.
- **Pega el prompt tal cual lo lanzaste**, dentro del bloque de código, aunque ocupe diez líneas
  y aunque tenga faltas. No lo reescribas para que quede bien: el que arreglaste mentalmente
  después no es el que lanzaste.
- Incluye también los que **no funcionaron**. Suelen ser los más útiles de leer.
- `Modelo` y `Herramienta` en todos. Si cambiaste de una a otra a mitad, se nota aquí.

Borra el ejemplo de abajo cuando escribas el primero.

---


## Prompt 1

**Modelo:** Opus 5.5
**Herramienta:** Claude Code

```
Analiza el vertical completo de cuentas y acceso de FlowSync tal como está implementado hoy.
Quiero que estudies las dos capas:
- backend: rutas, controladores, modelo de usuario, validadores y middlewares relacionados con registro, inicio de sesión, sesión y perfil;
- frontend: pantallas de acceso, estado de sesión y protección de rutas relacionadas con esos mismos flujos.
No modifiques ningún archivo de código ni propongas mejoras. No describas la implementación interna en la spec.
A partir únicamente del comportamiento que puedas inferir del código actual, escribe una spec viva del comportamiento observable del sistema en castellano.
El formato debe ser exactamente:
Purpose
Una o dos frases explicando para qué existe esta capability.
Requirements
Requirement: <nombre>
El sistema SHALL <comportamiento observable>.
Scenario: <nombre>
- WHEN <situación observable, incluyendo aquí las precondiciones necesarias>
- THEN <resultado observable>
Cada requisito debe tener al menos un escenario.
Reglas:
- describe solo comportamiento observable desde fuera;
- no incluyas nombres de archivos, clases, funciones ni detalles de implementación;
- no uses secciones ADDED, MODIFIED ni REMOVED;
- limítate exclusivamente a cuentas y acceso: registro, login, sesión y perfil;
- no inventes comportamiento que no puedas sostener a partir del código;
- si algo no se puede determinar con seguridad, no lo rellenes por intuición: señálalo.
Crea el resultado en docs/spec-viva/EPJ.md.
Al terminar, dime cuántos requisitos has escrito, pero no modifiques nada más.
```

**Qué salió:** Funcionó a la primera y generó una spec con 18 requisitos; durante la revisión manual alcancé a verificar 11 antes de que terminara el tiempo.