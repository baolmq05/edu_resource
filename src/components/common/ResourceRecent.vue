<template>
  <div class="card h-100">
    <div class="card-header d-flex justify-content-between align-items-center">
      <span class="fw-semibold">Tài liệu & Đề mẫu gần đây</span>
      <router-link to="/resources" class="small text-dark">Xem tất cả</router-link>
    </div>
    <ul class="list-group list-group-flush">
      <li v-for="item in items" :key="item.type + item.id" class="list-group-item d-flex justify-content-between align-items-center">
        <span>
          <i :class="[getIcon(item.type), 'me-2']"></i>{{ item.title }}
        </span>
        <span class="small text-muted">{{ formatDate(item.createdAt) }}</span>
      </li>
      <li v-if="!items.length" class="list-group-item text-muted small">Chưa có tài liệu hoặc đề mẫu nào.</li>
    </ul>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { formatDate } from '@/utils/helpers'

const props = defineProps({
  plans: { type: Array, default: () => [] },
  slides: { type: Array, default: () => [] },
  samples: { type: Array, default: () => [] }
})

const getIcon = type => {
  if (type === 'plan') return 'bi bi-file-earmark-text'
  if (type === 'slide') return 'bi bi-file-earmark-slides'
  return 'bi bi-file-earmark-check'
}

const items = computed(() => [
  ...props.plans.slice(0, 2).map(p => ({ ...p, type: 'plan' })),
  ...props.slides.slice(0, 2).map(s => ({ ...s, type: 'slide' })),
  ...props.samples.slice(0, 2).map(s => ({ ...s, type: 'sample' }))
])
</script>
