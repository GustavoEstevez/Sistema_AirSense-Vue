import { adminClient, corsHeaders, json } from '../_shared/airsense.ts'

const VALID_STATUS = new Set(['active', 'inactive'])
const PAGE_SIZE_MAX = 100

function clean(value: unknown, max = 160) {
  return String(value ?? '').trim().slice(0, max)
}

async function requireAdmin(request: Request) {
  const authorization = request.headers.get('authorization') || ''
  const token = authorization.replace(/^Bearer\s+/i, '').trim()
  if (!token) throw new Error('AUTH_REQUIRED')
  const admin = adminClient()
  const { data: { user }, error } = await admin.auth.getUser(token)
  if (error || !user) throw new Error('AUTH_REQUIRED')
  const { data: profile } = await admin
    .from('profiles')
    .select('id, role_slug, status')
    .eq('id', user.id)
    .maybeSingle()
  if (!profile || profile.status !== 'active' || profile.role_slug !== 'admin') throw new Error('FORBIDDEN')
  return { admin, actorId: user.id }
}

async function activeAdminCount(admin: ReturnType<typeof adminClient>) {
  const { count, error } = await admin
    .from('profiles')
    .select('id', { count: 'exact', head: true })
    .eq('role_slug', 'admin')
    .eq('status', 'active')
  if (error) throw error
  return count ?? 0
}

async function audit(admin: ReturnType<typeof adminClient>, actorId: string, targetId: string, action: string, details: Record<string, unknown>) {
  const { error } = await admin.from('admin_audit_log').insert({
    actor_id: actorId,
    target_id: targetId,
    action,
    details,
  })
  if (error) throw error
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders(request) })
  if (request.method !== 'POST') return json(request, { error: 'Método no permitido.' }, 405)

  try {
    const { admin, actorId } = await requireAdmin(request)
    const payload = await request.json().catch(() => ({})) as Record<string, unknown>
    const action = clean(payload.action, 40)

    if (action === 'list') {
      const page = Math.max(1, Number.parseInt(String(payload.page || 1), 10) || 1)
      const pageSize = Math.min(PAGE_SIZE_MAX, Math.max(1, Number.parseInt(String(payload.pageSize || 20), 10) || 20))
      const search = clean(payload.search, 120).replaceAll('%', '\\%').replaceAll('_', '\\_')
      const role = clean(payload.role, 40)
      const status = clean(payload.status, 20)
      let query = admin
        .from('profiles')
        .select('id, first_name, last_name, email, role_slug, status, created_at, updated_at, last_login_at', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range((page - 1) * pageSize, page * pageSize - 1)
      if (search) query = query.or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%`)
      if (role) query = query.eq('role_slug', role)
      if (status) query = query.eq('status', status)
      const { data, count, error } = await query
      if (error) throw error
      const { data: roles, error: rolesError } = await admin.from('app_roles').select('slug, name').order('name')
      if (rolesError) throw rolesError
      return json(request, { users: data ?? [], total: count ?? 0, page, pageSize, roles: roles ?? [] })
    }

    const targetId = clean(payload.userId, 80)
    if (!targetId) return json(request, { error: 'Usuario inválido.' }, 400)
    const { data: target, error: targetError } = await admin.from('profiles').select('*').eq('id', targetId).maybeSingle()
    if (targetError) throw targetError
    if (!target) return json(request, { error: 'Usuario no encontrado.' }, 404)

    if (action === 'update') {
      const firstName = clean(payload.firstName, 80)
      const lastName = clean(payload.lastName, 80)
      const role = clean(payload.role, 40)
      const status = clean(payload.status, 20)
      if (firstName.length < 2 || lastName.length < 2 || !VALID_STATUS.has(status)) {
        return json(request, { error: 'Datos de usuario inválidos.' }, 400)
      }
      const { data: roleExists } = await admin.from('app_roles').select('slug').eq('slug', role).maybeSingle()
      if (!roleExists) return json(request, { error: 'Rol inválido.' }, 400)
      const removesAdmin = target.role_slug === 'admin' && target.status === 'active' && (role !== 'admin' || status !== 'active')
      if (targetId === actorId && (role !== 'admin' || status !== 'active')) {
        return json(request, { error: 'No podés quitarte tus propios permisos ni desactivar tu cuenta.' }, 409)
      }
      if (removesAdmin && await activeAdminCount(admin) <= 1) {
        return json(request, { error: 'No se puede desactivar ni degradar al último administrador activo.' }, 409)
      }
      const changes = { first_name: firstName, last_name: lastName, role_slug: role, status }
      const { data: updated, error } = await admin.from('profiles').update(changes).eq('id', targetId).select().single()
      if (error) throw error
      await audit(admin, actorId, targetId, 'user.updated', { before: target, after: updated })
      return json(request, { user: updated })
    }

    if (action === 'delete') {
      if (targetId === actorId) return json(request, { error: 'No podés eliminar tu propia cuenta.' }, 409)
      if (target.role_slug === 'admin' && target.status === 'active' && await activeAdminCount(admin) <= 1) {
        return json(request, { error: 'No se puede eliminar al último administrador activo.' }, 409)
      }
      await audit(admin, actorId, targetId, 'user.deleted', { email: target.email, role: target.role_slug })
      const { error } = await admin.auth.admin.deleteUser(targetId)
      if (error) throw error
      return json(request, { ok: true })
    }

    return json(request, { error: 'Acción no reconocida.' }, 400)
  } catch (error) {
    console.error(error)
    const message = error instanceof Error ? error.message : ''
    if (message === 'AUTH_REQUIRED') return json(request, { error: 'Iniciá sesión para continuar.' }, 401)
    if (message === 'FORBIDDEN') return json(request, { error: 'No tenés permisos para realizar esta acción.' }, 403)
    return json(request, { error: 'No se pudo completar la operación administrativa.' }, 500)
  }
})
