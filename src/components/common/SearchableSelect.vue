<template>
  <div ref="rootRef" class="position-relative searchable-select">
    <!-- Trigger Button -->
    <button
      type="button"
      class="form-select text-start d-flex justify-content-between align-items-center"
      :class="{
        'disabled text-muted bg-light': disabled,
        'is-open': isOpen,
        'form-select-sm': size === 'sm'
      }"
      :disabled="disabled"
      @click="toggleDropdown"
    >
      <span class="text-truncate me-2" :class="{ 'text-muted': !selectedLabel }">
        {{ selectedLabel || placeholder }}
      </span>
    </button>

    <!-- Dropdown Menu -->
    <div
      v-if="isOpen && !disabled"
      class="dropdown-menu show p-2 shadow-sm border mt-1 w-100"
      style="z-index: 1100; max-height: 280px; display: flex; flex-direction: column;"
    >
      <!-- Search Input Box -->
      <div class="mb-2">
        <input
          ref="searchInputRef"
          v-model="searchQuery"
          type="search"
          class="form-control form-control-sm px-3 py-2"
          :placeholder="searchPlaceholder || 'Gõ để tìm kiếm...'"
          @keydown.esc="closeDropdown"
        />
      </div>

      <!-- Options List -->
      <div class="options-list flex-grow-1 overflow-auto" style="max-height: 200px;">
        <!-- Tùy chọn mặc định / xóa chọn (nếu có) -->
        <button
          v-if="allowClear"
          type="button"
          class="dropdown-item py-2 rounded small text-muted d-flex align-items-center justify-content-between"
          :class="{ active: !modelValue }"
          @click="selectOption(null)"
        >
          <span>{{ clearLabel || '— Mặc định —' }}</span>
          <i v-if="!modelValue" class="bi bi-check-lg"></i>
        </button>

        <!-- Danh sách options -->
        <button
          v-for="opt in filteredOptions"
          :key="getOptionValue(opt)"
          type="button"
          class="dropdown-item py-2 rounded small d-flex align-items-center justify-content-between"
          :class="{ active: modelValue === getOptionValue(opt) }"
          @click="selectOption(opt)"
        >
          <div class="text-truncate me-2">
            <span>{{ getOptionLabel(opt) }}</span>
            <small v-if="getOptionSubLabel(opt)" class="text-muted ms-1">({{ getOptionSubLabel(opt) }})</small>
          </div>
          <i v-if="modelValue === getOptionValue(opt)" class="bi bi-check-lg flex-shrink-0"></i>
        </button>

        <!-- Không có kết quả -->
        <div v-if="!filteredOptions.length" class="text-muted small text-center py-3">
          <i class="bi bi-search me-1"></i>Không tìm thấy kết quả
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount, nextTick } from 'vue'

const props = defineProps({
  modelValue: { type: [String, Number], default: '' },
  options: { type: Array, default: () => [] },
  placeholder: { type: String, default: '-- Chọn --' },
  searchPlaceholder: { type: String, default: 'Tìm kiếm...' },
  disabled: { type: Boolean, default: false },
  valueKey: { type: String, default: 'id' },
  labelKey: { type: String, default: 'name' },
  subLabelKey: { type: String, default: '' },
  allowClear: { type: Boolean, default: false },
  clearLabel: { type: String, default: 'Tất cả' },
  size: { type: String, default: '' }
})

const emit = defineEmits(['update:modelValue', 'change'])

const rootRef = ref(null)
const searchInputRef = ref(null)
const isOpen = ref(false)
const searchQuery = ref('')

const getOptionValue = opt => (typeof opt === 'object' ? opt[props.valueKey] : opt)
const getOptionLabel = opt => (typeof opt === 'object' ? opt[props.labelKey] : opt)
const getOptionSubLabel = opt => (props.subLabelKey && typeof opt === 'object' ? opt[props.subLabelKey] : '')

const selectedOption = computed(() =>
  props.options.find(opt => String(getOptionValue(opt)) === String(props.modelValue))
)

const selectedLabel = computed(() => {
  if (selectedOption.value) {
    const label = getOptionLabel(selectedOption.value)
    const sub = getOptionSubLabel(selectedOption.value)
    return sub ? `${label} (${sub})` : label
  }
  if (props.allowClear && !props.modelValue) {
    return props.clearLabel
  }
  return ''
})

const filteredOptions = computed(() => {
  const query = searchQuery.value.trim().toLowerCase()
  if (!query) return props.options
  return props.options.filter(opt => {
    const label = String(getOptionLabel(opt) || '').toLowerCase()
    const sub = String(getOptionSubLabel(opt) || '').toLowerCase()
    return label.includes(query) || sub.includes(query)
  })
})

const toggleDropdown = () => {
  if (props.disabled) return
  isOpen.value = !isOpen.value
  if (isOpen.value) {
    searchQuery.value = ''
    nextTick(() => {
      searchInputRef.value?.focus()
    })
  }
}

const closeDropdown = () => {
  isOpen.value = false
  searchQuery.value = ''
}

const selectOption = opt => {
  const val = opt ? getOptionValue(opt) : ''
  emit('update:modelValue', val)
  emit('change', val)
  closeDropdown()
}

const handleClickOutside = event => {
  if (rootRef.value && !rootRef.value.contains(event.target)) {
    closeDropdown()
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

<style scoped>
.searchable-select .form-select {
  cursor: pointer;
}
.searchable-select .form-select.disabled {
  cursor: not-allowed;
}
.searchable-select .dropdown-item.active {
  background-color: #111827 !important;
  color: #ffffff !important;
}
.searchable-select .dropdown-item:hover:not(.active) {
  background-color: #f3f4f6;
  color: #111827;
}
.options-list::-webkit-scrollbar {
  width: 5px;
}
.options-list::-webkit-scrollbar-thumb {
  background: #d1d5db;
  border-radius: 4px;
}
</style>
