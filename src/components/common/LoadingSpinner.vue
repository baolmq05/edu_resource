<template>
  <div class="d-flex flex-column align-items-center justify-content-center p-4" :class="{ 'my-5': center }">
    <div
      class="spinner-border text-dark"
      :class="{ 'spinner-border-sm': size === 'sm' }"
      role="status"
    >
      <span class="visually-hidden">Đang tải...</span>
    </div>
    <p v-if="text" class="text-muted mt-2 mb-0 small">{{ text }}</p>
  </div>
</template>

<script setup>
defineProps({
  text: {
    type: String,
    default: 'Đang tải dữ liệu...'
  },
  size: {
    type: String,
    default: 'md' // 'sm', 'md'
  },
  center: {
    type: Boolean,
    default: true
  }
})
</script>
