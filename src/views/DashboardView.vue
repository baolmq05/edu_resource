<template>
  <div class="container-xl py-4">
    <div class="mb-4">
      <h1 class="h4 fw-bold mb-1">Xin chào, {{ currentUser.displayName }}</h1>
      <p class="text-muted small mb-0">{{ isStudent ? 'Tổng quan học tập của bạn' : 'Tổng quan giảng dạy của bạn' }}</p>
    </div>

    <LoadingSpinner v-if="loading" />
    <ErrorState v-else-if="error" :message="error" @retry="load" />

    <!-- GIÁO VIÊN -->
    <template v-else-if="isTeacherRole">
      <div class="row g-3 mb-4">
        <div v-for="s in teacherStats" :key="s.label" class="col-6 col-lg-3">
          <div class="card p-3 h-100">
            <div class="small text-muted">{{ s.label }}</div>
            <div class="h3 fw-bold mb-0">{{ s.value }}</div>
          </div>
        </div>
      </div>

      <div class="row g-3">
        <div class="col-12 col-lg-6">
          <div class="card h-100">
            <div class="card-header d-flex justify-content-between align-items-center">
              <span class="fw-semibold">Đề do bạn tạo gần đây</span>
              <router-link to="/exams" class="small text-dark">Xem tất cả</router-link>
            </div>
            <ul class="list-group list-group-flush">
              <li v-for="e in (myExams.length ? myExams : exams).slice(0, 5)" :key="e.id" class="list-group-item d-flex justify-content-between align-items-center">
                <div>
                  <div class="fw-medium">{{ e.title }}</div>
                  <div class="small text-muted">Lớp {{ classNameOf(e.classId) }}</div>
                </div>
                <span class="badge" :class="EXAM_STATUS[e.status].badge">{{ EXAM_STATUS[e.status].label }}</span>
              </li>
              <li v-if="!myExams.length && !exams.length" class="list-group-item text-muted small">Chưa có đề nào. <router-link to="/exams/create">Tạo đề mới</router-link></li>
            </ul>
          </div>
        </div>
        <div class="col-12 col-lg-6">
          <ResourceRecent :plans="myPlans.length ? myPlans : plans" :slides="mySlides.length ? mySlides : slides" :samples="mySampleExams.length ? mySampleExams : sampleExams" />
        </div>
      </div>
    </template>

    <!-- HỌC SINH -->
    <template v-else-if="isStudent">
      <div class="row g-3 mb-4">
        <div v-for="s in studentStats" :key="s.label" class="col-6 col-lg-3">
          <div class="card p-3 h-100">
            <div class="small text-muted">{{ s.label }}</div>
            <div class="h3 fw-bold mb-0">{{ s.value }}</div>
          </div>
        </div>
      </div>

      <div v-if="!currentUser.classId" class="alert alert-light border">
        Bạn chưa được xếp vào lớp nào. Vui lòng liên hệ quản trị viên để được xếp lớp.
      </div>

      <div class="row g-3">
        <div class="col-12 col-lg-6">
          <div class="card h-100">
            <div class="card-header d-flex justify-content-between align-items-center">
              <span class="fw-semibold">Bài kiểm tra được giao</span>
              <router-link to="/exams" class="small text-dark">Xem tất cả</router-link>
            </div>
            <ul class="list-group list-group-flush">
              <li v-for="e in exams.slice(0, 5)" :key="e.id" class="list-group-item d-flex justify-content-between align-items-center">
                <div>
                  <div class="fw-medium">{{ e.title }}</div>
                  <div class="small text-muted">{{ formatDateTime(e.startAt) }} - {{ formatDateTime(e.endAt) }}</div>
                </div>
                <span class="badge" :class="takeState(e).badge">{{ takeState(e).label }}</span>
              </li>
              <li v-if="!exams.length" class="list-group-item text-muted small">Chưa có bài kiểm tra nào được giao.</li>
            </ul>
          </div>
        </div>
        <div class="col-12 col-lg-6">
          <div class="card h-100">
            <div class="card-header d-flex justify-content-between align-items-center">
              <span class="fw-semibold">Điểm số gần đây</span>
              <router-link to="/results" class="small text-dark">Lịch sử</router-link>
            </div>
            <ul class="list-group list-group-flush">
              <li v-for="r in finished.slice(0, 5)" :key="r.id" class="list-group-item d-flex justify-content-between align-items-center">
                <router-link :to="`/results/${r.id}`" class="text-dark text-decoration-none">
                  {{ examTitle(r.examId) }}
                </router-link>
                <span class="fw-bold">{{ scoreTo10(r) }}/10</span>
              </li>
              <li v-if="!finished.length" class="list-group-item text-muted small">Chưa có bài làm nào.</li>
            </ul>
          </div>
        </div>
        <div class="col-12">
          <ResourceRecent :plans="plans" :slides="slides" :samples="sampleExams" />
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { currentUser, isAdmin, isStudent, isTeacherRole } from '@/stores/authState'
import { getClassesForUser, getClasses, getClassStudents } from '@/services/class.service'
import { getExams, getResults, scoreTo10, resultStatusInfo } from '@/services/exam.service'
import { getResources } from '@/services/resource.service'
import { EXAM_STATUS, formatDateTime } from '@/utils/helpers'
import ResourceRecent from '@/components/common/ResourceRecent.vue'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import ErrorState from '@/components/common/ErrorState.vue'

const router = useRouter()
const loading = ref(true)
const error = ref('')

const myClasses = ref([])
const allClasses = ref([])
const studentCount = ref(0)
const exams = ref([])
const results = ref([])
const plans = ref([])
const slides = ref([])
const sampleExams = ref([])

const classNameOf = id => (!id || id === 'all') ? 'Toàn trường' : (allClasses.value.find(c => c.id === id)?.name || '—')
const examTitle = id => exams.value.find(e => e.id === id)?.title || 'Bài kiểm tra'

const myAttempt = examId => results.value.find(r => r.examId === examId)
const finished = computed(() => results.value.filter(r => r.status !== 'in_progress'))

const takeState = e => {
  const r = myAttempt(e.id)
  if (r && r.status !== 'in_progress') return resultStatusInfo(r)
  const now = Date.now()
  if (e.startAt && now < new Date(e.startAt).getTime()) return { label: 'Sắp diễn ra', badge: 'bg-light text-dark border' }
  if (e.endAt && now > new Date(e.endAt).getTime()) return { label: 'Đã hết hạn', badge: 'bg-secondary text-white' }
  return { label: r ? 'Đang làm' : 'Có thể làm', badge: 'bg-dark text-white' }
}

const myExams = computed(() => exams.value.filter(e => e.createdBy === currentUser.value.uid))
const myPlans = computed(() => plans.value.filter(p => p.teacherId === currentUser.value.uid))
const mySlides = computed(() => slides.value.filter(s => s.teacherId === currentUser.value.uid))
const mySampleExams = computed(() => sampleExams.value.filter(s => s.teacherId === currentUser.value.uid))

const teacherStats = computed(() => {
  const examIds = new Set(myExams.value.map(e => e.id))
  const done = results.value.filter(r => examIds.has(r.examId) && r.status !== 'in_progress')
  const avg = done.length ? (done.reduce((s, r) => s + scoreTo10(r), 0) / done.length).toFixed(2) : '—'
  return [
    { label: 'Lớp phụ trách', value: myClasses.value.length },
    { label: 'Tổng số học sinh', value: studentCount.value },
    { label: 'Bài kiểm tra đã tạo', value: myExams.value.length },
    { label: 'Đề mẫu tự luyện', value: mySampleExams.value.length },
    { label: 'KH bài dạy của bạn', value: myPlans.value.length },
    { label: 'Slide bài dạy của bạn', value: mySlides.value.length },
    { label: 'Lượt học sinh nộp bài', value: done.length },
    { label: 'Điểm trung bình các bài', value: avg }
  ]
})

const studentStats = computed(() => {
  const now = Date.now()
  const upcoming = exams.value.filter(e => e.startAt && new Date(e.startAt).getTime() > now).length
  return [
    { label: 'Lớp hiện tại', value: myClasses.value[0]?.name || '—' },
    { label: 'Bài được giao', value: exams.value.length },
    { label: 'Sắp diễn ra', value: upcoming },
    { label: 'Đã làm', value: finished.value.length }
  ]
})

const load = async () => {
  loading.value = true
  error.value = ''
  try {
    const user = currentUser.value
    const [classes, every, examList, resList, planList, slideList, sampleList] = await Promise.all([
      getClassesForUser(user),
      getClasses(),
      getExams(user),
      user.role === 'student' ? getResults({ studentId: user.uid }) : getResults(),
      getResources('lesson_plans', user),
      getResources('slides', user),
      getResources('sample_exams', user)
    ])
    myClasses.value = classes
    allClasses.value = every
    exams.value = examList
    results.value = resList
    plans.value = planList
    slides.value = slideList
    sampleExams.value = sampleList
    if (user.role === 'teacher') {
      const lists = await Promise.all(classes.map(c => getClassStudents(c.id)))
      studentCount.value = lists.reduce((s, l) => s + l.length, 0)
    }
  } catch {
    error.value = 'Không thể tải dữ liệu bảng điều khiển.'
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  if (isAdmin.value) {
    router.replace('/admin')
    return
  }
  load()
})
</script>
