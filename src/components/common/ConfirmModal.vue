<template>
  <div
    v-if="isOpen"
    class="modal fade show d-block"
    tabindex="-1"
    style="background-color: rgba(0, 0, 0, 0.5);"
    @click.self="handleCancel"
  >
    <div class="modal-dialog modal-dialog-centered">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title d-flex align-items-center gap-2">
            <i :class="[iconClass, iconColorClass]"></i>
            <span>{{ title }}</span>
          </h5>
          <button
            type="button"
            class="btn-close"
            :disabled="loading"
            aria-label="Đóng"
            @click="handleCancel"
          ></button>
        </div>
        <div class="modal-body py-4">
          <p class="mb-0 text-secondary" style="white-space: pre-line;">{{ message }}</p>
        </div>
        <div class="modal-footer bg-light border-top">
          <button
            type="button"
            class="btn btn-outline-secondary"
            :disabled="loading"
            @click="handleCancel"
          >
            {{ cancelText }}
          </button>
          <button
            type="button"
            :class="['btn', confirmButtonClass]"
            :disabled="loading"
            @click="handleConfirm"
          >
            <span
              v-if="loading"
              class="spinner-border spinner-border-sm me-1"
              role="status"
              aria-hidden="true"
            ></span>
            {{ confirmText }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false
  },
  title: {
    type: String,
    default: 'Xác nhận'
  },
  message: {
    type: String,
    default: 'Bạn có chắc chắn muốn thực hiện thao tác này?'
  },
  confirmText: {
    type: String,
    default: 'Đồng ý'
  },
  cancelText: {
    type: String,
    default: 'Hủy bỏ'
  },
  variant: {
    type: String,
    default: 'danger' // 'danger', 'dark', 'warning', 'primary'
  },
  loading: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['confirm', 'cancel'])

const confirmButtonClass = computed(() => {
  switch (props.variant) {
    case 'danger': return 'btn-danger'
    case 'warning': return 'btn-warning text-dark'
    case 'primary':
    case 'dark': return 'btn-dark'
    default: return 'btn-dark'
  }
})

const iconClass = computed(() => {
  switch (props.variant) {
    case 'danger': return 'bi bi-exclamation-triangle'
    case 'warning': return 'bi bi-question-circle'
    default: return 'bi bi-info-circle'
  }
})

const iconColorClass = computed(() => {
  switch (props.variant) {
    case 'danger': return 'text-danger'
    case 'warning': return 'text-warning'
    default: return 'text-dark'
  }
})

const handleConfirm = () => {
  emit('confirm')
}

const handleCancel = () => {
  if (!props.loading) {
    emit('cancel')
  }
}
</script>
