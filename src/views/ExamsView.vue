<template>
  <div class="container-xl py-4">
    <div class="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
      <div>
        <h1 class="h4 fw-bold mb-1">
          {{ isStudent ? 'Bài kiểm tra của bạn' : (isAdmin ? 'Quản lý bài kiểm tra' : 'Bài kiểm tra của tôi') }}
        </h1>
        <p class="text-muted small mb-0">
          {{
            isStudent
              ? 'Danh sách các bài kiểm tra được giao cho lớp của bạn hoặc bài kiểm tra toàn trường.'
              : (isAdmin
                  ? 'Quản lý toàn bộ bài kiểm tra trực tuyến trong hệ thống.'
                  : 'Quản lý các bài kiểm tra do bạn tạo, theo dõi tình hình làm bài và chấm điểm.')
          }}
        </p>
      </div>

      <div v-if="!isStudent" class="d-flex flex-wrap align-items-center gap-2">
        <!-- Bộ lọc phạm vi chỉ dành cho Admin -->
        <div v-if="isAdmin" class="btn-group btn-group-sm">
          <button
            type="button"
            class="btn"
            :class="scopeFilter === 'all' ? 'btn-dark' : 'btn-outline-dark'"
            @click="scopeFilter = 'all'"
          >
            Tất cả đề ({{ exams.length }})
          </button>
          <button
            type="button"
            class="btn"
            :class="scopeFilter === 'mine' ? 'btn-dark' : 'btn-outline-dark'"
            @click="scopeFilter = 'mine'"
          >
            <i class="bi bi-person-fill me-1"></i>Đề của tôi ({{ myExamCount }})
          </button>
        </div>

        <router-link id="create-exam-btn" to="/exams/create" class="btn btn-dark btn-sm">
          <i class="bi bi-plus-lg me-1"></i>Tạo đề mới
        </router-link>
      </div>
    </div>

    <div class="card p-3 mb-3">
      <div class="row g-2">
        <div class="col-12 col-md-4">
          <input v-model="search" type="search" class="form-control form-control-sm" placeholder="Tìm theo tên đề..." />
        </div>
        <div class="col-6 col-md" :class="isStudent ? 'col-md-4' : ''">
          <select v-model="subjectFilter" class="form-select form-select-sm" aria-label="Lọc theo môn">
            <option value="all">Mọi môn học</option>
            <option v-for="s in subjects" :key="s.id" :value="s.id">{{ s.name }}</option>
          </select>
        </div>
        <template v-if="!isStudent">
          <div class="col-6 col-md">
            <select v-model="classFilter" class="form-select form-select-sm" aria-label="Lọc theo lớp">
              <option value="all">Mọi lớp / Toàn trường</option>
              <option value="all_school">Toàn trường</option>
              <option v-for="c in classes" :key="c.id" :value="c.id">{{ c.name }}</option>
            </select>
          </div>
          <div class="col-6 col-md">
            <select v-model="gradeFilter" class="form-select form-select-sm" aria-label="Lọc theo khối">
              <option value="all">Mọi khối</option>
              <option v-for="g in GRADES" :key="g" :value="String(g)">Khối {{ g }}</option>
            </select>
          </div>
          <div class="col-6 col-md">
            <select v-model="statusFilter" class="form-select form-select-sm" aria-label="Lọc theo trạng thái">
              <option value="all">Mọi trạng thái</option>
              <option v-for="(v, k) in EXAM_STATUS" :key="k" :value="k">{{ v.label }}</option>
            </select>
          </div>
        </template>
      </div>
    </div>

    <LoadingSpinner v-if="loading" />
    <ErrorState v-else-if="error" :message="error" @retry="load" />
    <EmptyState
      v-else-if="!filtered.length"
      icon="bi bi-card-checklist"
      title="Chưa có đề nào"
      :description="
        isStudent
          ? 'Hiện chưa có bài kiểm tra nào được mở cho lớp của bạn hoặc toàn trường.'
          : (isAdmin
              ? (scopeFilter === 'mine' ? 'Bạn chưa tạo bài kiểm tra nào.' : 'Chưa có bài kiểm tra nào trong hệ thống.')
              : 'Bạn chưa tạo bài kiểm tra nào. Hãy bấm &quot;Tạo đề mới&quot; để bắt đầu.')
      "
      :action-text="isStudent ? '' : 'Tạo đề mới'"
      @action="$router.push('/exams/create')"
    />

    <!-- HỌC SINH -->
    <div v-else-if="isStudent" class="row g-3">
      <div v-for="e in paged" :key="e.id" class="col-12 col-md-6 col-lg-4">
        <div class="card h-100 p-3">
          <div class="d-flex justify-content-between align-items-start mb-2">
            <div class="d-flex align-items-center gap-1 flex-wrap">
              <span class="badge bg-light text-dark border">{{ subjectName(e.subjectId) }}</span>
              <span v-if="e.classId === 'all' || !e.classId" class="badge bg-dark text-white">
                <i class="bi bi-globe me-1"></i>Toàn trường
              </span>
              <span v-else class="badge bg-light text-dark border">
                <i class="bi bi-door-closed me-1"></i>Lớp {{ className(e.classId) }}
              </span>
            </div>
            <span class="badge" :class="studentState(e).badge">{{ studentState(e).label }}</span>
          </div>
          <h2 class="h6 fw-bold mb-1">{{ e.title }}</h2>
          <p class="small text-muted mb-2">{{ e.description || 'Không có mô tả thêm.' }}</p>
          <ul class="list-unstyled small text-muted mb-3">
            <li><i class="bi bi-clock me-1"></i>{{ e.duration }} phút • {{ e.questions.length }} câu hỏi</li>
            <li><i class="bi bi-calendar-event me-1"></i>Bắt đầu: {{ formatDateTime(e.startAt) }}</li>
            <li><i class="bi bi-calendar-x me-1"></i>Kết thúc: {{ formatDateTime(e.endAt) }}</li>
          </ul>
          <div class="mt-auto">
            <router-link
              v-if="attemptOf(e.id) && attemptOf(e.id).status !== 'in_progress'"
              :to="`/results/${attemptOf(e.id).id}`"
              class="btn btn-outline-dark btn-sm w-100"
            >
              Xem kết quả
            </router-link>
            <button
              v-else
              type="button"
              class="btn btn-dark btn-sm w-100"
              :disabled="!canTake(e)"
              @click="$router.push(`/exams/${e.id}/take`)"
            >
              {{ attemptOf(e.id) ? 'Tiếp tục làm bài' : 'Bắt đầu làm bài' }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- GIÁO VIÊN / ADMIN -->
    <div v-else class="card exams-table-card">
      <div class="table-responsive exams-table-wrap">
        <table class="table table-hover mb-0 align-middle">
          <thead>
            <tr>
              <th>Tên đề</th>
              <th>Môn / Lớp áp dụng</th>
              <th>Người tạo</th>
              <th>Thời gian</th>
              <th>Trạng thái</th>
              <th class="text-end">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="e in paged" :key="e.id">
              <td>
                <div class="fw-semibold d-flex align-items-center gap-1 flex-wrap">
                  <span>{{ e.title }}</span>
                  <span v-if="e.createdBy === user.uid" class="badge bg-dark text-white" style="font-size: 0.7rem;">
                    <i class="bi bi-person-check-fill me-1"></i>Của bạn
                  </span>
                </div>
                <div class="small text-muted">{{ e.questions.length }} câu • {{ e.duration }} phút • Cập nhật {{ formatDate(e.updatedAt) }}</div>
              </td>
              <td class="small">
                <div class="fw-medium">{{ subjectName(e.subjectId) }}</div>
                <div class="text-muted">
                  <span v-if="e.classId === 'all' || !e.classId" class="badge bg-light text-dark border">Toàn trường</span>
                  <span v-else>Lớp {{ className(e.classId) }} (Khối {{ e.grade }})</span>
                </div>
              </td>
              <td class="small">
                <span v-if="e.createdBy === user.uid" class="fw-semibold text-dark">
                  <i class="bi bi-person-fill me-1"></i>Bạn
                </span>
                <span v-else class="text-muted">
                  <i class="bi bi-person me-1"></i>{{ authorName(e.createdBy) }}
                </span>
              </td>
              <td class="small text-muted">
                <div>{{ formatDateTime(e.startAt) }}</div>
                <div>{{ formatDateTime(e.endAt) }}</div>
              </td>
              <td><span class="badge" :class="EXAM_STATUS[e.status].badge">{{ EXAM_STATUS[e.status].label }}</span></td>
              <td class="text-end text-nowrap">
                <router-link
                  v-if="canManageExam(e)"
                  :to="`/exams/${e.id}/edit`"
                  class="btn btn-outline-dark btn-sm"
                  title="Chỉnh sửa"
                >
                  <i class="bi bi-pencil"></i>
                </router-link>
                <router-link :to="`/exams/${e.id}/results`" class="btn btn-outline-dark btn-sm ms-1" title="Kết quả">
                  <i class="bi bi-bar-chart"></i>
                </router-link>
                <div class="dropdown d-inline-block ms-1">
                  <button class="btn btn-outline-dark btn-sm" type="button" data-bs-toggle="dropdown" aria-expanded="false" aria-label="Thêm thao tác">
                    <i class="bi bi-three-dots"></i>
                  </button>
                  <ul class="dropdown-menu dropdown-menu-end">
                    <template v-if="canManageExam(e)">
                      <li v-if="e.status !== 'published'">
                        <button type="button" class="dropdown-item" @click="ask('publish', e)"><i class="bi bi-send me-2"></i>Xuất bản</button>
                      </li>
                      <li v-if="e.status === 'published'">
                        <button type="button" class="dropdown-item" @click="ask('close', e)"><i class="bi bi-lock me-2"></i>Đóng đề</button>
                      </li>
                      <li v-if="e.status !== 'draft'">
                        <button type="button" class="dropdown-item" @click="ask('draft', e)"><i class="bi bi-file-earmark me-2"></i>Chuyển về nháp</button>
                      </li>
                    </template>
                    <li><button type="button" class="dropdown-item" @click="ask('copy', e)"><i class="bi bi-files me-2"></i>Sao chép đề</button></li>
                    <template v-if="canManageExam(e)">
                      <li><hr class="dropdown-divider" /></li>
                      <li><button type="button" class="dropdown-item text-danger" @click="ask('delete', e)"><i class="bi bi-trash me-2"></i>Xóa đề</button></li>
                    </template>
                  </ul>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <Pagination v-model:current-page="page" :total-items="filtered.length" :page-size="PAGE_SIZE" />

    <ConfirmModal
      :is-open="Boolean(pending)"
      :title="confirmInfo.title"
      :message="confirmInfo.message"
      :confirm-text="confirmInfo.button"
      :variant="pending?.action === 'delete' ? 'danger' : 'dark'"
      :loading="submitting"
      @confirm="runPending"
      @cancel="pending = null"
    />
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { currentUser as user, isAdmin, isStudent } from '@/stores/authState'
import { getExams, getResults, setExamStatus, copyExam, deleteExam, resultStatusInfo, checkTakeAccess } from '@/services/exam.service'
import { getSubjects } from '@/services/subject.service'
import { getClasses } from '@/services/class.service'
import { getUsers } from '@/services/user.service'
import { EXAM_STATUS, GRADES, formatDate, formatDateTime, paginate } from '@/utils/helpers'
import { useToast } from '@/composables/useToast'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import ErrorState from '@/components/common/ErrorState.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import Pagination from '@/components/common/Pagination.vue'
import ConfirmModal from '@/components/common/ConfirmModal.vue'

const PAGE_SIZE = 9
const toast = useToast()

const scopeFilter = ref('all') // 'all' | 'mine' (chỉ dùng cho Admin)
const loading = ref(true)
const error = ref('')
const submitting = ref(false)
const exams = ref([])
const subjects = ref([])
const classes = ref([])
const users = ref([])
const myResults = ref([])

const search = ref('')
const subjectFilter = ref('all')
const classFilter = ref('all')
const gradeFilter = ref('all')
const statusFilter = ref('all')
const page = ref(1)
const pending = ref(null)

const subjectName = id => subjects.value.find(s => s.id === id)?.name || '—'
const className = id => (!id || id === 'all') ? 'Toàn trường' : (classes.value.find(c => c.id === id)?.name || '—')
const attemptOf = examId => myResults.value.find(r => r.examId === examId)
const authorName = uid => {
  if (!uid) return '—'
  if (uid === user.value?.uid) return 'Bạn'
  const u = users.value.find(x => x.uid === uid)
  return u ? u.displayName : uid
}

const myExamCount = computed(() => exams.value.filter(e => e.createdBy === user.value?.uid).length)
const canManageExam = e => !isStudent.value && (e.createdBy === user.value?.uid || user.value?.role === 'admin')

const filtered = computed(() => {
  const s = search.value.trim().toLowerCase()
  const uid = user.value?.uid
  return exams.value.filter(e => {
    if (isAdmin.value && scopeFilter.value === 'mine' && e.createdBy !== uid) return false
    if (s && !e.title.toLowerCase().includes(s)) return false
    if (subjectFilter.value !== 'all' && e.subjectId !== subjectFilter.value) return false
    if (classFilter.value === 'all_school') {
      if (e.classId !== 'all' && Boolean(e.classId)) return false
    } else if (classFilter.value !== 'all' && e.classId !== classFilter.value) {
      return false
    }
    if (gradeFilter.value !== 'all' && String(e.grade) !== gradeFilter.value) return false
    if (statusFilter.value !== 'all' && e.status !== statusFilter.value) return false
    return true
  })
})
const paged = computed(() => paginate(filtered.value, page.value, PAGE_SIZE))
watch([search, subjectFilter, classFilter, gradeFilter, statusFilter, scopeFilter], () => { page.value = 1 })

const canTake = e => checkTakeAccess(e, user.value, attemptOf(e.id)).ok

const studentState = e => {
  const r = attemptOf(e.id)
  if (r) return resultStatusInfo(r)
  const now = Date.now()
  if (e.startAt && now < new Date(e.startAt).getTime()) return { label: 'Sắp diễn ra', badge: 'bg-light text-dark border' }
  if (e.endAt && now > new Date(e.endAt).getTime()) return { label: 'Đã hết hạn', badge: 'bg-secondary text-white' }
  return { label: 'Chưa làm', badge: 'bg-dark text-white' }
}

const confirmInfo = computed(() => {
  const e = pending.value?.exam
  const map = {
    publish: ['Xuất bản đề', `Xuất bản "${e?.title}"? Học sinh thuộc phạm vi áp dụng sẽ nhìn thấy đề này.`, 'Xuất bản'],
    close: ['Đóng đề', `Đóng "${e?.title}"? Học sinh sẽ không thể làm bài nữa.`, 'Đóng đề'],
    draft: ['Chuyển về nháp', `Chuyển "${e?.title}" về trạng thái nháp? Học sinh sẽ không còn thấy đề.`, 'Chuyển về nháp'],
    copy: ['Sao chép đề', `Tạo bản sao nháp của "${e?.title}"?`, 'Sao chép'],
    delete: ['Xóa đề', `Xóa "${e?.title}"? Toàn bộ bài làm của học sinh cho đề này cũng sẽ bị xóa.`, 'Xóa đề']
  }
  const [title, message, button] = map[pending.value?.action] || ['Xác nhận', '', 'Đồng ý']
  return { title, message, button }
})

const ask = (action, exam) => {
  if (action === 'publish') {
    if (!exam.questions.length) return toast.warning('Đề chưa có câu hỏi, không thể xuất bản.')
    if (exam.startAt && exam.endAt && new Date(exam.endAt) <= new Date(exam.startAt)) {
      return toast.warning('Thời gian kết thúc phải sau thời gian bắt đầu.')
    }
  }
  pending.value = { action, exam }
}

const runPending = async () => {
  const { action, exam } = pending.value
  submitting.value = true
  try {
    if (action === 'publish') await setExamStatus(exam.id, 'published')
    else if (action === 'close') await setExamStatus(exam.id, 'closed')
    else if (action === 'draft') await setExamStatus(exam.id, 'draft')
    else if (action === 'copy') await copyExam(exam, user.value)
    else if (action === 'delete') await deleteExam(exam.id)
    toast.success('Thao tác thành công.')
    pending.value = null
    await load()
  } catch {
    toast.error('Thao tác thất bại. Vui lòng thử lại.')
  } finally {
    submitting.value = false
  }
}

const load = async () => {
  loading.value = true
  error.value = ''
  try {
    const [e, s, c, r, uList] = await Promise.all([
      getExams(user.value),
      getSubjects(),
      getClasses(),
      isStudent.value ? getResults({ studentId: user.value.uid }) : Promise.resolve([]),
      getUsers()
    ])
    exams.value = e
    subjects.value = s
    classes.value = c
    myResults.value = r
    users.value = uList
  } catch {
    error.value = 'Không thể tải danh sách đề.'
  } finally {
    loading.value = false
  }
}

onMounted(load)
</script>

<style scoped>
@media (min-width: 768px) {
  .exams-table-wrap {
    overflow: visible;
  }
  .exams-table-card thead th:first-child {
    border-top-left-radius: inherit;
  }
}
</style>
