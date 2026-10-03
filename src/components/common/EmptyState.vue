<template>
  <div class="card p-5 text-center my-4 border border-dashed bg-white">
    <div class="card-body py-4">
      <div class="text-secondary mb-3">
        <i :class="[icon, 'display-4 text-muted']"></i>
      </div>
      <h5 class="card-title fw-bold text-dark mb-2">{{ title }}</h5>
      <p class="card-text text-muted mb-4 mx-auto" style="max-width: 500px;">
        {{ description }}
      </p>
      <button
        v-if="actionText"
        type="button"
        class="btn btn-dark d-inline-flex align-items-center gap-2"
        @click="$emit('action')"
      >
        <i v-if="actionIcon" :class="actionIcon"></i>
        <span>{{ actionText }}</span>
      </button>
    </div>
  </div>
</template>

<script setup>
defineProps({
  icon: {
    type: String,
    default: 'bi bi-folder2-open'
  },
  title: {
    type: String,
    default: 'Chưa có dữ liệu'
  },
  description: {
    type: String,
    default: 'Hiện tại chưa có nội dung nào trong danh mục này hoặc không tìm thấy kết quả phù hợp.'
  },
  actionText: {
    type: String,
    default: ''
  },
  actionIcon: {
    type: String,
    default: 'bi bi-plus-lg'
  }
})

defineEmits(['action'])
</script>

<style scoped>
.border-dashed {
  border-style: dashed !important;
  border-width: 2px !important;
  border-color: #e5e7eb !important;
}
</style>
