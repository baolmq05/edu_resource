<template>
  <div class="card mb-3">
    <div class="card-body">
      <div class="d-flex justify-content-between align-items-start mb-2 gap-2">
        <div class="fw-semibold">
          Câu {{ index }}
          <span v-if="showMeta" class="badge bg-light text-dark border ms-2">{{ QUESTION_TYPES[question.type] }} • {{ question.points }} điểm</span>
        </div>
        <span v-if="statusLabel" class="badge" :class="statusBadge">{{ statusLabel }}</span>
      </div>

      <p class="mb-3" style="white-space: pre-line;">{{ question.content }}</p>

      <!-- Trắc nghiệm một đáp án / nhiều đáp án -->
      <div v-if="isChoice" class="d-flex flex-column gap-2">
        <label
          v-for="o in question.options"
          :key="o.id"
          class="d-flex align-items-center gap-2 border rounded p-2 option-row"
          :class="optionClass(o.id)"
        >
          <input
            :type="question.type === 'multiple_choice' ? 'checkbox' : 'radio'"
            class="form-check-input mt-0"
            :name="`q-${question.id}`"
            :checked="isSelected(o.id)"
            :disabled="readonly"
            @change="toggle(o.id)"
          />
          <span class="fw-semibold">{{ o.id }}.</span>
          <span>{{ o.content || o.text }}</span>
          <i v-if="showCorrect && isCorrectOption(o.id)" class="bi bi-check-circle ms-auto"></i>
        </label>
      </div>

      <!-- Đúng / Sai -->
      <div v-else-if="question.type === 'true_false'" class="d-flex gap-2">
        <label
          v-for="o in TF"
          :key="o.value"
          class="flex-fill d-flex align-items-center gap-2 border rounded p-2 option-row"
          :class="optionClass(o.value)"
        >
          <input type="radio" class="form-check-input mt-0" :name="`q-${question.id}`" :checked="modelValue === o.value" :disabled="readonly" @change="emit('update:modelValue', o.value)" />
          {{ o.label }}
          <i v-if="showCorrect && String(question.correctAnswer) === o.value" class="bi bi-check-circle ms-auto"></i>
        </label>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { QUESTION_TYPES } from '@/utils/helpers'

const props = defineProps({
  question: { type: Object, required: true },
  index: { type: Number, required: true },
  modelValue: { type: [String, Array], default: '' },
  readonly: Boolean,
  showCorrect: Boolean, // tô đáp án đúng
  showMeta: Boolean, // hiện loại câu và điểm
  statusLabel: { type: String, default: '' },
  statusBadge: { type: String, default: 'bg-light text-dark border' }
})
const emit = defineEmits(['update:modelValue'])

const TF = [
  { value: 'true', label: 'Đúng' },
  { value: 'false', label: 'Sai' }
]

const isChoice = computed(() => ['single_choice', 'multiple_choice'].includes(props.question.type))

const selected = computed(() => (Array.isArray(props.modelValue) ? props.modelValue : props.modelValue ? [props.modelValue] : []))
const isSelected = id => selected.value.includes(id)

const correctList = computed(() => {
  const c = props.question.correctAnswer
  return Array.isArray(c) ? c : c ? [c] : []
})
const isCorrectOption = id => correctList.value.includes(id)

const toggle = id => {
  if (props.question.type === 'multiple_choice') {
    const next = isSelected(id) ? selected.value.filter(x => x !== id) : [...selected.value, id]
    emit('update:modelValue', next)
  } else {
    emit('update:modelValue', id)
  }
}

const optionClass = id => {
  if (!props.showCorrect) return isSelected(id) || props.modelValue === id ? 'border-dark bg-light' : ''
  const correct = isCorrectOption(id) || String(props.question.correctAnswer) === id
  const chosen = isSelected(id) || props.modelValue === id
  if (correct) return 'border-success bg-success-subtle'
  if (chosen) return 'border-danger bg-danger-subtle'
  return ''
}
</script>

<style scoped>
.option-row {
  cursor: pointer;
}
</style>
