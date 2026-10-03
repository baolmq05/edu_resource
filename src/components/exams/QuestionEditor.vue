<template>
  <div class="card mb-3">
    <div class="card-header d-flex flex-wrap justify-content-between align-items-center gap-2">
      <span class="fw-semibold">Câu {{ index }}</span>
      <div class="d-flex align-items-center gap-2">
        <select :id="`qt-${question.id}`" :value="question.type" class="form-select form-select-sm" style="width: 210px;" aria-label="Loại câu hỏi" @change="changeType($event.target.value)">
          <option v-for="(label, key) in QUESTION_TYPES" :key="key" :value="key">{{ label }}</option>
        </select>
        <div class="input-group input-group-sm" style="width: 120px;">
          <input v-model.number="question.points" type="number" min="0.5" step="0.5" class="form-control" aria-label="Điểm" />
          <span class="input-group-text">điểm</span>
        </div>
        <div class="btn-group btn-group-sm">
          <button type="button" class="btn btn-outline-dark" title="Lên" :disabled="index === 1" @click="$emit('move', -1)"><i class="bi bi-arrow-up"></i></button>
          <button type="button" class="btn btn-outline-dark" title="Xuống" :disabled="index === total" @click="$emit('move', 1)"><i class="bi bi-arrow-down"></i></button>
          <button type="button" class="btn btn-outline-danger" title="Xóa câu hỏi" @click="$emit('remove')"><i class="bi bi-trash"></i></button>
        </div>
      </div>
    </div>

    <div class="card-body">
      <textarea v-model="question.content" class="form-control mb-3" rows="2" placeholder="Nội dung câu hỏi..." aria-label="Nội dung câu hỏi"></textarea>

      <!-- Trắc nghiệm -->
      <template v-if="isChoice">
        <div class="small text-muted mb-2">
          {{ question.type === 'multiple_choice' ? 'Tích chọn tất cả đáp án đúng' : 'Chọn một đáp án đúng' }}
        </div>
        <div v-for="o in question.options" :key="o.id" class="input-group input-group-sm mb-2">
          <div class="input-group-text">
            <input
              v-if="question.type === 'multiple_choice'"
              type="checkbox"
              class="form-check-input mt-0"
              :checked="question.correctAnswer.includes(o.id)"
              :aria-label="`Đáp án ${o.id} đúng`"
              @change="toggleCorrect(o.id)"
            />
            <input
              v-else
              type="radio"
              class="form-check-input mt-0"
              :name="`correct-${question.id}`"
              :checked="question.correctAnswer === o.id"
              :aria-label="`Đáp án ${o.id} đúng`"
              @change="question.correctAnswer = o.id"
            />
          </div>
          <span class="input-group-text fw-semibold">{{ o.id }}</span>
          <input v-model="o.content" class="form-control" :placeholder="`Phương án ${o.id}`" />
          <button type="button" class="btn btn-outline-secondary" :disabled="question.options.length <= 2" title="Xóa phương án" @click="removeOption(o.id)">
            <i class="bi bi-x-lg"></i>
          </button>
        </div>
        <button type="button" class="btn btn-outline-dark btn-sm" :disabled="question.options.length >= 6" @click="addOption">
          <i class="bi bi-plus-lg me-1"></i>Thêm phương án
        </button>
      </template>

      <!-- Đúng / Sai -->
      <div v-else-if="question.type === 'true_false'" class="d-flex gap-3">
        <div class="form-check">
          <input :id="`tf-t-${question.id}`" v-model="question.correctAnswer" class="form-check-input" type="radio" :name="`tf-${question.id}`" value="true" />
          <label :for="`tf-t-${question.id}`" class="form-check-label">Đáp án đúng: Đúng</label>
        </div>
        <div class="form-check">
          <input :id="`tf-f-${question.id}`" v-model="question.correctAnswer" class="form-check-input" type="radio" :name="`tf-${question.id}`" value="false" />
          <label :for="`tf-f-${question.id}`" class="form-check-label">Đáp án đúng: Sai</label>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { QUESTION_TYPES } from '@/utils/helpers'

// Component chỉnh sửa trực tiếp object `question` do ExamEditView sở hữu
const props = defineProps({
  question: { type: Object, required: true },
  index: { type: Number, required: true },
  total: { type: Number, required: true }
})
defineEmits(['move', 'remove'])

const isChoice = computed(() => ['single_choice', 'multiple_choice'].includes(props.question.type))
const LETTERS = 'ABCDEF'

const changeType = type => {
  const q = props.question
  q.type = type
  if (type === 'single_choice' || type === 'multiple_choice') {
    if (!q.options.length) q.options = LETTERS.slice(0, 4).split('').map(id => ({ id, content: '' }))
    q.correctAnswer = type === 'multiple_choice' ? [] : ''
  } else {
    q.options = []
    q.correctAnswer = 'true'
  }
}

const toggleCorrect = id => {
  const list = props.question.correctAnswer
  props.question.correctAnswer = list.includes(id) ? list.filter(x => x !== id) : [...list, id]
}

const addOption = () => {
  const q = props.question
  q.options.push({ id: LETTERS[q.options.length], content: '' })
}

const removeOption = id => {
  const q = props.question
  const remaining = q.options.filter(o => o.id !== id)
  const map = {}
  q.options = remaining.map((o, i) => {
    map[o.id] = LETTERS[i]
    return { ...o, id: LETTERS[i] }
  })
  if (Array.isArray(q.correctAnswer)) q.correctAnswer = q.correctAnswer.filter(x => map[x]).map(x => map[x])
  else q.correctAnswer = map[q.correctAnswer] || ''
}
</script>
