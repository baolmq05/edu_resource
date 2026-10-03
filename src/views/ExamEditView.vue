<template>
  <div class="container-xl py-4">
    <nav aria-label="breadcrumb">
      <ol class="breadcrumb small">
        <li class="breadcrumb-item"><router-link to="/exams" class="text-dark">Bài kiểm tra</router-link></li>
        <li class="breadcrumb-item active">{{ isEdit ? 'Chỉnh sửa bài kiểm tra' : 'Tạo bài kiểm tra mới' }}</li>
      </ol>
    </nav>

    <LoadingSpinner v-if="loading" />
    <ErrorState v-else-if="error" :message="error" @retry="load" />

    <template v-else>
      <div class="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
        <h1 class="h4 fw-bold mb-0">{{ isEdit ? 'Chỉnh sửa bài kiểm tra' : 'Tạo bài kiểm tra mới' }}</h1>
        <span v-if="isEdit" class="badge" :class="EXAM_STATUS[form.status].badge">{{ EXAM_STATUS[form.status].label
        }}</span>
      </div>

      <div v-if="!classes.length" class="alert alert-light border">
        Bạn chưa được phân công lớp nào nên chưa thể tạo đề. Vui lòng liên hệ quản trị viên.
      </div>

      <form @submit.prevent="save(false)">
        <!-- Thông tin đề -->
        <div class="card p-4 mb-3">
          <h2 class="h6 fw-bold mb-3">Thông tin đề</h2>
          <div class="row g-3">
            <div class="col-12">
              <label for="ex-title" class="form-label small fw-semibold">Tên đề</label>
              <input id="ex-title" v-model="form.title" class="form-control" placeholder="VD: Kiểm tra giữa kỳ Toán 10"
                required />
            </div>
            <div class="col-12 col-md-4">
              <label class="form-label small fw-semibold">Môn học <span class="text-danger">*</span></label>
              <SearchableSelect
                v-model="form.subjectId"
                :options="subjects"
                value-key="id"
                label-key="name"
                placeholder="-- Chọn môn --"
                search-placeholder="Tìm môn học..."
              />
            </div>
            <div class="col-12 col-md-4">
              <label class="form-label small fw-semibold">Phạm vi áp dụng <span class="text-danger">*</span></label>
              <SearchableSelect
                v-model="form.classId"
                :options="scopeOptions"
                value-key="id"
                label-key="name"
                sub-label-key="sub"
                placeholder="-- Chọn lớp hoặc Toàn trường --"
                search-placeholder="Tìm lớp hoặc Toàn trường..."
              />
            </div>
            <div class="col-12 col-md-4">
              <label for="ex-duration" class="form-label small fw-semibold">Thời gian làm bài (phút)</label>
              <input id="ex-duration" v-model.number="form.duration" type="number" min="1" class="form-control"
                required />
            </div>
            <div class="col-12 col-md-6">
              <label for="ex-start" class="form-label small fw-semibold">Thời gian bắt đầu</label>
              <input id="ex-start" v-model="form.startAt" type="datetime-local" class="form-control" required />
            </div>
            <div class="col-12 col-md-6">
              <label for="ex-end" class="form-label small fw-semibold">Thời gian kết thúc</label>
              <input id="ex-end" v-model="form.endAt" type="datetime-local" class="form-control" required />
            </div>
            <div class="col-12">
              <label for="ex-desc" class="form-label small fw-semibold">Mô tả</label>
              <textarea id="ex-desc" v-model="form.description" class="form-control" rows="2"></textarea>
            </div>
            <div class="col-12">
              <div class="form-check">
                <input id="ex-show" v-model="form.showAnswers" class="form-check-input" type="checkbox" />
                <label for="ex-show" class="form-check-label small">Cho phép học sinh xem chi tiết đáp án sau khi nộp
                  bài</label>
              </div>
            </div>
          </div>
        </div>

        <!-- Câu hỏi -->
        <div class="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-2">
          <h2 class="h6 fw-bold mb-0">Câu hỏi ({{ form.questions.length }} câu • {{ totalPoints }} điểm)</h2>
          <div class="btn-group btn-group-sm">
            <button type="button" class="btn" :class="!preview ? 'btn-dark' : 'btn-outline-dark'"
              @click="preview = false">Soạn thảo</button>
            <button type="button" class="btn" :class="preview ? 'btn-dark' : 'btn-outline-dark'"
              @click="preview = true">Xem trước</button>
          </div>
        </div>

        <EmptyState v-if="!form.questions.length" icon="bi bi-patch-question" title="Đề chưa có câu hỏi"
          description="Thêm câu hỏi đầu tiên cho đề này." />

        <template v-if="!preview">
          <QuestionEditor v-for="(q, i) in form.questions" :key="q.id" :question="q" :index="i + 1"
            :total="form.questions.length" @move="dir => moveQuestion(i, dir)" @remove="questionToDelete = i" />
        </template>
        <template v-else>
          <QuestionBody v-for="(q, i) in form.questions" :key="q.id" :question="q" :index="i + 1" readonly show-correct
            show-meta :model-value="q.type === 'multiple_choice' ? [] : ''" />
        </template>

        <div v-if="!preview" class="mb-4">
          <div class="dropdown d-inline-block">
            <button id="add-question-btn" class="btn btn-outline-dark btn-sm dropdown-toggle" type="button"
              data-bs-toggle="dropdown" aria-expanded="false">
              <i class="bi bi-plus-lg me-1"></i>Thêm câu hỏi
            </button>
            <ul class="dropdown-menu" style="z-index: 10000;">
              <li v-for="(label, key) in QUESTION_TYPES" :key="key">
                <button type="button" class="dropdown-item" @click="addQuestion(key)">{{ label }}</button>
              </li>
            </ul>
          </div>
        </div>

        <!-- Hành động -->
        <div class="card p-3 d-flex flex-row flex-wrap justify-content-end gap-2 sticky-bottom">
          <router-link to="/exams" class="btn btn-outline-secondary">Hủy</router-link>
          <button id="save-exam-btn" type="submit" class="btn btn-outline-dark" :disabled="saving || !classes.length">
            <span v-if="saving" class="spinner-border spinner-border-sm me-1"></span>Lưu
          </button>
          <button id="publish-exam-btn" type="button" class="btn btn-dark" :disabled="saving || !classes.length"
            @click="save(true)">
            Lưu và xuất bản
          </button>
        </div>
      </form>
    </template>

    <ConfirmModal :is-open="questionToDelete !== null" title="Xóa câu hỏi"
      :message="`Xóa câu ${questionToDelete + 1} khỏi đề?`" confirm-text="Xóa câu hỏi" @confirm="removeQuestion"
      @cancel="questionToDelete = null" />
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { currentUser, isAdmin } from '@/stores/authState'
import { getExamById, createExam, updateExam } from '@/services/exam.service'
import { getSubjects } from '@/services/subject.service'
import { getClassesForUser } from '@/services/class.service'
import { EXAM_STATUS, QUESTION_TYPES, toLocalInput, fromLocalInput, uid } from '@/utils/helpers'
import { useToast } from '@/composables/useToast'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import ErrorState from '@/components/common/ErrorState.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import ConfirmModal from '@/components/common/ConfirmModal.vue'
import QuestionEditor from '@/components/exams/QuestionEditor.vue'
import QuestionBody from '@/components/exams/QuestionBody.vue'
import SearchableSelect from '@/components/common/SearchableSelect.vue'

const route = useRoute()
const router = useRouter()
const toast = useToast()

const isEdit = computed(() => Boolean(route.params.id))
const loading = ref(true)
const saving = ref(false)
const error = ref('')
const preview = ref(false)
const questionToDelete = ref(null)

const subjects = ref([])
const classes = ref([])

const scopeOptions = computed(() => [
  { id: 'all', name: 'Toàn trường', sub: 'Tất cả học sinh' },
  ...classes.value.map(c => ({ id: c.id, name: `Lớp ${c.name}`, sub: `Khối ${c.grade}` }))
])

const form = reactive({
  title: '',
  description: '',
  subjectId: '',
  classId: '',
  duration: 45,
  startAt: '',
  endAt: '',
  showAnswers: false,
  status: 'draft',
  questions: []
})

const totalPoints = computed(() => form.questions.reduce((s, q) => s + (Number(q.points) || 0), 0))

const newQuestion = type => ({
  id: uid('q'),
  type,
  content: '',
  points: 1,
  options: ['single_choice', 'multiple_choice'].includes(type)
    ? ['A', 'B', 'C', 'D'].map(id => ({ id, content: '' }))
    : [],
  correctAnswer: type === 'multiple_choice' ? [] : type === 'true_false' ? 'true' : ''
})

const addQuestion = type => form.questions.push(newQuestion(type))

const moveQuestion = (i, dir) => {
  const j = i + dir
  if (j < 0 || j >= form.questions.length) return
  const list = form.questions
    ;[list[i], list[j]] = [list[j], list[i]]
}

const removeQuestion = () => {
  form.questions.splice(questionToDelete.value, 1)
  questionToDelete.value = null
}

const load = async () => {
  loading.value = true
  error.value = ''
  try {
    const [s, c] = await Promise.all([getSubjects({ onlyActive: true }), getClassesForUser(currentUser.value)])
    subjects.value = s
    classes.value = c

    if (isEdit.value) {
      const exam = await getExamById(route.params.id)
      if (!exam) {
        error.value = 'Không tìm thấy đề thi.'
        return
      }
      if (!isAdmin.value && exam.createdBy !== currentUser.value.uid) {
        error.value = 'Bạn chỉ được chỉnh sửa đề do chính mình tạo.'
        return
      }
      Object.assign(form, {
        title: exam.title,
        description: exam.description || '',
        subjectId: exam.subjectId,
        classId: exam.classId,
        duration: exam.duration,
        startAt: toLocalInput(exam.startAt),
        endAt: toLocalInput(exam.endAt),
        showAnswers: Boolean(exam.showAnswers),
        status: exam.status,
        questions: exam.questions.map(q => ({ ...q, options: q.options.map(o => ({ ...o })) }))
      })
    } else {
      const now = new Date()
      const week = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
      form.startAt = toLocalInput(now.toISOString())
      form.endAt = toLocalInput(week.toISOString())
      if (c.length === 1) form.classId = c[0].id
      if (!form.questions.length) addQuestion('single_choice')
    }
  } catch {
    error.value = 'Không thể tải dữ liệu để soạn đề.'
  } finally {
    loading.value = false
  }
}

const validate = publish => {
  if (!form.subjectId) return 'Vui lòng chọn môn học cho bài kiểm tra.'
  if (!form.classId) return 'Vui lòng chọn phạm vi áp dụng (lớp học hoặc Toàn trường).'
  if (form.classId !== 'all' && !classes.value.some(c => c.id === form.classId)) {
    return 'Bạn chỉ được gán đề cho lớp mà mình phụ trách hoặc chọn Toàn trường.'
  }
  if (!(form.duration > 0)) return 'Thời gian làm bài phải lớn hơn 0.'
  if (new Date(form.endAt) <= new Date(form.startAt)) return 'Thời gian kết thúc phải sau thời gian bắt đầu.'
  if (publish && !form.questions.length) return 'Đề cần có ít nhất một câu hỏi để xuất bản.'

  for (let i = 0; i < form.questions.length; i++) {
    const q = form.questions[i]
    const n = i + 1
    if (!q.content.trim()) return `Câu ${n}: chưa nhập nội dung.`
    if (!(Number(q.points) > 0)) return `Câu ${n}: điểm phải lớn hơn 0.`
    if (['single_choice', 'multiple_choice'].includes(q.type)) {
      if (q.options.some(o => !o.content.trim())) return `Câu ${n}: có phương án chưa nhập nội dung.`
      const hasCorrect = Array.isArray(q.correctAnswer) ? q.correctAnswer.length > 0 : Boolean(q.correctAnswer)
      if (!hasCorrect) return `Câu ${n}: chưa chọn đáp án đúng.`
    }
  }
  return ''
}

const save = async publish => {
  const problem = validate(publish)
  if (problem) {
    toast.warning(problem)
    return
  }
  saving.value = true
  try {
    const classObj = classes.value.find(c => c.id === form.classId)
    const payload = {
      ...form,
      grade: classObj ? classObj.grade : 0,
      startAt: fromLocalInput(form.startAt),
      endAt: fromLocalInput(form.endAt),
      status: publish ? 'published' : form.status
    }
    if (isEdit.value) await updateExam(route.params.id, payload)
    else await createExam(payload, currentUser.value)
    toast.success(publish ? 'Đã lưu và xuất bản đề.' : 'Đã lưu đề.')
    router.push('/exams')
  } catch {
    toast.error('Không thể lưu đề. Vui lòng thử lại.')
  } finally {
    saving.value = false
  }
}

onMounted(load)
</script>
