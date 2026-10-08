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

**Modelo:** Opus 5.5 xHigh
**Herramienta:** Claude Code

```text
Trabaja únicamente sobre el requisito "Lo que cada tarea muestra de su responsable" de openspec/specs/tasks/spec.md. No revises otros requisitos de la capability tasks.

Quiero construir una matriz de trazabilidad scenario a scenario. Para cada uno de los tres scenarios de ese requisito:

1. Localiza si existe algún test que pretenda cubrirlo.
2. Abre y lee el test; no infieras cobertura por el nombre.
3. Identifica qué assertions concretas demuestran, o no, lo que exige el scenario.
4. Clasifícalo únicamente como "Cubierto", "No cubierto" o "No lo sé".
5. Si es "No lo sé", explica brevemente qué evidencia falta para decidirlo.

Actualiza docs/verificacion/EPJ.md añadiendo la matriz de cuatro columnas:
Scenario | Test que lo cubre | Estado | Qué te faltó

Conserva intacta la estimación inicial que ya existe en ese archivo.

En este paso no escribas tests nuevos, no modifiques código de producción y no revises requisitos distintos del indicado. Quiero primero saber qué está probado de verdad con la suite actual.
```

## Prompt 2

**Modelo:** Opus 5.5 xHigh
**Herramienta:** Claude Code

```text
Continúa únicamente con el requisito "Lo que cada tarea muestra de su responsable" de openspec/specs/tasks/spec.md.

La matriz de docs/verificacion/EPJ.md ya determinó que los 3 scenarios no estaban cubiertos por la suite original. No cambies esa conclusión ni la estimación inicial.

Ahora realiza la parte A.2 del ejercicio:

- Escribe un test funcional por cada scenario marcado como "No cubierto".
- Los tests deben ir únicamente en backend/tests/functional/tasks/.
- Sigue el estilo y las convenciones de los tests funcionales existentes en backend/tests/functional/auth/.
- Cada test debe comprobar mediante assertions exactamente lo que exige su scenario, no solo que la petición responde 200.
- Para el scenario "La tarea no filtra datos de cuenta", respeta literalmente que la regla aplica tanto a una tarea suelta como a una tarea dentro de la lista.
- Puedes inspeccionar el código de producción para entender cómo preparar los datos y usar la API, pero NO modifiques ningún archivo fuera de backend/tests/.
- No cambies código de producción aunque un test falle.
- No debilites ni ajustes un test para hacerlo pasar si la implementación incumple la spec.
- Ejecuta los tests que escribas y deja cualquier fallo en rojo.

Al terminar, dime:
1. qué archivos de tests creaste,
2. qué test corresponde a cada scenario,
3. cuáles pasan y cuáles fallan,
4. para cada fallo, qué esperaba el test y qué obtuvo realmente.

No hagas commit ni pull request.
```

**Qué salió:** creó `backend/tests/functional/tasks/assignee.spec.ts` con un test por scenario; 2 pasan y 1 falla porque la lista de tareas expone `assignee.email`. El fallo se dejó en rojo y no se modificó código de producción.