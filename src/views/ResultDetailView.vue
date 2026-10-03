<template>
  <div class="container-xl py-4">
    <nav aria-label="breadcrumb">
      <ol class="breadcrumb small">
        <li v-if="isStudent" class="breadcrumb-item"><router-link to="/results" class="text-dark">Kết quả của tôi</router-link></li>
        <template v-else>
          <li class="breadcrumb-item"><router-link to="/exams" class="text-dark">Ngân hàng đề</router-link></li>
          <li v-if="exam" class="breadcrumb-item"><router-link :to="`/exams/${exam.id}/results`" class="text-dark">Kết quả lớp</router-link></li>
        </template>
        <li class="breadcrumb-item active">Chi tiết bài làm</li>
      </ol>
    </nav>

    <LoadingSpinner v-if="loading" />
    <ErrorState v-else-if="error" :message="error" @retry="load" />

    <template v-else>
      <div class="card p-4 mb-3">
        <div class="d-flex flex-wrap justify-content-between gap-3">
          <div>
            <h1 class="h5 fw-bold mb-1">{{ exam.title }}</h1>
            <div class="small text-muted">
              <span v-if="!isStudent">Học sinh: <strong class="text-dark">{{ student?.displayName || 'Không xác định' }}</strong> •</span>
              Nộp lúc {{ formatDateTime(result.submittedAt) }} •
              Thời gian làm {{ formatDuration(result.durationSeconds) }}
            </div>
            <span class="badge mt-2" :class="statusInfo.badge">{{ statusInfo.label }}</span>
          </div>
          <div class="text-end">
            <div class="display-6 fw-bold">{{ scoreTo10(result) }}<span class="fs-5 text-muted">/10</span></div>
            <div class="small text-muted">{{ result.score }}/{{ result.maxScore }} điểm</div>
          </div>
        </div>
        <hr />
        <div class="row text-center g-2">
          <div class="col-6"><div class="h5 fw-bold mb-0">{{ result.correctCount }}</div><div class="small text-muted">Câu đúng</div></div>
          <div class="col-6"><div class="h5 fw-bold mb-0">{{ result.wrongCount }}</div><div class="small text-muted">Câu sai</div></div>
        </div>
      </div>

      <div v-if="isStudent && !exam.showAnswers" class="alert alert-light border">
        Giáo viên không cho phép xem chi tiết đáp án của bài kiểm tra này.
      </div>

      <template v-else>
        <h2 class="h6 fw-bold mb-2">Chi tiết câu trả lời</h2>
        <div v-for="(q, i) in exam.questions" :key="q.id">
          <QuestionBody
            :question="q"
            :index="i + 1"
            readonly
            show-correct
            show-meta
            :model-value="result.answers[q.id] ?? (q.type === 'multiple_choice' ? [] : '')"
            :status-label="labelOf(q).label"
            :status-badge="labelOf(q).badge"
          />
        </div>
      </template>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { currentUser, isStudent } from '@/stores/authState'
import { getResultById, getExamById, scoreTo10, resultStatusInfo, isCorrect, isAnswered } from '@/services/exam.service'
import { getUserById } from '@/services/user.service'
import { getClassById } from '@/services/class.service'
import { formatDateTime, formatDuration } from '@/utils/helpers'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import ErrorState from '@/components/common/ErrorState.vue'
import QuestionBody from '@/components/exams/QuestionBody.vue'

const route = useRoute()

const loading = ref(true)
const error = ref('')
const result = ref(null)
const exam = ref(null)
const student = ref(null)

const statusInfo = computed(() => resultStatusInfo(result.value))

const labelOf = q => {
  const answer = result.value.answers[q.id]
  if (!isAnswered(answer)) return { label: 'Chưa trả lời', badge: 'bg-light text-dark border' }
  return isCorrect(q, answer)
    ? { label: 'Đúng', badge: 'bg-success text-white' }
    : { label: 'Sai', badge: 'bg-danger text-white' }
}

const load = async () => {
  loading.value = true
  error.value = ''
  try {
    const r = await getResultById(route.params.id)
    if (!r) {
      error.value = 'Không tìm thấy bài làm.'
      return
    }
    const e = await getExamById(r.examId)
    if (!e) {
      error.value = 'Đề thi của bài làm này đã bị xóa.'
      return
    }
    const u = currentUser.value
    if (u.role === 'student' && r.studentId !== u.uid) {
      error.value = 'Bạn không có quyền xem bài làm này.'
      return
    }
    if (u.role === 'teacher') {
      const c = await getClassById(e.classId)
      if (e.createdBy !== u.uid && !c?.teacherIds.includes(u.uid)) {
        error.value = 'Bạn không có quyền xem bài làm này.'
        return
      }
    }
    result.value = r
    exam.value = e
    if (!isStudent.value) student.value = await getUserById(r.studentId)
  } catch {
    error.value = 'Không thể tải chi tiết bài làm.'
  } finally {
    loading.value = false
  }
}

onMounted(load)
</script>
