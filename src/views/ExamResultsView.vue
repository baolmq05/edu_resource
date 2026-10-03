<template>
  <div class="container-xl py-4">
    <nav aria-label="breadcrumb">
      <ol class="breadcrumb small">
        <li class="breadcrumb-item"><router-link to="/exams" class="text-dark">Bài kiểm tra</router-link></li>
        <li class="breadcrumb-item active">Kết quả làm bài</li>
      </ol>
    </nav>

    <LoadingSpinner v-if="loading" />
    <ErrorState v-else-if="error" :message="error" @retry="load" />

    <template v-else>
      <div class="mb-3">
        <h1 class="h4 fw-bold mb-1">{{ exam.title }}</h1>
        <div class="text-muted small">
          {{ exam.classId === 'all' || !exam.classId ? 'Phạm vi: Toàn trường' : 'Lớp ' + cls?.name }} • {{ exam.questions.length }} câu • {{ exam.duration }} phút
        </div>
      </div>

      <div class="row g-3 mb-4">
        <div v-for="s in summary" :key="s.label" class="col-6 col-lg-3">
          <div class="card p-3 h-100">
            <div class="small text-muted">{{ s.label }}</div>
            <div class="h3 fw-bold mb-0">{{ s.value }}</div>
          </div>
        </div>
      </div>

      <div class="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-2">
        <h2 class="h6 fw-bold mb-0">Danh sách học sinh</h2>
        <div class="btn-group btn-group-sm" role="group">
          <button v-for="f in FILTERS" :key="f.value" type="button" class="btn" :class="filter === f.value ? 'btn-dark' : 'btn-outline-dark'" @click="filter = f.value">
            {{ f.label }}
          </button>
        </div>
      </div>

      <div class="card p-3 mb-3">
        <input v-model="search" type="search" class="form-control form-control-sm" placeholder="Tìm học sinh..." />
      </div>

      <EmptyState v-if="!rows.length" icon="bi bi-people" title="Không có học sinh" description="Không có học sinh phù hợp với bộ lọc." />
      <div v-else class="card overflow-hidden mb-2">
        <div class="table-responsive">
          <table class="table table-hover mb-0">
            <thead>
              <tr><th>Học sinh</th><th>Trạng thái</th><th>Nộp lúc</th><th>Thời gian làm</th><th>Đúng / Sai</th><th>Điểm</th><th></th></tr>
            </thead>
            <tbody>
              <tr v-for="row in paged" :key="row.student.id">
                <td class="fw-medium">{{ row.student.displayName }}</td>
                <td><span class="badge" :class="resultStatusInfo(row.result).badge">{{ resultStatusInfo(row.result).label }}</span></td>
                <td class="small">{{ row.done ? formatDateTime(row.result.submittedAt) : '—' }}</td>
                <td class="small">{{ row.done ? formatDuration(row.result.durationSeconds) : '—' }}</td>
                <td class="small">{{ row.done ? `${row.result.correctCount} / ${row.result.wrongCount}` : '—' }}</td>
                <td class="fw-bold">{{ row.done ? `${scoreTo10(row.result)}/10` : '—' }}</td>
                <td class="text-end">
                  <router-link v-if="row.done" :to="`/results/${row.result.id}`" class="btn btn-outline-dark btn-sm">Chi tiết</router-link>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      <Pagination v-model:current-page="page" :total-items="rows.length" :page-size="PAGE_SIZE" />

      <h2 class="h6 fw-bold mt-4 mb-2">Tỷ lệ đúng / sai theo câu</h2>
      <p v-if="!stats.perQuestion.length || !stats.submittedCount" class="text-muted small">Chưa có dữ liệu thống kê.</p>
      <div v-else class="card overflow-hidden">
        <div class="table-responsive">
          <table class="table mb-0">
            <thead><tr><th>Câu</th><th>Nội dung</th><th>Đúng</th><th>Sai</th><th style="width: 200px;">Tỷ lệ đúng</th></tr></thead>
            <tbody>
              <tr v-for="p in stats.perQuestion" :key="p.question.id">
                <td>{{ p.question.order }}</td>
                <td class="small text-truncate" style="max-width: 360px;">{{ p.question.content }}</td>
                <td>{{ p.correct }}</td>
                <td>{{ p.wrong }}</td>
                <td>
                  <div class="progress" style="height: 8px;" :title="`${rate(p)}%`">
                    <div class="progress-bar bg-dark" :style="{ width: rate(p) + '%' }"></div>
                  </div>
                  <span class="small text-muted">{{ rate(p) }}%</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { currentUser } from '@/stores/authState'
import { getExamById, getResults, computeExamStats, scoreTo10, resultStatusInfo } from '@/services/exam.service'
import { getClassById, getClassStudents } from '@/services/class.service'
import { getUsers } from '@/services/user.service'
import { formatDateTime, formatDuration, paginate } from '@/utils/helpers'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import ErrorState from '@/components/common/ErrorState.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import Pagination from '@/components/common/Pagination.vue'

const PAGE_SIZE = 10
const FILTERS = [
  { value: 'all', label: 'Tất cả' },
  { value: 'done', label: 'Đã làm' },
  { value: 'todo', label: 'Chưa làm' }
]

const route = useRoute()
const loading = ref(true)
const error = ref('')
const exam = ref(null)
const cls = ref(null)
const students = ref([])
const results = ref([])
const filter = ref('all')
const search = ref('')
const page = ref(1)

const stats = computed(() => computeExamStats(exam.value, results.value))
const rate = p => (p.correct + p.wrong ? Math.round((p.correct / (p.correct + p.wrong)) * 100) : 0)

const allRows = computed(() =>
  students.value.map(student => {
    const result = results.value.find(r => r.studentId === student.id) || null
    return { student, result, done: Boolean(result && result.status !== 'in_progress') }
  })
)

const rows = computed(() => {
  const s = search.value.trim().toLowerCase()
  return allRows.value.filter(r => {
    if (s && !r.student.displayName.toLowerCase().includes(s)) return false
    if (filter.value === 'done') return r.done
    if (filter.value === 'todo') return !r.done
    return true
  })
})
const paged = computed(() => paginate(rows.value, page.value, PAGE_SIZE))
watch([filter, search], () => { page.value = 1 })

const summary = computed(() => [
  { label: 'Đã nộp bài', value: `${stats.value.submittedCount}/${students.value.length}` },
  { label: 'Chưa làm', value: allRows.value.filter(r => !r.done).length },
  { label: 'Điểm trung bình', value: stats.value.submittedCount ? stats.value.average : '—' },
  { label: 'Tỷ lệ đúng', value: stats.value.submittedCount ? `${stats.value.correctRate}%` : '—' }
])

const load = async () => {
  loading.value = true
  error.value = ''
  try {
    const e = await getExamById(route.params.id)
    if (!e) {
      error.value = 'Không tìm thấy đề thi.'
      return
    }
    const u = currentUser.value
    if (u.role === 'teacher' && e.createdBy !== u.uid) {
      error.value = 'Bạn chỉ được xem kết quả của các bài kiểm tra do chính mình tạo ra.'
      return
    }
    let list = []
    let c = null
    if (e.classId && e.classId !== 'all') {
      c = await getClassById(e.classId)
      list = await getClassStudents(e.classId)
    } else {
      c = { name: 'Toàn trường' }
      const allUsers = await getUsers()
      list = allUsers.filter(x => x.role === 'student')
    }
    const res = await getResults({ examId: e.id })
    exam.value = e
    cls.value = c
    students.value = list
    results.value = res
  } catch {
    error.value = 'Không thể tải kết quả.'
  } finally {
    loading.value = false
  }
}

onMounted(load)
</script>
