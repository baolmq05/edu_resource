<template>
  <div class="container-xl py-4">
    <LoadingSpinner v-if="loading" />
    <ErrorState v-else-if="error" :message="error" @retry="load" />

    <!-- Không được phép làm bài -->
    <div v-else-if="blocked" class="card p-5 text-center">
      <i class="bi bi-slash-circle display-5 text-secondary mb-3"></i>
      <h1 class="h5 fw-bold">Không thể làm bài</h1>
      <p class="text-muted">{{ blocked }}</p>
      <div><router-link to="/exams" class="btn btn-dark btn-sm">Về danh sách bài kiểm tra</router-link></div>
    </div>

    <!-- Màn hình bắt đầu -->
    <div v-else-if="!attempt" class="row justify-content-center">
      <div class="col-12 col-md-8 col-lg-6">
        <div class="card p-4">
          <h1 class="h4 fw-bold mb-1">{{ exam.title }}</h1>
          <p class="text-muted small">{{ exam.description }}</p>
          <ul class="list-unstyled small mb-4">
            <li class="mb-1"><i class="bi bi-clock me-2"></i>Thời gian làm bài: <strong>{{ exam.duration }} phút</strong></li>
            <li class="mb-1"><i class="bi bi-list-ol me-2"></i>Số câu hỏi: <strong>{{ exam.questions.length }}</strong></li>
            <li class="mb-1"><i class="bi bi-calendar-event me-2"></i>Bắt đầu: {{ formatDateTime(exam.startAt) }}</li>
            <li><i class="bi bi-calendar-x me-2"></i>Kết thúc: {{ formatDateTime(exam.endAt) }}</li>
          </ul>
          <div class="alert alert-light border small">
            Đồng hồ đếm ngược bắt đầu ngay khi bạn bấm "Bắt đầu". Hệ thống sẽ tự động nộp bài khi hết giờ.
          </div>
          <button id="start-exam-btn" type="button" class="btn btn-dark" :disabled="starting" @click="begin">
            <span v-if="starting" class="spinner-border spinner-border-sm me-1"></span>Bắt đầu làm bài
          </button>
        </div>
      </div>
    </div>

    <!-- Đang làm bài -->
    <div v-else class="row g-3">
      <div class="col-12 col-lg-9">
        <div class="card p-3 mb-3 d-flex flex-row justify-content-between align-items-center flex-wrap gap-2">
          <div>
            <h1 class="h6 fw-bold mb-0">{{ exam.title }}</h1>
            <div class="small text-muted">Đã trả lời {{ answeredCount }}/{{ exam.questions.length }} câu</div>
          </div>
          <div class="fs-5 fw-bold font-monospace" :class="{ 'text-danger': remaining <= 60 }" aria-live="polite">
            <i class="bi bi-stopwatch me-1"></i>{{ clock }}
          </div>
        </div>

        <div class="progress mb-3" style="height: 6px;">
          <div class="progress-bar bg-dark" role="progressbar" :style="{ width: progress + '%' }"></div>
        </div>

        <QuestionBody
          :key="current.id"
          :question="current"
          :index="currentIndex + 1"
          show-meta
          :model-value="answers[current.id] ?? (current.type === 'multiple_choice' ? [] : '')"
          @update:model-value="v => setAnswer(current.id, v)"
        />

        <div class="d-flex justify-content-between">
          <button type="button" class="btn btn-outline-dark" :disabled="currentIndex === 0" @click="currentIndex--">
            <i class="bi bi-chevron-left me-1"></i>Câu trước
          </button>
          <button v-if="currentIndex < exam.questions.length - 1" type="button" class="btn btn-dark" @click="currentIndex++">
            Câu sau<i class="bi bi-chevron-right ms-1"></i>
          </button>
          <button v-else id="submit-exam-btn" type="button" class="btn btn-dark" @click="showConfirm = true">Nộp bài</button>
        </div>
      </div>

      <div class="col-12 col-lg-3">
        <div class="card p-3 sticky-lg-top" style="top: 80px;">
          <div class="fw-semibold small mb-2">Danh sách câu hỏi</div>
          <div class="d-flex flex-wrap gap-2 mb-3">
            <button
              v-for="(q, i) in exam.questions"
              :key="q.id"
              type="button"
              class="btn btn-sm nav-q"
              :class="[
                isAnswered(answers[q.id]) ? 'btn-dark' : 'btn-outline-dark',
                { 'current-q': i === currentIndex }
              ]"
              :aria-label="`Câu ${i + 1}${isAnswered(answers[q.id]) ? ' đã trả lời' : ' chưa trả lời'}`"
              @click="currentIndex = i"
            >{{ i + 1 }}</button>
          </div>
          <div class="small text-muted mb-3">
            <span class="d-inline-block bg-dark rounded me-1" style="width: 10px; height: 10px;"></span>Đã trả lời
            <span class="d-inline-block border border-dark rounded ms-2 me-1" style="width: 10px; height: 10px;"></span>Chưa trả lời
          </div>
          <button type="button" class="btn btn-dark w-100" @click="showConfirm = true">Nộp bài</button>
        </div>
      </div>
    </div>

    <ConfirmModal
      :is-open="showConfirm"
      title="Xác nhận nộp bài"
      :message="confirmMessage"
      confirm-text="Nộp bài"
      variant="dark"
      :loading="submitting"
      @confirm="submit(false)"
      @cancel="showConfirm = false"
    />
  </div>
</template>

<script setup>
import { ref, computed, reactive, onMounted, onBeforeUnmount } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { currentUser } from '@/stores/authState'
import { getExamById, getAttempt, startAttempt, saveDraftAnswers, submitAttempt, checkTakeAccess, isAnswered } from '@/services/exam.service'
import { formatDateTime } from '@/utils/helpers'
import { useToast } from '@/composables/useToast'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import ErrorState from '@/components/common/ErrorState.vue'
import ConfirmModal from '@/components/common/ConfirmModal.vue'
import QuestionBody from '@/components/exams/QuestionBody.vue'

const route = useRoute()
const router = useRouter()
const toast = useToast()

const loading = ref(true)
const error = ref('')
const blocked = ref('')
const starting = ref(false)
const submitting = ref(false)
const showConfirm = ref(false)

const exam = ref(null)
const attempt = ref(null)
const answers = reactive({})
const currentIndex = ref(0)
const remaining = ref(0)

let timer = null
let saveTimer = null
let finished = false

const total = computed(() => exam.value?.questions.length || 0)
const current = computed(() => exam.value.questions[currentIndex.value])
const answeredCount = computed(() => (exam.value?.questions || []).filter(q => isAnswered(answers[q.id])).length)
const progress = computed(() => (total.value ? Math.round((answeredCount.value / total.value) * 100) : 0))
const unansweredCount = computed(() => total.value - answeredCount.value)

const confirmMessage = computed(() =>
  unansweredCount.value
    ? `Bạn còn ${unansweredCount.value} câu chưa trả lời. Bạn có chắc chắn muốn nộp bài?`
    : 'Bạn đã trả lời tất cả câu hỏi. Xác nhận nộp bài?'
)

const clock = computed(() => {
  const m = Math.floor(remaining.value / 60)
  const s = remaining.value % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
})

const deadline = () => {
  const byDuration = new Date(attempt.value.startedAt).getTime() + exam.value.duration * 60 * 1000
  const byWindow = exam.value.endAt ? new Date(exam.value.endAt).getTime() : Infinity
  return Math.min(byDuration, byWindow)
}

const tick = () => {
  remaining.value = Math.max(0, Math.round((deadline() - Date.now()) / 1000))
  if (remaining.value <= 0 && !finished) submit(true)
}

const startTimer = () => {
  tick()
  timer = setInterval(tick, 1000)
}

const setAnswer = (qid, value) => {
  answers[qid] = value
  clearTimeout(saveTimer)
  saveTimer = setTimeout(() => saveDraftAnswers(attempt.value.id, { ...answers }).catch(() => {}), 1200)
}

const begin = async () => {
  starting.value = true
  try {
    attempt.value = await startAttempt(exam.value, currentUser.value)
    startTimer()
  } catch {
    toast.error('Không thể bắt đầu bài làm. Vui lòng thử lại.')
  } finally {
    starting.value = false
  }
}

const submit = async auto => {
  if (finished) return
  finished = true
  clearInterval(timer)
  clearTimeout(saveTimer)
  submitting.value = true
  try {
    const saved = await submitAttempt(attempt.value, exam.value, { ...answers }, auto)
    showConfirm.value = false
    toast[auto ? 'warning' : 'success'](auto ? 'Hết giờ, hệ thống đã tự động nộp bài.' : 'Nộp bài thành công.')
    router.replace(`/results/${saved.id}`)
  } catch {
    finished = false
    submitting.value = false
    if (!auto) startTimer()
    toast.error('Nộp bài thất bại. Vui lòng thử lại.')
  }
}

const load = async () => {
  loading.value = true
  error.value = ''
  try {
    const e = await getExamById(route.params.id)
    const existing = e ? await getAttempt(e.id, currentUser.value.uid) : null
    const access = checkTakeAccess(e, currentUser.value, existing)
    if (!access.ok) {
      blocked.value = access.reason
      return
    }
    exam.value = e
    if (existing) {
      attempt.value = existing
      Object.assign(answers, existing.answers)
      startTimer()
    }
  } catch {
    error.value = 'Không thể tải đề thi.'
  } finally {
    loading.value = false
  }
}

onMounted(load)
onBeforeUnmount(() => {
  clearInterval(timer)
  clearTimeout(saveTimer)
})
</script>

<style scoped>
.nav-q {
  width: 38px;
}
.current-q {
  box-shadow: 0 0 0 3px rgba(17, 24, 39, 0.25);
}
</style>
