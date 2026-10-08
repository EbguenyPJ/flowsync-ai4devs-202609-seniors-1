import Task from '#models/task'
import User from '#models/user'
import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'

/**
 * Lo que cada tarea muestra de su responsable. Cubre los tres scenarios del
 * requisito «Lo que cada tarea muestra de su responsable» de
 * `openspec/specs/tasks/spec.md`: el responsable identificable, la tarea que no
 * filtra datos de cuenta y el responsable sin nombre.
 *
 * Una tarea se «obtiene» por dos caminos, suelta (`GET /tasks/:id`) y dentro de
 * la lista (`GET /tasks`), y el requisito no distingue entre ellos: cada test
 * mira los dos.
 *
 * Quien consulta es siempre una cuenta distinta del responsable, para que nada
 * de lo comprobado pueda salir de la sesión de quien pide.
 */
test.group('Tasks | responsable', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  const today = '2026-10-07'

  async function sesion(client: any) {
    const email = 'quien-mira@example.com'
    await User.create({ fullName: 'Grace Hopper', email, password: 'secreto123' })

    const response = await client.post('/api/v1/auth/login').json({ email, password: 'secreto123' })

    return response.body().data.token as string
  }

  async function tareaDe(responsable: User) {
    return Task.create({
      title: 'Revisar el informe',
      status: 'pending',
      assigneeId: responsable.id,
    })
  }

  async function suelta(client: any, token: string, task: Task) {
    const response = await client
      .get(`/api/v1/tasks/${task.id}`)
      .qs({ today })
      .header('Authorization', `Bearer ${token}`)

    response.assertStatus(200)
    return response.body().data
  }

  async function lista(client: any, token: string) {
    const response = await client.get('/api/v1/tasks').header('Authorization', `Bearer ${token}`)

    response.assertStatus(200)
    return response.body().data as any[]
  }

  async function enLaLista(client: any, token: string, task: Task) {
    const encontrada = (await lista(client, token)).find((item) => item.id === task.id)
    if (!encontrada) {
      throw new Error(`la tarea ${task.id} no aparece en la lista`)
    }
    return encontrada
  }

  test('el responsable llega con su nombre y sus iniciales', async ({ client, assert }) => {
    const ada = await User.create({
      fullName: 'Ada Lovelace',
      email: 'ada@example.com',
      password: 'secreto123',
    })
    const task = await tareaDe(ada)
    const token = await sesion(client)

    for (const tarea of [await suelta(client, token, task), await enLaLista(client, token, task)]) {
      assert.equal(tarea.assignee.fullName, 'Ada Lovelace')
      assert.equal(tarea.assignee.initials, 'AL')
    }
  })

  test('el responsable no trae el email ni ningún dato de acceso, ni suelta ni en la lista', async ({
    client,
    assert,
  }) => {
    const ada = await User.create({
      fullName: 'Ada Lovelace',
      email: 'ada@example.com',
      password: 'secreto123',
    })
    const task = await tareaDe(ada)
    const token = await sesion(client)

    const tarea = await suelta(client, token, task)
    const tareas = await lista(client, token)

    // El scenario dice «cualquier tarea»: dentro de la lista se miran todas, no
    // solo la que se acaba de crear.
    assert.isTrue(tareas.some((item) => item.id === task.id))

    for (const { assignee } of [tarea, ...tareas]) {
      assert.notProperty(assignee, 'email')
      assert.notProperty(assignee, 'password')
      assert.notProperty(assignee, 'token')
      assert.notProperty(assignee, 'accessTokens')

      // Por si el dato llegara bajo otra clave: ni el email ni la contraseña
      // pueden aparecer en ninguna parte del responsable.
      const serializado = JSON.stringify(assignee)
      assert.notInclude(serializado, '@')
      assert.notInclude(serializado, 'secreto123')
      assert.notInclude(serializado, token)
    }
  })

  test('sin nombre, el nombre llega nulo y las iniciales siguen llegando', async ({
    client,
    assert,
  }) => {
    const sinNombre = await User.create({
      fullName: null,
      email: 'sin-nombre@example.com',
      password: 'secreto123',
    })
    const task = await tareaDe(sinNombre)
    const token = await sesion(client)

    for (const tarea of [await suelta(client, token, task), await enLaLista(client, token, task)]) {
      // Nulo de verdad: la clave tiene que estar, no basta con que falte.
      assert.property(tarea.assignee, 'fullName')
      assert.isNull(tarea.assignee.fullName)

      assert.isString(tarea.assignee.initials)
      assert.isNotEmpty(tarea.assignee.initials)
    }
  })
})
