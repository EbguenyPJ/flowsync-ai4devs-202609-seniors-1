# Verificación — Lo que cada tarea muestra de su responsable

Scenarios en el requisito: 3 · Cubiertos: 0

Estimación inicial de scenarios cubiertos: 2

## Matriz de trazabilidad

Requisito: «Lo que cada tarea muestra de su responsable» (`openspec/specs/tasks/spec.md`). Suite revisada: los cuatro ficheros que existen, `backend/tests/functional/auth/{signup,login,session,initials}.spec.ts`, leídos completos. Ninguno toca una ruta `/api/v1/tasks`, ni crea una tarea, ni lee un `assignee` (`grep -i "task\|assignee"` sobre `backend/tests/` no da ningún resultado). El frontend no tiene runner de tests.

| Scenario | Test que lo cubre | Estado | Qué te faltó |
|---|---|---|---|
| Responsable identificable |  | No cubierto | - |
| La tarea no filtra datos de cuenta |  | No cubierto | - |
| Responsable sin nombre |  | No cubierto |  |

Creía cubiertos: 2 · Cubiertos realmente por la suite original: 0
No tuve un caso ambiguo entre “falta test” y “falta regla”: los tres behaviors estaban explícitos en la spec y ninguno tenía cobertura en la suite original.
En «La tarea no filtra datos de cuenta», la spec no enumera qué cuenta exactamente como “otro dato de acceso”; al escribir el test tuve que decidir comprobar `password`, `token` y `accessTokens` además del `email`.