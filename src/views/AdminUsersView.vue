<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { supabase } from '../lib/supabase'
import { useAuth } from '../composables/useAuth'

const auth = useAuth()
const users = ref([])
const roles = ref([])
const total = ref(0)
const page = ref(1)
const pageSize = 10
const search = ref('')
const role = ref('')
const status = ref('')
const loading = ref(false)
const error = ref('')
const editing = ref(null)
const editForm = reactive({ firstName: '', lastName: '', role: '', status: '' })
const pages = computed(() => Math.max(1, Math.ceil(total.value / pageSize)))
let searchTimer

async function invoke(body) {
  const { data, error: functionError } = await supabase.functions.invoke('admin-users', { body })
  if (functionError) {
    let message = functionError.message
    try {
      const payload = await functionError.context?.clone()?.json()
      message = payload?.error || message
    } catch { /* the generic message remains */ }
    throw new Error(message)
  }
  if (data?.error) throw new Error(data.error)
  return data
}

async function loadUsers(resetPage = false) {
  if (resetPage) page.value = 1
  loading.value = true; error.value = ''
  try {
    const data = await invoke({ action: 'list', page: page.value, pageSize, search: search.value, role: role.value, status: status.value })
    users.value = data.users
    roles.value = data.roles
    total.value = data.total
  } catch (loadError) { error.value = loadError?.message || 'No pudimos cargar los usuarios.' }
  finally { loading.value = false }
}

function queueSearch() {
  window.clearTimeout(searchTimer)
  searchTimer = window.setTimeout(() => loadUsers(true), 300)
}

function startEdit(user) {
  editing.value = user
  editForm.firstName = user.first_name
  editForm.lastName = user.last_name
  editForm.role = user.role_slug
  editForm.status = user.status
}

async function saveEdit() {
  loading.value = true; error.value = ''
  try {
    await invoke({ action: 'update', userId: editing.value.id, ...editForm })
    editing.value = null
    await loadUsers()
  } catch (saveError) { error.value = saveError?.message || 'No pudimos guardar los cambios.'; loading.value = false }
}

async function deleteUser(user) {
  if (!window.confirm(`¿Eliminar definitivamente la cuenta de ${user.first_name} ${user.last_name}? Esta acción no se puede deshacer.`)) return
  loading.value = true; error.value = ''
  try {
    await invoke({ action: 'delete', userId: user.id })
    if (users.value.length === 1 && page.value > 1) page.value--
    await loadUsers()
  } catch (deleteError) { error.value = deleteError?.message || 'No pudimos eliminar la cuenta.'; loading.value = false }
}

function formatDate(value) {
  if (!value) return 'Nunca'
  return new Intl.DateTimeFormat('es-AR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(value))
}

onMounted(() => loadUsers())
</script>

<template>
  <div class="admin-page page-grid-bg">
    <section class="page-width account-heading admin-heading">
      <div><span class="eyebrow"><i></i> ADMINISTRACIÓN</span><h1>Gestión de usuarios</h1><p>Roles, estados y accesos con validación segura en el servidor.</p></div>
      <RouterLink to="/panel/" class="button secondary">Mi perfil</RouterLink>
    </section>

    <section class="page-width admin-toolbar panel">
      <label class="admin-search"><span>Buscar</span><input v-model.trim="search" type="search" placeholder="Nombre, apellido o correo" @input="queueSearch" /></label>
      <label><span>Rol</span><select v-model="role" @change="loadUsers(true)"><option value="">Todos</option><option v-for="item in roles" :key="item.slug" :value="item.slug">{{ item.name }}</option></select></label>
      <label><span>Estado</span><select v-model="status" @change="loadUsers(true)"><option value="">Todos</option><option value="active">Activo</option><option value="inactive">Inactivo</option></select></label>
    </section>

    <section class="page-width admin-table-wrap panel">
      <p v-if="error" class="form-error admin-error" role="alert">{{ error }}</p>
      <div v-if="loading && !users.length" class="empty-state">Cargando usuarios…</div>
      <div v-else-if="!users.length" class="empty-state">No hay usuarios que coincidan con los filtros.</div>
      <table v-else class="admin-table">
        <thead><tr><th>Usuario</th><th>Rol</th><th>Estado</th><th>Registro</th><th>Último acceso</th><th><span class="sr-only">Acciones</span></th></tr></thead>
        <tbody>
          <tr v-for="item in users" :key="item.id">
            <td><strong>{{ item.first_name }} {{ item.last_name }}</strong><span>{{ item.email }}</span></td>
            <td>{{ roles.find((entry) => entry.slug === item.role_slug)?.name || item.role_slug }}</td>
            <td><span class="status-pill" :data-status="item.status">{{ item.status === 'active' ? 'Activo' : 'Inactivo' }}</span></td>
            <td>{{ formatDate(item.created_at) }}</td><td>{{ formatDate(item.last_login_at) }}</td>
            <td class="admin-actions"><button type="button" @click="startEdit(item)">Editar</button><button v-if="item.id !== auth.user.value?.id" type="button" class="danger" @click="deleteUser(item)">Eliminar</button></td>
          </tr>
        </tbody>
      </table>
      <div class="pagination"><span>{{ total }} usuario{{ total === 1 ? '' : 's' }}</span><div><button type="button" :disabled="page <= 1 || loading" @click="page--; loadUsers()">←</button><b>{{ page }} / {{ pages }}</b><button type="button" :disabled="page >= pages || loading" @click="page++; loadUsers()">→</button></div></div>
    </section>

    <Teleport to="body">
      <div v-if="editing" class="quote-modal-overlay" role="dialog" aria-modal="true" aria-labelledby="edit-user-title" @click.self="editing = null">
        <form class="quote-modal panel admin-edit" @submit.prevent="saveEdit">
          <button type="button" class="close-btn" aria-label="Cerrar" @click="editing = null">×</button>
          <span class="section-kicker">CUENTA DE USUARIO</span><h2 id="edit-user-title">Editar acceso</h2><p class="modal-sub">{{ editing.email }}</p>
          <div class="form-row"><div class="form-group"><label for="edit-first">Nombre</label><input id="edit-first" v-model.trim="editForm.firstName" required /></div><div class="form-group"><label for="edit-last">Apellido</label><input id="edit-last" v-model.trim="editForm.lastName" required /></div></div>
          <div class="form-row"><div class="form-group"><label for="edit-role">Rol</label><select id="edit-role" v-model="editForm.role"><option v-for="item in roles" :key="item.slug" :value="item.slug">{{ item.name }}</option></select></div><div class="form-group"><label for="edit-status">Estado</label><select id="edit-status" v-model="editForm.status"><option value="active">Activo</option><option value="inactive">Inactivo</option></select></div></div>
          <p v-if="error" class="form-error" role="alert">{{ error }}</p>
          <button class="button primary" :disabled="loading">{{ loading ? 'Guardando…' : 'Guardar cambios' }}</button>
        </form>
      </div>
    </Teleport>
  </div>
</template>
