<template>
  <div class="container-xl py-4">
    <nav aria-label="breadcrumb">
      <ol class="breadcrumb small">
        <li class="breadcrumb-item"><router-link :to="isAdmin ? '/admin/classes' : '/classes'" class="text-dark">Lớp học</router-link></li>
        <li class="breadcrumb-item active">{{ cls?.name || '...' }}</li>
      </ol>
    </nav>

    <LoadingSpinner v-if="loading" />
    <ErrorState v-else-if="error" :message="error" @retry="load" />

    <template v-else>
      <div class="d-flex flex-wrap justify-content-between align-items-start gap-3 mb-3">
        <div>
          <h1 class="h4 fw-bold mb-1">Lớp {{ cls.name }}</h1>
          <div class="text-muted small">Khối {{ cls.grade }} • Năm học {{ cls.schoolYear }} • {{ students.length }} học sinh</div>
          <div class="small mt-1"><span class="text-muted">Giáo viên phụ trách:</span> {{ teacherNames || 'Chưa phân công' }}</div>
        </div>
        <div v-if="canManageClass" class="d-flex gap-2">
          <button id="add-student-btn" type="button" class="btn btn-dark btn-sm" @click="openAdd">
            <i class="bi bi-person-plus me-1"></i>Thêm học sinh vào lớp
          </button>
        </div>
      </div>

      <div class="card p-3 mb-3">
        <input v-model="search" type="search" class="form-control form-control-sm" placeholder="Tìm học sinh trong lớp..." />
      </div>

      <EmptyState v-if="!filtered.length" icon="bi bi-people" title="Chưa có học sinh" description="Lớp này chưa có học sinh hoặc không tìm thấy kết quả." />

      <div v-else class="card overflow-hidden">
        <div class="table-responsive">
          <table class="table table-hover mb-0 align-middle">
            <thead>
              <tr>
                <th>#</th>
                <th>Họ tên</th>
                <th v-if="!isStudent">Email</th>
                <th v-if="!isStudent">Trạng thái</th>
                <th v-if="!isStudent" class="text-end">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(s, i) in paged" :key="s.id">
                <td class="text-muted">{{ (page - 1) * PAGE_SIZE + i + 1 }}</td>
                <td class="fw-medium">{{ s.displayName }}</td>
                <td v-if="!isStudent" class="small text-muted">{{ s.email }}</td>
                <td v-if="!isStudent">
                  <span class="badge" :class="s.status === 'inactive' ? 'bg-secondary' : 'bg-light text-dark border'">
                    {{ s.status === 'inactive' ? 'Bị khóa' : 'Hoạt động' }}
                  </span>
                </td>
                <td v-if="!isStudent" class="text-end">
                  <div class="btn-group btn-group-sm">
                    <button type="button" class="btn btn-outline-dark" title="Lịch sử kiểm tra" @click="openHistory(s)">
                      <i class="bi bi-clock-history"></i>
                    </button>
                    <button v-if="isAdmin" type="button" class="btn btn-outline-dark" title="Chuyển lớp" @click="openMove(s)"><i class="bi bi-arrow-left-right"></i></button>
                    <button v-if="canManageClass" type="button" class="btn btn-outline-danger" title="Xóa khỏi lớp" @click="toRemove = s"><i class="bi bi-person-dash"></i></button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      <Pagination v-model:current-page="page" :total-items="filtered.length" :page-size="PAGE_SIZE" />
    </template>

    <!-- Thêm học sinh (Modal 2 chế độ: chọn có sẵn hoặc tạo mới) -->
    <div v-if="showAdd" class="modal fade show d-block" tabindex="-1" style="background-color: rgba(0,0,0,.5);" @click.self="showAdd = false">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Thêm học sinh vào lớp {{ cls?.name }}</h5>
            <button type="button" class="btn-close" aria-label="Đóng" @click="showAdd = false"></button>
          </div>
          <div class="modal-body">
            <!-- Tabs chọn phương thức -->
            <ul class="nav nav-pills nav-fill mb-3">
              <li class="nav-item">
                <button
                  type="button"
                  class="nav-link"
                  :class="addMode === 'select' ? 'active bg-dark text-white' : 'text-dark border'"
                  @click="addMode = 'select'"
                >
                  <i class="bi bi-person-check me-1"></i>Chọn học sinh có sẵn
                </button>
              </li>
              <li class="nav-item ms-2">
                <button
                  type="button"
                  class="nav-link"
                  :class="addMode === 'create' ? 'active bg-dark text-white' : 'text-dark border'"
                  @click="addMode = 'create'"
                >
                  <i class="bi bi-person-plus me-1"></i>Tạo tài khoản mới
                </button>
              </li>
            </ul>

            <!-- Form 1: Chọn học sinh có sẵn -->
            <div v-if="addMode === 'select'">
              <div class="mb-3">
                <label for="add-student" class="form-label small fw-semibold">Học sinh chưa xếp lớp hoặc ở lớp khác</label>
                <select id="add-student" v-model="selectedStudent" class="form-select">
                  <option value="">-- Chọn học sinh --</option>
                  <option v-for="s in candidates" :key="s.id" :value="s.id">
                    {{ s.displayName }} ({{ s.email }}) — {{ classLabel(s.classId) }}
                  </option>
                </select>
                <div v-if="!candidates.length" class="form-text text-muted mt-2">
                  Hiện không có học sinh nào ngoài lớp để thêm. Hãy dùng tab "Tạo tài khoản mới".
                </div>
                <div v-else class="form-text mt-2">
                  Mỗi học sinh chỉ thuộc một lớp. Nếu chọn học sinh đang ở lớp khác, hệ thống sẽ chuyển sang lớp này.
                </div>
              </div>
              <div class="d-flex justify-content-end gap-2 mt-4">
                <button type="button" class="btn btn-outline-secondary" @click="showAdd = false">Hủy</button>
                <button type="button" class="btn btn-dark" :disabled="!selectedStudent || submitting" @click="addStudent">
                  <span v-if="submitting" class="spinner-border spinner-border-sm me-1"></span>Thêm vào lớp
                </button>
              </div>
            </div>

            <!-- Form 2: Tạo tài khoản học sinh mới -->
            <form v-else @submit.prevent="createAndAddStudent">
              <div class="mb-3">
                <label for="st-name" class="form-label small fw-semibold">Họ và tên học sinh</label>
                <input id="st-name" v-model="newStudent.displayName" class="form-control" placeholder="Nguyễn Văn A" required />
              </div>
              <div class="mb-3">
                <label for="st-email" class="form-label small fw-semibold">Email tài khoản</label>
                <input id="st-email" v-model="newStudent.email" type="email" class="form-control" placeholder="hocsinh@school.edu.vn" required />
              </div>
              <div class="mb-3">
                <label for="st-phone" class="form-label small fw-semibold">Số điện thoại (tùy chọn)</label>
                <input id="st-phone" v-model="newStudent.phone" type="tel" class="form-control" placeholder="0987654321" />
              </div>
              <div class="mb-3">
                <label for="st-pass" class="form-label small fw-semibold">Mật khẩu đăng nhập</label>
                <input id="st-pass" v-model="newStudent.password" type="text" class="form-control" placeholder="Tối thiểu 6 ký tự" required minlength="6" />
                <div class="form-text">Cung cấp tài khoản và mật khẩu này cho học sinh để đăng nhập làm bài kiểm tra.</div>
              </div>
              <div class="d-flex justify-content-end gap-2 mt-4">
                <button type="button" class="btn btn-outline-secondary" @click="showAdd = false">Hủy</button>
                <button type="submit" class="btn btn-dark" :disabled="submitting">
                  <span v-if="submitting" class="spinner-border spinner-border-sm me-1"></span>Tạo & Thêm vào lớp
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>

    <!-- Chuyển lớp (Admin) -->
    <div v-if="movingStudent" class="modal fade show d-block" tabindex="-1" style="background-color: rgba(0,0,0,.5);" @click.self="movingStudent = null">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Chuyển lớp: {{ movingStudent.displayName }}</h5>
            <button type="button" class="btn-close" aria-label="Đóng" @click="movingStudent = null"></button>
          </div>
          <div class="modal-body">
            <label for="move-class" class="form-label small fw-semibold">Lớp mới</label>
            <select id="move-class" v-model="targetClass" class="form-select">
              <option value="">-- Chọn lớp --</option>
              <option v-for="c in otherClasses" :key="c.id" :value="c.id">{{ c.name }} ({{ c.schoolYear }})</option>
            </select>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-outline-secondary" @click="movingStudent = null">Hủy</button>
            <button type="button" class="btn btn-dark" :disabled="!targetClass || submitting" @click="moveStudent">Chuyển lớp</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Lịch sử kiểm tra -->
    <div v-if="historyStudent" class="modal fade show d-block" tabindex="-1" style="background-color: rgba(0,0,0,.5);" @click.self="historyStudent = null">
      <div class="modal-dialog modal-dialog-centered modal-lg">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Lịch sử kiểm tra: {{ historyStudent.displayName }}</h5>
            <button type="button" class="btn-close" aria-label="Đóng" @click="historyStudent = null"></button>
          </div>
          <div class="modal-body">
            <LoadingSpinner v-if="historyLoading" />
            <p v-else-if="!history.length" class="text-muted mb-0">Học sinh chưa làm bài kiểm tra nào.</p>
            <table v-else class="table mb-0">
              <thead><tr><th>Đề</th><th>Nộp lúc</th><th>Điểm</th><th></th></tr></thead>
              <tbody>
                <tr v-for="r in history" :key="r.id">
                  <td>{{ r.examTitle }}</td>
                  <td class="small">{{ formatDateTime(r.submittedAt) }}</td>
                  <td class="fw-bold">{{ r.status === 'in_progress' ? '—' : `${scoreTo10(r)}/10` }}</td>
                  <td class="text-end"><router-link :to="`/results/${r.id}`" class="btn btn-outline-dark btn-sm">Chi tiết</router-link></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>

    <ConfirmModal
      :is-open="Boolean(toRemove)"
      title="Xóa học sinh khỏi lớp"
      :message="`Xóa &quot;${toRemove?.displayName}&quot; khỏi lớp ${cls?.name}?`"
      confirm-text="Xóa khỏi lớp"
      :loading="submitting"
      @confirm="removeStudent"
      @cancel="toRemove = null"
    />
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { currentUser, isAdmin, isStudent } from '@/stores/authState'
import { getClassById, getClasses, getClassStudents, setStudentClass } from '@/services/class.service'
import { getUsers, createUser } from '@/services/user.service'
import { getExams, getResults, scoreTo10 } from '@/services/exam.service'
import { formatDateTime, paginate } from '@/utils/helpers'
import { useToast } from '@/composables/useToast'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import ErrorState from '@/components/common/ErrorState.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import Pagination from '@/components/common/Pagination.vue'
import ConfirmModal from '@/components/common/ConfirmModal.vue'

const PAGE_SIZE = 10
const route = useRoute()
const toast = useToast()

const loading = ref(true)
const error = ref('')
const submitting = ref(false)

const cls = ref(null)
const allClasses = ref([])
const students = ref([])
const teachers = ref([])
const allStudents = ref([])

const search = ref('')
const page = ref(1)

const showAdd = ref(false)
const addMode = ref('select')
const selectedStudent = ref('')
const newStudent = ref({ displayName: '', email: '', password: '', phone: '' })

const movingStudent = ref(null)
const targetClass = ref('')
const toRemove = ref(null)

const historyStudent = ref(null)
const historyLoading = ref(false)
const history = ref([])

const canManageClass = computed(() => {
  if (isAdmin.value) return true
  if (currentUser.value?.role === 'teacher' && cls.value?.teacherIds?.includes(currentUser.value?.uid)) {
    return true
  }
  return false
})

const teacherNames = computed(() =>
  cls.value?.teacherIds.map(id => teachers.value.find(t => t.id === id)?.displayName).filter(Boolean).join(', ')
)
const filtered = computed(() => {
  const s = search.value.trim().toLowerCase()
  return students.value.filter(x => !s || x.displayName?.toLowerCase().includes(s) || x.email?.toLowerCase().includes(s))
})
const paged = computed(() => paginate(filtered.value, page.value, PAGE_SIZE))
watch(search, () => { page.value = 1 })

const candidates = computed(() => allStudents.value.filter(s => s.classId !== cls.value?.id))
const otherClasses = computed(() => allClasses.value.filter(c => c.id !== cls.value?.id))
const classLabel = id => allClasses.value.find(c => c.id === id)?.name || 'Chưa xếp lớp'

const hasAccess = c => {
  const u = currentUser.value
  if (!u) return false
  if (u.role === 'admin') return true
  if (u.role === 'teacher') return c.teacherIds.includes(u.uid)
  return u.classId === c.id
}

const load = async () => {
  loading.value = true
  error.value = ''
  try {
    const c = await getClassById(route.params.id)
    if (!c) {
      error.value = 'Không tìm thấy lớp học.'
      return
    }
    if (!hasAccess(c)) {
      error.value = 'Bạn không có quyền xem lớp học này.'
      return
    }
    const [classStudents, users, classes] = await Promise.all([getClassStudents(c.id), getUsers(), getClasses()])
    cls.value = c
    students.value = classStudents
    teachers.value = users.filter(u => u.role === 'teacher')
    allStudents.value = users.filter(u => u.role === 'student')
    allClasses.value = classes
  } catch {
    error.value = 'Không thể tải thông tin lớp.'
  } finally {
    loading.value = false
  }
}

const openAdd = () => {
  selectedStudent.value = ''
  newStudent.value = { displayName: '', email: '', password: '123456', phone: '' }
  addMode.value = candidates.value.length ? 'select' : 'create'
  showAdd.value = true
}

const addStudent = async () => {
  submitting.value = true
  try {
    await setStudentClass(selectedStudent.value, cls.value.id)
    toast.success('Đã thêm học sinh vào lớp.')
    showAdd.value = false
    await load()
  } catch {
    toast.error('Không thể thêm học sinh.')
  } finally {
    submitting.value = false
  }
}

const createAndAddStudent = async () => {
  submitting.value = true
  try {
    await createUser({
      displayName: newStudent.value.displayName,
      email: newStudent.value.email,
      password: newStudent.value.password,
      phone: newStudent.value.phone,
      role: 'student',
      classId: cls.value.id,
      status: 'active'
    })
    toast.success(`Đã tạo tài khoản học sinh "${newStudent.value.displayName}" và thêm vào lớp thành công!`)
    showAdd.value = false
    await load()
  } catch (err) {
    toast.error(err.message || 'Không thể tạo tài khoản học sinh.')
  } finally {
    submitting.value = false
  }
}

const openMove = s => {
  movingStudent.value = s
  targetClass.value = ''
}

const moveStudent = async () => {
  submitting.value = true
  try {
    await setStudentClass(movingStudent.value.id, targetClass.value)
    toast.success('Đã chuyển lớp cho học sinh.')
    movingStudent.value = null
    await load()
  } catch {
    toast.error('Không thể chuyển lớp.')
  } finally {
    submitting.value = false
  }
}

const removeStudent = async () => {
  submitting.value = true
  try {
    await setStudentClass(toRemove.value.id, '')
    toast.success('Đã xóa học sinh khỏi lớp.')
    toRemove.value = null
    await load()
  } catch {
    toast.error('Không thể xóa học sinh khỏi lớp.')
  } finally {
    submitting.value = false
  }
}

const openHistory = async s => {
  historyStudent.value = s
  historyLoading.value = true
  history.value = []
  try {
    const [exams, results] = await Promise.all([getExams(currentUser.value), getResults({ studentId: s.id })])
    history.value = results
      .map(r => ({ ...r, examTitle: exams.find(e => e.id === r.examId)?.title }))
      .filter(r => r.examTitle)
  } catch {
    toast.error('Không thể tải lịch sử kiểm tra.')
  } finally {
    historyLoading.value = false
  }
}

onMounted(load)
</script>
