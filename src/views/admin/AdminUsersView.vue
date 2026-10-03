<template>
  <div>
    <div class="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
      <div>
        <h1 class="h4 fw-bold mb-0">Quản lý người dùng</h1>
        <div class="text-muted small">Phê duyệt giáo viên, quản lý tài khoản học sinh và phân quyền</div>
      </div>
      <button id="add-user-btn" type="button" class="btn btn-dark btn-sm" @click="openForm(null)">
        <i class="bi bi-plus-lg me-1"></i>Thêm người dùng
      </button>
    </div>

    <!-- Thông báo giáo viên chờ duyệt -->
    <div v-if="pendingTeachers.length" class="alert alert-warning border border-warning d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
      <div class="d-flex align-items-center gap-2">
        <i class="bi bi-person-fill-exclamation fs-5"></i>
        <span>Có <strong>{{ pendingTeachers.length }}</strong> tài khoản giáo viên mới đăng ký đang chờ phê duyệt.</span>
      </div>
      <button type="button" class="btn btn-dark btn-sm" @click="showPendingOnly">
        <i class="bi bi-clock-history me-1"></i>Xem danh sách chờ duyệt ({{ pendingTeachers.length }})
      </button>
    </div>

    <!-- Phân loại vai trò nhanh -->
    <div class="d-flex flex-wrap gap-2 mb-3">
      <button
        type="button"
        class="btn btn-sm"
        :class="roleFilter === 'all' && statusFilter !== 'pending' ? 'btn-dark' : 'btn-outline-dark'"
        @click="setQuickFilter('all')"
      >
        Tất cả ({{ users.length }})
      </button>
      <button
        type="button"
        class="btn btn-sm"
        :class="roleFilter === 'teacher' && statusFilter !== 'pending' ? 'btn-dark' : 'btn-outline-dark'"
        @click="setQuickFilter('teacher')"
      >
        <i class="bi bi-person-video3 me-1"></i>Giáo viên ({{ teacherCount }})
      </button>
      <button
        type="button"
        class="btn btn-sm"
        :class="roleFilter === 'student' ? 'btn-dark' : 'btn-outline-dark'"
        @click="setQuickFilter('student')"
      >
        <i class="bi bi-backpack me-1"></i>Học sinh ({{ studentCount }})
      </button>
      <button
        v-if="pendingTeachers.length"
        type="button"
        class="btn btn-sm"
        :class="statusFilter === 'pending' ? 'btn-warning text-dark fw-bold' : 'btn-outline-warning text-dark'"
        @click="showPendingOnly"
      >
        <i class="bi bi-clock-history me-1"></i>Chờ duyệt ({{ pendingTeachers.length }})
      </button>
    </div>

    <div class="card p-3 mb-3">
      <div class="row g-2">
        <div class="col-12 col-md-4">
          <input v-model="search" type="search" class="form-control form-control-sm" placeholder="Tìm theo tên hoặc email..." />
        </div>
        <div class="col-6 col-md-2">
          <select v-model="roleFilter" class="form-select form-select-sm" aria-label="Lọc theo vai trò">
            <option value="all">Mọi vai trò</option>
            <option value="teacher">Giáo viên</option>
            <option value="student">Học sinh</option>
            <option value="admin">Quản trị viên</option>
          </select>
        </div>
        <div class="col-6 col-md-3">
          <select v-model="classFilter" class="form-select form-select-sm" aria-label="Lọc theo lớp">
            <option value="all">Mọi lớp</option>
            <option value="none">Chưa xếp lớp</option>
            <option v-for="c in classes" :key="c.id" :value="c.id">{{ c.name }}</option>
          </select>
        </div>
        <div class="col-6 col-md-3">
          <select v-model="statusFilter" class="form-select form-select-sm" aria-label="Lọc theo trạng thái">
            <option value="all">Mọi trạng thái</option>
            <option value="active">Hoạt động</option>
            <option value="pending">Chờ duyệt</option>
            <option value="inactive">Bị khóa</option>
          </select>
        </div>
      </div>
    </div>

    <LoadingSpinner v-if="loading" />
    <ErrorState v-else-if="error" :message="error" @retry="load" />
    <EmptyState v-else-if="!filtered.length" icon="bi bi-people" title="Không có người dùng" description="Không tìm thấy người dùng phù hợp với bộ lọc." />

    <div v-else class="card overflow-hidden">
      <div class="table-responsive">
        <table class="table table-hover mb-0 align-middle">
          <thead>
            <tr>
              <th>Họ tên</th>
              <th>Vai trò</th>
              <th>Lớp</th>
              <th>Trạng thái</th>
              <th class="text-end">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="u in paged" :key="u.id">
              <td>
                <div class="fw-medium">{{ u.displayName }}</div>
                <div class="small text-muted">{{ u.email }}</div>
              </td>
              <td><span class="badge" :class="u.role === 'admin' ? 'bg-dark' : 'bg-light text-dark border'">{{ ROLE_LABELS[u.role] }}</span></td>
              <td>{{ u.role === 'student' ? classNameOf(u.classId) : teacherClasses(u.id) || '—' }}</td>
              <td>
                <span v-if="u.status === 'pending'" class="badge bg-warning text-dark border border-warning">
                  <i class="bi bi-clock me-1"></i>Chờ duyệt
                </span>
                <span v-else-if="u.status === 'inactive'" class="badge bg-secondary">
                  Bị khóa
                </span>
                <span v-else class="badge bg-light text-dark border">
                  Hoạt động
                </span>
              </td>
              <td class="text-end">
                <div class="btn-group btn-group-sm">
                  <!-- Nút duyệt nhanh cho giáo viên chờ duyệt -->
                  <button
                    v-if="u.status === 'pending'"
                    type="button"
                    class="btn btn-sm btn-dark"
                    title="Duyệt tài khoản giáo viên"
                    :disabled="submitting"
                    @click="approveTeacher(u)"
                  >
                    <i class="bi bi-check-lg me-1"></i>Duyệt
                  </button>

                  <button type="button" class="btn btn-outline-dark" title="Xem thông tin" @click="detail = u"><i class="bi bi-eye"></i></button>
                  <button type="button" class="btn btn-outline-dark" title="Chỉnh sửa" @click="openForm(u)"><i class="bi bi-pencil"></i></button>
                  <button type="button" class="btn btn-outline-dark" title="Đặt lại mật khẩu" @click="confirm = { type: 'reset', user: u }"><i class="bi bi-key"></i></button>
                  <button
                    type="button"
                    class="btn btn-outline-dark"
                    :title="u.status === 'inactive' ? 'Mở khóa' : 'Khóa tài khoản'"
                    :disabled="u.id === currentUser.uid"
                    @click="confirm = { type: 'toggle', user: u }"
                  >
                    <i :class="u.status === 'inactive' ? 'bi bi-unlock' : 'bi bi-lock'"></i>
                  </button>
                  <button type="button" class="btn btn-outline-danger" title="Xóa tài khoản" :disabled="u.id === currentUser.uid" @click="confirm = { type: 'delete', user: u }">
                    <i class="bi bi-trash"></i>
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
    <Pagination v-model:current-page="page" :total-items="filtered.length" :page-size="PAGE_SIZE" />

    <UserFormModal :is-open="showForm" :user="editing" :classes="classes" :submitting="submitting" @close="showForm = false" @save="save" />

    <!-- Chi tiết -->
    <div v-if="detail" class="modal fade show d-block" tabindex="-1" style="background-color: rgba(0,0,0,.5);" @click.self="detail = null">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Thông tin tài khoản</h5>
            <button type="button" class="btn-close" aria-label="Đóng" @click="detail = null"></button>
          </div>
          <div class="modal-body">
            <dl class="row mb-0 small">
              <dt class="col-4">Họ tên</dt><dd class="col-8">{{ detail.displayName }}</dd>
              <dt class="col-4">Email</dt><dd class="col-8">{{ detail.email }}</dd>
              <dt class="col-4">Vai trò</dt><dd class="col-8">{{ ROLE_LABELS[detail.role] }}</dd>
              <dt class="col-4">Trạng thái</dt>
              <dd class="col-8">
                <span v-if="detail.status === 'pending'" class="badge bg-warning text-dark border border-warning">Chờ duyệt</span>
                <span v-else-if="detail.status === 'inactive'" class="badge bg-secondary">Bị khóa</span>
                <span v-else class="badge bg-light text-dark border">Hoạt động</span>
              </dd>
              <dt v-if="detail.role === 'student'" class="col-4">Lớp</dt>
              <dd v-if="detail.role === 'student'" class="col-8">{{ classNameOf(detail.classId) }}</dd>
              <dt v-if="detail.role === 'teacher'" class="col-4">Lớp phụ trách</dt>
              <dd v-if="detail.role === 'teacher'" class="col-8">{{ teacherClasses(detail.id) || 'Chưa phân công lớp' }}</dd>
              <dt class="col-4">Điện thoại</dt><dd class="col-8">{{ detail.phone || '—' }}</dd>
              <dt class="col-4">Ngày tạo</dt><dd class="col-8 mb-0">{{ formatDate(detail.createdAt) }}</dd>
            </dl>
          </div>
          <div class="modal-footer" v-if="detail.status === 'pending'">
            <button type="button" class="btn btn-dark btn-sm w-100" @click="approveTeacher(detail); detail = null">
              <i class="bi bi-check-lg me-1"></i>Phê duyệt tài khoản giáo viên này
            </button>
          </div>
        </div>
      </div>
    </div>

    <ConfirmModal
      :is-open="Boolean(confirm)"
      :title="confirmTitle"
      :message="confirmMessage"
      :confirm-text="confirm?.type === 'delete' ? 'Xóa' : confirm?.type === 'reset' ? 'Đặt lại mật khẩu' : 'Đồng ý'"
      :variant="confirm?.type === 'delete' ? 'danger' : 'dark'"
      :loading="submitting"
      @confirm="runConfirm"
      @cancel="confirm = null"
    />

    <!-- Mật khẩu tạm sau khi đặt lại -->
    <div v-if="resetResult" class="modal fade show d-block" tabindex="-1" style="background-color: rgba(0,0,0,.5);">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Đã đặt lại mật khẩu</h5>
          </div>
          <div class="modal-body">
            <p class="small mb-2">Mật khẩu tạm của <strong>{{ resetResult.user.displayName }}</strong> ({{ resetResult.user.email }}):</p>
            <div class="input-group">
              <input :value="resetResult.password" type="text" class="form-control font-monospace fw-bold" readonly aria-label="Mật khẩu tạm" @focus="$event.target.select()" />
              <button type="button" class="btn btn-outline-dark" @click="copyResetPassword">
                <i class="bi me-1" :class="copied ? 'bi-check-lg' : 'bi-clipboard'"></i>{{ copied ? 'Đã chép' : 'Sao chép' }}
              </button>
            </div>
            <div class="alert alert-warning small mt-3 mb-0">
              <i class="bi bi-exclamation-triangle me-1"></i>Mật khẩu chỉ hiển thị một lần. Hãy gửi cho người dùng và yêu cầu đổi mật khẩu sau khi đăng nhập.
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-dark btn-sm" @click="closeResetResult">Đã lưu, đóng</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { currentUser } from '@/stores/authState'
import { getUsers, createUser, updateUser, setUserStatus, deleteUser, resetUserPassword } from '@/services/user.service'
import { getClasses } from '@/services/class.service'
import { ROLE_LABELS, formatDate, paginate } from '@/utils/helpers'
import { useToast } from '@/composables/useToast'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import ErrorState from '@/components/common/ErrorState.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import Pagination from '@/components/common/Pagination.vue'
import ConfirmModal from '@/components/common/ConfirmModal.vue'
import UserFormModal from '@/components/admin/UserFormModal.vue'

const PAGE_SIZE = 10
const toast = useToast()

const loading = ref(true)
const error = ref('')
const submitting = ref(false)
const users = ref([])
const classes = ref([])

const search = ref('')
const roleFilter = ref('all')
const classFilter = ref('all')
const statusFilter = ref('all')
const page = ref(1)

const showForm = ref(false)
const editing = ref(null)
const detail = ref(null)
const confirm = ref(null)

const classNameOf = id => classes.value.find(c => c.id === id)?.name || 'Chưa xếp lớp'
const teacherClasses = id => classes.value.filter(c => c.teacherIds.includes(id)).map(c => c.name).join(', ')

const pendingTeachers = computed(() =>
  users.value.filter(u => u.role === 'teacher' && u.status === 'pending')
)
const teacherCount = computed(() => users.value.filter(u => u.role === 'teacher').length)
const studentCount = computed(() => users.value.filter(u => u.role === 'student').length)

const setQuickFilter = role => {
  roleFilter.value = role
  statusFilter.value = 'all'
  page.value = 1
}

const showPendingOnly = () => {
  roleFilter.value = 'teacher'
  statusFilter.value = 'pending'
  page.value = 1
}

const filtered = computed(() => {
  const s = search.value.trim().toLowerCase()
  return users.value.filter(u => {
    if (s && !(u.displayName?.toLowerCase().includes(s) || u.email?.toLowerCase().includes(s))) return false
    if (roleFilter.value !== 'all' && u.role !== roleFilter.value) return false
    if (statusFilter.value !== 'all' && (u.status || 'active') !== statusFilter.value) return false
    if (classFilter.value === 'none') return u.role === 'student' && !u.classId
    if (classFilter.value !== 'all') return u.classId === classFilter.value
    return true
  })
})
const paged = computed(() => paginate(filtered.value, page.value, PAGE_SIZE))
watch([search, roleFilter, classFilter, statusFilter], () => { page.value = 1 })

const confirmTitle = computed(() => {
  const c = confirm.value
  if (!c) return ''
  if (c.type === 'delete') return 'Xóa tài khoản'
  if (c.type === 'reset') return 'Đặt lại mật khẩu'
  return c.user.status === 'inactive' ? 'Mở khóa tài khoản' : 'Khóa tài khoản'
})

const confirmMessage = computed(() => {
  if (!confirm.value) return ''
  const name = confirm.value.user.displayName
  if (confirm.value.type === 'delete') return `Xóa tài khoản "${name}"? Toàn bộ bài làm của tài khoản này cũng sẽ bị xóa.`
  if (confirm.value.type === 'reset') return `Đặt lại mật khẩu cho "${name}"? Mật khẩu cũ sẽ không còn dùng được, hệ thống sẽ tạo mật khẩu tạm mới để bạn gửi cho người dùng.`
  return confirm.value.user.status === 'inactive'
    ? `Mở khóa tài khoản "${name}"?`
    : `Khóa tài khoản "${name}"? Người dùng sẽ không thể đăng nhập.`
})

const resetResult = ref(null)
const copied = ref(false)
const copyResetPassword = async () => {
  try {
    await navigator.clipboard.writeText(resetResult.value.password)
    copied.value = true
    setTimeout(() => { copied.value = false }, 2000)
  } catch {
    toast.error('Không thể sao chép, hãy chọn và copy thủ công.')
  }
}
const closeResetResult = () => {
  resetResult.value = null
  copied.value = false
}

const load = async () => {
  loading.value = true
  error.value = ''
  try {
    const [u, c] = await Promise.all([getUsers(), getClasses()])
    users.value = u
    classes.value = c
  } catch {
    error.value = 'Không thể tải danh sách người dùng.'
  } finally {
    loading.value = false
  }
}

const openForm = u => {
  editing.value = u
  showForm.value = true
}

const approveTeacher = async u => {
  submitting.value = true
  try {
    await setUserStatus(u.id, 'active')
    toast.success(`Đã phê duyệt tài khoản giáo viên "${u.displayName}".`)
    await load()
  } catch {
    toast.error('Không thể phê duyệt tài khoản.')
  } finally {
    submitting.value = false
  }
}

const save = async data => {
  submitting.value = true
  try {
    if (editing.value) {
      if (editing.value.id === currentUser.value.uid && (data.role !== 'admin' || data.status === 'inactive')) {
        throw new Error('Bạn không thể tự hạ quyền hoặc khóa chính mình.')
      }
      await updateUser(editing.value.id, data)
      toast.success('Đã cập nhật người dùng.')
    } else {
      await createUser(data)
      toast.success('Đã thêm người dùng.')
    }
    showForm.value = false
    await load()
  } catch (err) {
    toast.error(err.message || 'Không thể lưu người dùng.')
  } finally {
    submitting.value = false
  }
}

const runConfirm = async () => {
  const { type, user } = confirm.value
  submitting.value = true
  try {
    if (type === 'delete') {
      await deleteUser(user.id)
      toast.success('Đã xóa tài khoản.')
    } else if (type === 'reset') {
      const password = await resetUserPassword(user.id)
      resetResult.value = { user, password }
      toast.success('Đã đặt lại mật khẩu.')
    } else {
      const next = user.status === 'inactive' ? 'active' : 'inactive'
      await setUserStatus(user.id, next)
      toast.success(next === 'active' ? 'Đã mở khóa tài khoản.' : 'Đã khóa tài khoản.')
    }
    confirm.value = null
    await load()
  } catch {
    toast.error('Thao tác thất bại. Vui lòng thử lại.')
  } finally {
    submitting.value = false
  }
}

onMounted(load)
</script>
