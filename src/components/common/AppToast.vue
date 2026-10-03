<template>
  <div class="toast-container position-fixed bottom-0 end-0 p-3" style="z-index: 1090;">
    <div
      v-for="t in toasts"
      :key="t.id"
      class="toast show shadow-sm mt-2 border"
      :class="getToastBorderClass(t.type)"
      role="alert"
      aria-live="assertive"
      aria-atomic="true"
    >
      <div class="toast-header">
        <i :class="[getIconClass(t.type), getTextColorClass(t.type), 'me-2 fs-6']"></i>
        <strong class="me-auto" :class="getTextColorClass(t.type)">{{ t.title }}</strong>
        <small class="text-muted">Vừa xong</small>
        <button
          type="button"
          class="btn-close ms-2 mb-1"
          aria-label="Đóng"
          @click="removeToast(t.id)"
        ></button>
      </div>
      <div class="toast-body text-dark">
        {{ t.message }}
      </div>
    </div>
  </div>
</template>

<script setup>
import { useToast } from '@/composables/useToast'

const { toasts, removeToast } = useToast()

const getIconClass = (type) => {
  switch (type) {
    case 'success': return 'bi bi-check-circle-fill'
    case 'danger': return 'bi bi-exclamation-triangle-fill'
    case 'warning': return 'bi bi-exclamation-circle-fill'
    default: return 'bi bi-info-circle-fill'
  }
}

const getTextColorClass = (type) => {
  switch (type) {
    case 'success': return 'text-success'
    case 'danger': return 'text-danger'
    case 'warning': return 'text-warning'
    default: return 'text-primary'
  }
}

const getToastBorderClass = (type) => {
  switch (type) {
    case 'success': return 'border-success-subtle'
    case 'danger': return 'border-danger-subtle'
    case 'warning': return 'border-warning-subtle'
    default: return 'border-primary-subtle'
  }
}
</script>
