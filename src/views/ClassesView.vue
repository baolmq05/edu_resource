<template>
  <div :class="isAdmin ? '' : 'container-xl py-4'">
    <div class="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
      <h1 class="h4 fw-bold mb-0">{{ isAdmin ? 'Quản lý lớp học' : 'Lớp học của tôi' }}</h1>
      <button v-if="isAdmin" id="add-class-btn" type="button" class="btn btn-dark btn-sm" @click="openForm(null)">
        <i class="bi bi-plus-lg me-1"></i>Thêm lớp
      </button>
    </div>

    <div class="card p-3 mb-3">
      <div class="row g-2">
        <div class="col-12 col-md-6">
          <input v-model="search" type="search" class="form-control form-control-sm" placeholder="Tìm theo tên lớp..." />
        </div>
        <div class="col-6 col-md-3">
          <select v-model="gradeFilter" class="form-select form-select-sm" aria-label="Lọc theo khối">
            <option value="all">Mọi khối</option>
            <option v-for="g in GRADES" :key="g" :value="String(g)">Khối {{ g }}</option>
          </select>
        </div>
        <div class="col-6 col-md-3">
          <select v-model="yearFilter" class="form-select form-select-sm" aria-label="Lọc theo năm học">
            <option value="all">Mọi năm học</option>
            <option v-for="y in years" :key="y" :value="y">{{ y }}</option>
          </select>
        </div>
      </div>
    </div>

    <LoadingSpinner v-if="loading" />
    <ErrorState v-else-if="error" :message="error" @retry="load" />
    <EmptyState
      v-else-if="!filtered.length"
      icon="bi bi-diagram-3"
      title="Chưa có lớp nào"
      :description="isAdmin ? 'Hãy thêm lớp đầu tiên.' : isStudent ? 'Bạn chưa được xếp lớp. Vui lòng liên hệ quản trị viên.' : 'Bạn chưa được phân công lớp nào.'"
    />

    <div v-else class="card overflow-hidden">
      <div class="table-responsive">
        <table class="table table-hover mb-0">
          <thead>
            <tr><th>Lớp</th><th>Khối</th><th>Năm học</th><th>Giáo viên phụ trách</th><th>Sĩ số</th><th class="text-end">Thao tác</th></tr>
          </thead>
          <tbody>
            <tr v-for="c in paged" :key="c.id">
              <td class="fw-semibold">
                <router-link :to="`/classes/${c.id}`" class="text-dark">{{ c.name }}</router-link>
              </td>
              <td>{{ c.grade }}</td>
              <td>{{ c.schoolYear }}</td>
              <td class="small">{{ teacherNames(c) || '—' }}</td>
              <td>{{ studentCount(c.id) }}</td>
              <td class="text-end">
                <div class="btn-group btn-group-sm">
                  <router-link :to="`/classes/${c.id}`" class="btn btn-outline-dark" title="Xem chi tiết"><i class="bi bi-eye"></i></router-link>
                  <template v-if="isAdmin">
                    <button type="button" class="btn btn-outline-dark" title="Chỉnh sửa" @click="openForm(c)"><i class="bi bi-pencil"></i></button>
                    <button type="button" class="btn btn-outline-danger" title="Xóa" @click="toDelete = c"><i class="bi bi-trash"></i></button>
                  </template>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
    <Pagination v-model:current-page="page" :total-items="filtered.length" :page-size="PAGE_SIZE" />

    <!-- Form lớp (Admin) -->
    <div v-if="showForm" class="modal fade show d-block" tabindex="-1" style="background-color: rgba(0,0,0,.5);" @click.self="showForm = false">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
          <form @submit.prevent="save">
            <div class="modal-header">
              <h5 class="modal-title">{{ editing ? 'Chỉnh sửa lớp' : 'Thêm lớp' }}</h5>
              <button type="button" class="btn-close" aria-label="Đóng" @click="showForm = false"></button>
            </div>
            <div class="modal-body">
              <div class="row g-3">
                <div class="col-12">
                  <label for="cf-name" class="form-label small fw-semibold">Tên lớp</label>
                  <input id="cf-name" v-model="form.name" class="form-control" placeholder="VD: 10A1" required />
                </div>
                <div class="col-6">
                  <label for="cf-grade" class="form-label small fw-semibold">Khối</label>
                  <select id="cf-grade" v-model="form.grade" class="form-select">
                    <option v-for="g in GRADES" :key="g" :value="g">Khối {{ g }}</option>
                  </select>
                </div>
                <div class="col-6">
                  <label for="cf-year" class="form-label small fw-semibold">Năm học</label>
                  <input id="cf-year" v-model="form.schoolYear" class="form-control" placeholder="2025-2026" required />
                </div>
                <div class="col-12">
                  <label class="form-label small fw-semibold">Giáo viên phụ trách</label>
                  <SearchableSelect
                    v-model="teacherPick"
                    :options="availableTeachers"
                    value-key="id"
                    label-key="displayName"
                    :placeholder="teachers.length ? (availableTeachers.length ? '-- Thêm giáo viên --' : 'Đã chọn hết giáo viên') : 'Chưa có giáo viên nào'"
                    search-placeholder="Tìm giáo viên theo tên..."
                    :disabled="!availableTeachers.length"
                    @change="addTeacher"
                  />
                  <div v-if="form.teacherIds.length" class="d-flex flex-wrap gap-2 mt-2">
                    <span
                      v-for="id in form.teacherIds"
                      :key="id"
                      class="badge bg-light text-dark border d-inline-flex align-items-center gap-1 py-2 px-2 fw-normal"
                    >
                      <i class="bi bi-person me-1"></i>{{ teacherLabel(id) }}
                      <button type="button" class="btn-close ms-1" style="font-size: 0.6rem;" :aria-label="`Bỏ ${teacherLabel(id)}`" @click="removeTeacher(id)"></button>
                    </span>
                  </div>
                </div>
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-outline-secondary" @click="showForm = false">Hủy</button>
              <button type="submit" class="btn btn-dark" :disabled="submitting">
                <span v-if="submitting" class="spinner-border spinner-border-sm me-1"></span>Lưu
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <ConfirmModal
      :is-open="Boolean(toDelete)"
      title="Xóa lớp"
      :message="`Xóa lớp &quot;${toDelete?.name}&quot;? Học sinh trong lớp sẽ trở về trạng thái chưa xếp lớp.`"
      confirm-text="Xóa lớp"
      :loading="submitting"
      @confirm="remove"
      @cancel="toDelete = null"
    />
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { currentUser, isAdmin, isStudent } from '@/stores/authState'
import { getClassesForUser, createClass, updateClass, deleteClass } from '@/services/class.service'
import { getUsers } from '@/services/user.service'
import { GRADES, paginate } from '@/utils/helpers'
import { useToast } from '@/composables/useToast'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import ErrorState from '@/components/common/ErrorState.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import Pagination from '@/components/common/Pagination.vue'
import ConfirmModal from '@/components/common/ConfirmModal.vue'
import SearchableSelect from '@/components/common/SearchableSelect.vue'

const PAGE_SIZE = 10
const toast = useToast()
const router = useRouter()

const loading = ref(true)
const error = ref('')
const submitting = ref(false)
const classes = ref([])
const users = ref([])

const search = ref('')
const gradeFilter = ref('all')
const yearFilter = ref('all')
const page = ref(1)

const showForm = ref(false)
const editing = ref(null)
const form = ref({ name: '', grade: 10, schoolYear: '', teacherIds: [] })
const toDelete = ref(null)

const teachers = computed(() => users.value.filter(u => u.role === 'teacher'))
const teacherPick = ref('')
const availableTeachers = computed(() => teachers.value.filter(t => !form.value.teacherIds.includes(t.id)))
const teacherLabel = id => teachers.value.find(t => t.id === id)?.displayName || id
const addTeacher = id => {
  if (id && !form.value.teacherIds.includes(id)) form.value.teacherIds.push(id)
  teacherPick.value = ''
}
const removeTeacher = id => {
  form.value.teacherIds = form.value.teacherIds.filter(x => x !== id)
}
const years = computed(() => [...new Set(classes.value.map(c => c.schoolYear))].sort().reverse())
const teacherNames = c =>
  c.teacherIds.map(id => users.value.find(u => u.id === id)?.displayName).filter(Boolean).join(', ')
const studentCount = classId => users.value.filter(u => u.role === 'student' && u.classId === classId).length

const filtered = computed(() => {
  const s = search.value.trim().toLowerCase()
  return classes.value.filter(c => {
    if (s && !c.name.toLowerCase().includes(s)) return false
    if (gradeFilter.value !== 'all' && String(c.grade) !== gradeFilter.value) return false
    if (yearFilter.value !== 'all' && c.schoolYear !== yearFilter.value) return false
    return true
  })
})
const paged = computed(() => paginate(filtered.value, page.value, PAGE_SIZE))
watch([search, gradeFilter, yearFilter], () => { page.value = 1 })

const load = async () => {
  loading.value = true
  error.value = ''
  try {
    const [c, u] = await Promise.all([getClassesForUser(currentUser.value), getUsers()])
    classes.value = c
    users.value = u
    // Học sinh chỉ có một lớp: đi thẳng tới trang lớp
    if (isStudent.value && c.length === 1) router.replace(`/classes/${c[0].id}`)
  } catch {
    error.value = 'Không thể tải danh sách lớp.'
  } finally {
    loading.value = false
  }
}

const openForm = c => {
  editing.value = c
  form.value = c
    ? { name: c.name, grade: c.grade, schoolYear: c.schoolYear, teacherIds: [...c.teacherIds] }
    : { name: '', grade: 10, schoolYear: years.value[0] || '', teacherIds: [] }
  showForm.value = true
}

const save = async () => {
  submitting.value = true
  try {
    if (editing.value) await updateClass(editing.value.id, form.value)
    else await createClass(form.value)
    toast.success('Đã lưu lớp học.')
    showForm.value = false
    await load()
  } catch {
    toast.error('Không thể lưu lớp học.')
  } finally {
    submitting.value = false
  }
}

const remove = async () => {
  submitting.value = true
  try {
    await deleteClass(toDelete.value.id)
    toast.success('Đã xóa lớp.')
    toDelete.value = null
    await load()
  } catch (err) {
    toast.error(err.message || 'Không thể xóa lớp.')
    toDelete.value = null
  } finally {
    submitting.value = false
  }
}

onMounted(load)
</script>
