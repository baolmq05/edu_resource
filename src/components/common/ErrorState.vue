<template>
  <div class="card p-5 text-center my-4 bg-white border-danger-subtle">
    <i class="bi bi-exclamation-octagon display-5 text-danger mb-3"></i>
    <h5 class="fw-bold text-dark">{{ title }}</h5>
    <p class="text-muted mb-3">{{ message }}</p>
    <div>
      <button type="button" class="btn btn-dark btn-sm" @click="$emit('retry')">
        <i class="bi bi-arrow-clockwise me-1"></i>Thử lại
      </button>
    </div>
  </div>
</template>

<script setup>
defineProps({
  title: { type: String, default: 'Không thể tải dữ liệu' },
  message: { type: String, default: 'Đã xảy ra lỗi khi kết nối máy chủ. Vui lòng thử lại.' }
})
defineEmits(['retry'])
</script>
